import { create } from 'zustand'
import type { ProjectResponse, DocumentResponse, UploadQueueItem } from '@/types/project'
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

  // Upload progress tracking
  uploadQueue: Record<string, UploadQueueItem[]>

  // Actions
  fetchProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<ProjectResponse>
  updateProject: (id: string, name?: string, description?: string, settings?: Record<string, any>) => Promise<ProjectResponse>
  deleteProject: (id: string) => Promise<void>
  setActiveProject: (id: string | null) => void
  getActiveProject: () => ProjectResponse | undefined

  // Document Actions
  fetchDocuments: (projectId: string) => Promise<void>
  uploadFiles: (projectId: string, files: File[]) => Promise<void>
  deleteDocument: (documentId: string, projectId: string) => Promise<void>
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

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: typeof localStorage !== 'undefined' ? localStorage.getItem(ACTIVE_PROJECT_KEY) : null,
  isLoadingProjects: false,
  projectError: null,
  documents: {},
  isLoadingDocuments: {},
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
                  ? { ...q, status: 'parsing', progress: 60, taskId: res.task_id!, documentId: res.document_id }
                  : q
              ) || [],
            },
          }))

          // Start polling task
          const pollTaskId = res.task_id
          const pollInterval = setInterval(async () => {
            try {
              const statusRes = await ingestionApi.getStatus(pollTaskId)
              const progPercent = Math.min(95, Math.max(60, Math.round(statusRes.progress * 100)))

              if (statusRes.status === 'completed') {
                clearInterval(pollInterval)
                set((state) => ({
                  uploadQueue: {
                    ...state.uploadQueue,
                    [projectId]: state.uploadQueue[projectId]?.map((q) =>
                      q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q
                    ) || [],
                  },
                }))
                // Refresh documents list and projects stats
                get().fetchDocuments(projectId)
                get().fetchProjects()
              } else if (statusRes.status === 'failed') {
                clearInterval(pollInterval)
                set((state) => ({
                  uploadQueue: {
                    ...state.uploadQueue,
                    [projectId]: state.uploadQueue[projectId]?.map((q) =>
                      q.id === item.id
                        ? { ...q, status: 'failed', progress: 100, error: statusRes.error_message || 'Xử lý thất bại' }
                        : q
                    ) || [],
                  },
                }))
              } else {
                set((state) => ({
                  uploadQueue: {
                    ...state.uploadQueue,
                    [projectId]: state.uploadQueue[projectId]?.map((q) =>
                      q.id === item.id ? { ...q, status: 'indexing', progress: progPercent } : q
                    ) || [],
                  },
                }))
              }
            } catch {
              // Ignore temporary poll network failure
            }
          }, 1500)

          // Fallback timeout to clear interval after 2 minutes
          setTimeout(() => clearInterval(pollInterval), 120000)
        } else {
          // Cached or instant complete
          set((state) => ({
            uploadQueue: {
              ...state.uploadQueue,
              [projectId]: state.uploadQueue[projectId]?.map((q) =>
                q.id === item.id ? { ...q, status: 'completed', progress: 100, documentId: res.document_id } : q
              ) || [],
            },
          }))
          get().fetchDocuments(projectId)
          get().fetchProjects()
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
    await documentApi.delete(documentId)
    set((state) => ({
      documents: {
        ...state.documents,
        [projectId]: (state.documents[projectId] || []).filter((d) => d.id !== documentId),
      },
    }))
    get().fetchProjects()
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
