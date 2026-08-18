import { create } from 'zustand'
import type { ProjectResponse, DocumentResponse, UploadQueueItem, ProjectIngestionStats } from '@/types/project'
import { projectApi, documentApi, ingestionApi } from '@/services/api'
import { useAuthStore } from './useAuthStore'

const ACTIVE_PROJECT_KEY = 'ragflash_active_project_id'

interface ProjectStore {
  projects: ProjectResponse[]
  activeProjectId: string | null
  isLoadingProjects: boolean
  projectError: string | null

  // Documents state keyed by projectId
  documents: Record<string, DocumentResponse[]>
  isLoadingDocuments: Record<string, boolean>

  // Ingestion Stats keyed by projectId
  projectStats: Record<string, ProjectIngestionStats | null>
  isLoadingStats: Record<string, boolean>

  // Upload progress tracking
  uploadQueue: Record<string, UploadQueueItem[]>

  // Actions
  fetchProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<ProjectResponse>
  updateProject: (id: string, name?: string, description?: string, settings?: Record<string, any>) => Promise<ProjectResponse>
  deleteProject: (id: string) => Promise<void>
  setActiveProject: (id: string | null) => void
  getActiveProject: () => ProjectResponse | undefined

  // Document & Ingestion Actions
  fetchDocuments: (projectId: string) => Promise<void>
  fetchProjectStats: (projectId: string) => Promise<void>
  uploadFiles: (projectId: string, files: File[]) => Promise<void>
  deleteDocument: (documentId: string, projectId: string) => Promise<void>
  batchDeleteDocuments: (documentIds: string[], projectId: string) => Promise<void>
  reindexDocument: (documentId: string, projectId: string) => Promise<void>
  reindexProject: (projectId: string) => Promise<void>
  clearCompletedUploads: (projectId: string) => void
}


const DEFAULT_MOCK_PROJECTS: ProjectResponse[] = [
  {
    id: 'proj-default-1',
    owner_user_id: 'usr-default',
    name: 'Nghiên cứu Thị trường AI',
    description: 'Tập hợp các báo cáo nghiên cứu xu hướng và phân tích thị trường AI năm 2025-2026',
    status: 'active',
    settings: {},
    document_count: 3,
    session_count: 4,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-default-2',
    owner_user_id: 'usr-default',
    name: 'Tài liệu Kiến trúc Phần mềm',
    description: 'Thông số kỹ thuật, sơ đồ kiến trúc và tiêu chuẩn mã nguồn RAGFlash & Search-as-Code',
    status: 'active',
    settings: {},
    document_count: 2,
    session_count: 1,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

function normalizeProgress(progressValue: number | undefined | null): number {
  if (progressValue === undefined || progressValue === null) return 0
  if (progressValue > 1.0) {
    return Math.min(100, Math.max(0, Math.round(progressValue)))
  }
  return Math.min(100, Math.max(0, Math.round(progressValue * 100)))
}


function getStageLabelFromStatus(status: string, lastStep?: string | null): string {
  switch (status) {
    case 'pending':
      return 'Chờ khởi tạo...'
    case 'checking_cache':
      return 'Kiểm tra hash Blake3...'
    case 'parsing':
      return 'Docling OCR & bóc tách...'
    case 'summarizing':
      return 'Tóm tắt ngữ nghĩa tài liệu...'
    case 'chunking':
      return 'Cắt đoạn Chunks & Khử trùng...'
    case 'deduping':
    case 'dedup':
      return 'Khử trùng lặp Chunks...'
    case 'enriching':
    case 'enrich':
      return 'Bổ sung ngữ cảnh Chunks...'
    case 'embedding':
    case 'embed':
      return 'Sinh Vector Embeddings...'
    case 'saving':
    case 'link':
      return 'Lưu vào Qdrant & Database...'
    case 'completed':
    case 'completed_with_warnings':
      return 'Hoàn tất 100%'
    case 'failed':
      return `Lỗi tại bước: ${lastStep || 'Không xác định'}`
    default:
      return status || 'Đang xử lý...'
  }
}


export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: typeof localStorage !== 'undefined' ? localStorage.getItem(ACTIVE_PROJECT_KEY) : null,
  isLoadingProjects: false,
  projectError: null,
  documents: {},
  isLoadingDocuments: {},
  projectStats: {},
  isLoadingStats: {},
  uploadQueue: {},


  getActiveProject: () => {
    const { projects, activeProjectId } = get()
    return projects.find((p) => p.id === activeProjectId) || projects[0]
  },

  setActiveProject: (id: string | null) => {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    }
    set({ activeProjectId: id })
  },

  fetchProjects: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      set({ projects: DEFAULT_MOCK_PROJECTS, isLoadingProjects: false })
      if (!get().activeProjectId && DEFAULT_MOCK_PROJECTS.length > 0) {
        get().setActiveProject(DEFAULT_MOCK_PROJECTS[0].id)
      }
      return
    }

    set({ isLoadingProjects: true, projectError: null })
    try {
      const res = await projectApi.list(1, 100)
      const list = res.items || []
      set({ projects: list, isLoadingProjects: false })

      // Auto-select first project if activeProjectId is invalid or null
      const currentActive = get().activeProjectId
      if (!currentActive || !list.some((p) => p.id === currentActive)) {
        if (list.length > 0) {
          get().setActiveProject(list[0].id)
        }
      }
    } catch (err: any) {
      set({
        projectError: err.message || 'Lỗi tải danh sách dự án',
        isLoadingProjects: false,
        projects: get().projects.length > 0 ? get().projects : DEFAULT_MOCK_PROJECTS,
      })
    }
  },

  createProject: async (name: string, description?: string) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      const newP: ProjectResponse = {
        id: `proj-${Date.now()}`,
        owner_user_id: 'usr-local',
        name,
        description: description || null,
        status: 'active',
        settings: {},
        document_count: 0,
        session_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      set((state) => ({ projects: [newP, ...state.projects] }))
      get().setActiveProject(newP.id)
      return newP
    }

    const created = await projectApi.create({ name, description: description || null })
    set((state) => ({ projects: [created, ...state.projects] }))
    get().setActiveProject(created.id)
    return created
  },

  updateProject: async (id: string, name?: string, description?: string, settings?: Record<string, any>) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      let updated: ProjectResponse | undefined
      set((state) => {
        const next = state.projects.map((p) => {
          if (p.id !== id) return p
          updated = {
            ...p,
            name: name !== undefined ? name : p.name,
            description: description !== undefined ? description : p.description,
            settings: settings !== undefined ? settings : p.settings,
            updated_at: new Date().toISOString(),
          }
          return updated
        })
        return { projects: next }
      })
      return updated!
    }

    const updated = await projectApi.update(id, { name, description, settings })
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }))
    return updated
  },

  deleteProject: async (id: string) => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      set((state) => {
        const next = state.projects.filter((p) => p.id !== id)
        return {
          projects: next,
          activeProjectId: state.activeProjectId === id ? next[0]?.id || null : state.activeProjectId,
        }
      })
      return
    }

    await projectApi.delete(id)
    set((state) => {
      const next = state.projects.filter((p) => p.id !== id)
      const nextActive = state.activeProjectId === id ? next[0]?.id || null : state.activeProjectId
      if (nextActive) localStorage.setItem(ACTIVE_PROJECT_KEY, nextActive)
      else localStorage.removeItem(ACTIVE_PROJECT_KEY)
      return { projects: next, activeProjectId: nextActive }
    })
  },

  fetchDocuments: async (projectId: string) => {
    if (!projectId) return
    set((state) => ({
      isLoadingDocuments: { ...state.isLoadingDocuments, [projectId]: true },
    }))

    try {
      const res = await documentApi.list(projectId, 1, 100)
      set((state) => ({
        documents: { ...state.documents, [projectId]: res.items || [] },
        isLoadingDocuments: { ...state.isLoadingDocuments, [projectId]: false },
      }))
    } catch {
      set((state) => ({
        isLoadingDocuments: { ...state.isLoadingDocuments, [projectId]: false },
      }))
    }
  },

  uploadFiles: async (projectId: string, files: File[]) => {
    if (!files || files.length === 0 || !projectId) return

    // 1. Enqueue files in local tracking state
    const newItems: UploadQueueItem[] = files.map((f) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file: f,
      name: f.name,
      size: f.size,
      status: 'queued',
      progress: 10,
    }))

    set((state) => ({
      uploadQueue: {
        ...state.uploadQueue,
        [projectId]: [...(state.uploadQueue[projectId] || []), ...newItems],
      },
    }))

    // 2. Process each file in parallel
    for (const item of newItems) {
      try {
        // Update status: Uploading
        set((state) => ({
          uploadQueue: {
            ...state.uploadQueue,
            [projectId]: state.uploadQueue[projectId]?.map((q) =>
              q.id === item.id ? { ...q, status: 'uploading', progress: 30 } : q
            ) || [],
          },
        }))

        const res = await ingestionApi.upload(projectId, item.file)

        // If newly uploaded with background Celery task
        if (res.task_id) {
          set((state) => ({
            uploadQueue: {
              ...state.uploadQueue,
              [projectId]: state.uploadQueue[projectId]?.map((q) =>
                q.id === item.id
                  ? { ...q, status: 'parsing', progress: 10, taskId: res.task_id!, documentId: res.document_id, stage: 'Khởi tạo bóc tách...' }
                  : q
              ) || [],
            },
          }))

          // Start polling task
          const pollTaskId = res.task_id
          const pollInterval = setInterval(async () => {
            try {
              const statusRes = await ingestionApi.getStatus(pollTaskId)
              const progPercent = normalizeProgress(statusRes.progress)
              const stage = getStageLabelFromStatus(statusRes.status, statusRes.last_error_step)

              let queueStatus: 'parsing' | 'indexing' | 'uploading' | 'completed' | 'failed' = 'parsing'
              if (statusRes.status === 'completed' || statusRes.status === 'completed_with_warnings') {
                queueStatus = 'completed'
              } else if (statusRes.status === 'failed') {
                queueStatus = 'failed'
              } else if (statusRes.status === 'embedding' || statusRes.status === 'saving') {
                queueStatus = 'indexing'
              } else {
                queueStatus = 'parsing'
              }

              if (queueStatus === 'completed') {
                clearInterval(pollInterval)
                set((state) => ({
                  uploadQueue: {
                    ...state.uploadQueue,
                    [projectId]: state.uploadQueue[projectId]?.map((q) =>
                      q.id === item.id ? { ...q, status: 'completed', progress: 100, stage: 'Hoàn tất 100%' } : q
                    ) || [],
                  },
                }))
                // Refresh documents list and projects stats
                get().fetchDocuments(projectId)
                get().fetchProjects()
                get().fetchProjectStats(projectId)
              } else if (queueStatus === 'failed') {
                clearInterval(pollInterval)
                set((state) => ({
                  uploadQueue: {
                    ...state.uploadQueue,
                    [projectId]: state.uploadQueue[projectId]?.map((q) =>
                      q.id === item.id
                        ? { ...q, status: 'failed', progress: 100, error: statusRes.error_message || 'Xử lý thất bại', stage: 'Lỗi nạp' }
                        : q
                    ) || [],
                  },
                }))
                get().fetchProjectStats(projectId)
              } else {
                set((state) => ({
                  uploadQueue: {
                    ...state.uploadQueue,
                    [projectId]: state.uploadQueue[projectId]?.map((q) =>
                      q.id === item.id ? { ...q, status: queueStatus, progress: progPercent, stage } : q
                    ) || [],
                  },
                }))
              }
            } catch {
              // Ignore temporary poll network failure
            }
          }, 1200)


          // Fallback timeout to clear interval after 30 minutes for large multi-thousand page documents
          setTimeout(() => clearInterval(pollInterval), 1800000)
        } else {
          // Cached or instant complete
          set((state) => ({
            uploadQueue: {
              ...state.uploadQueue,
              [projectId]: state.uploadQueue[projectId]?.map((q) =>
                q.id === item.id ? { ...q, status: 'completed', progress: 100, stage: 'Hoàn tất 100%', documentId: res.document_id } : q
              ) || [],
            },
          }))
          get().fetchDocuments(projectId)
          get().fetchProjects()
          get().fetchProjectStats(projectId)
        }


      } catch (err: any) {
        set((state) => ({
          uploadQueue: {
            ...state.uploadQueue,
            [projectId]: state.uploadQueue[projectId]?.map((q) =>
              q.id === item.id ? { ...q, status: 'failed', progress: 100, error: err.message || 'Upload lỗi' } : q
            ) || [],
          },
        }))
      }
    }
  },

  deleteDocument: async (documentId: string, projectId: string) => {
    try {
      await documentApi.delete(documentId)
    } catch (err) {
      console.warn('Delete document warning:', err)
    } finally {
      set((state) => ({
        documents: {
          ...state.documents,
          [projectId]: (state.documents[projectId] || []).filter((d) => d.id !== documentId),
        },
      }))
      get().fetchProjects()
      get().fetchProjectStats(projectId)
    }
  },

  batchDeleteDocuments: async (documentIds: string[], projectId: string) => {
    if (!documentIds || documentIds.length === 0) return
    try {
      await documentApi.batchDelete(documentIds)
    } catch (err) {
      console.warn('Batch delete warning:', err)
    } finally {
      const idSet = new Set(documentIds)
      set((state) => ({
        documents: {
          ...state.documents,
          [projectId]: (state.documents[projectId] || []).filter((d) => !idSet.has(d.id)),
        },
      }))
      get().fetchProjects()
      get().fetchProjectStats(projectId)
    }
  },


  fetchProjectStats: async (projectId: string) => {
    if (!projectId) return
    set((state) => ({
      isLoadingStats: { ...state.isLoadingStats, [projectId]: true },
    }))
    try {
      const stats = await ingestionApi.getStats(projectId)
      set((state) => ({
        projectStats: { ...state.projectStats, [projectId]: stats },
        isLoadingStats: { ...state.isLoadingStats, [projectId]: false },
      }))
    } catch {
      // Mock fallback calculation if API is offline
      const docs = get().documents[projectId] || []
      const totalChunks = docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0)
      const totalBytes = docs.reduce((acc, d) => acc + (d.file_size_bytes || 0), 0)
      const mockStats: ProjectIngestionStats = {
        total_documents: docs.length,
        total_chunks: totalChunks,
        total_size_bytes: totalBytes,
        dedup_ratio: 0.18,
        saved_chunks: Math.floor(totalChunks * 0.18),
        status_breakdown: {
          completed: docs.filter((d) => d.status === 'completed').length,
          processing: docs.filter((d) => d.status === 'processing').length,
          failed: docs.filter((d) => d.status === 'failed').length,
          pending: docs.filter((d) => d.status === 'pending').length,
        },
        last_synced_at: new Date().toISOString(),
      }
      set((state) => ({
        projectStats: { ...state.projectStats, [projectId]: mockStats },
        isLoadingStats: { ...state.isLoadingStats, [projectId]: false },
      }))
    }
  },

  reindexDocument: async (documentId: string, projectId: string) => {
    set((state) => ({
      documents: {
        ...state.documents,
        [projectId]: (state.documents[projectId] || []).map((d) =>
          d.id === documentId
            ? { ...d, status: 'processing', processing_metadata: { ...d.processing_metadata, progress: 15, stage: 'Khởi tạo Re-indexing...' } }
            : d
        ),
      },
    }))

    try {
      const res = await ingestionApi.reindexDocument(documentId)
      if (res.task_id) {
        const taskId = res.task_id
        const poll = setInterval(async () => {
          try {
            const st = await ingestionApi.getStatus(taskId)
            const progPercent = normalizeProgress(st.progress)
            const stageText = getStageLabelFromStatus(st.status, st.last_error_step)

            if (st.status === 'completed' || st.status === 'completed_with_warnings' || st.status === 'failed') {
              clearInterval(poll)
              get().fetchDocuments(projectId)
              get().fetchProjectStats(projectId)
            } else {
              set((state) => ({
                documents: {
                  ...state.documents,
                  [projectId]: (state.documents[projectId] || []).map((d) =>
                    d.id === documentId
                      ? {
                          ...d,
                          status: 'processing',
                          processing_metadata: { ...d.processing_metadata, progress: progPercent, stage: stageText },
                        }
                      : d
                  ),
                },
              }))
            }
          } catch {
            clearInterval(poll)
          }
        }, 1200)
        setTimeout(() => clearInterval(poll), 120000)
      }

    } catch (err) {
      console.error(err)
      get().fetchDocuments(projectId)
    }
  },


  reindexProject: async (projectId: string) => {
    set((state) => ({
      documents: {
        ...state.documents,
        [projectId]: (state.documents[projectId] || []).map((d) => ({
          ...d,
          status: 'processing',
        })),
      },
    }))

    try {
      await ingestionApi.reindexProject(projectId)
      // Poll documents after 3 seconds
      setTimeout(() => {
        get().fetchDocuments(projectId)
        get().fetchProjectStats(projectId)
      }, 3000)
    } catch (err) {
      console.error(err)
      get().fetchDocuments(projectId)
    }
  },

  clearCompletedUploads: (projectId: string) => {
    set((state) => ({
      uploadQueue: {
        ...state.uploadQueue,
        [projectId]: (state.uploadQueue[projectId] || []).filter(
          (q) => q.status !== 'completed' && q.status !== 'failed'
        ),
      },
    }))
  },

}))
