import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Button, Modal, Pill, Input,
  IconSettingsOutline16, IconChevronLeftOutline14, IconBrowseOutline16,
  IconTrashOutline16, IconCheckOutline16, IconWarningOutline16,
  IconLoadingOutline16, IconDownloadOutline16
} from '@/components/ui'
import { useProjectStore } from '@/store/useProjectStore'
import { useChatStore } from '@/store/useChatStore'
import { useViewStore } from '@/store/useViewStore'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import type { DocumentResponse } from '@/types/project'
import css from './ProjectDetailView.module.css'

export interface ProjectDetailViewProps {
  projectId: string
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const {
    projects,
    documents,
    isLoadingDocuments,
    uploadQueue,
    fetchDocuments,
    uploadFiles,
    deleteDocument,
    updateProject,
    setActiveProject,
  } = useProjectStore()

  const { newSession } = useChatStore()
  const { navigateToChat, navigateToProjects, detailTab, setDetailTab } = useViewStore()

  const project = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  )

  const projectDocs = useMemo(
    () => documents[projectId] || [],
    [documents, projectId]
  )

  const queueItems = useMemo(
    () => uploadQueue[projectId] || [],
    [uploadQueue, projectId]
  )

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview & Delete targets
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<DocumentResponse | null>(null)

  // Settings tab form state
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  useEffect(() => {
    if (project) {
      setEditName(project.name)
      setEditDesc(project.description || '')
    }
  }, [project])

  useEffect(() => {
    fetchDocuments(projectId)
  }, [projectId, fetchDocuments])

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    uploadFiles(projectId, fileArray)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files)
    }
  }

  const handleStartChat = () => {
    setActiveProject(projectId)
    newSession(projectId)
    navigateToChat()
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return
    setIsSavingSettings(true)
    try {
      await updateProject(projectId, editName.trim(), editDesc.trim() || undefined)
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return
    await deleteDocument(deletingDoc.id, projectId)
    setDeletingDoc(null)
  }

  if (!project) {
    return (
      <div className={css.root}>
        <button className={css.backButton} onClick={() => navigateToProjects()}>
          <IconChevronLeftOutline14 size={16} /> Quay lại danh sách
        </button>
        <div style={{ marginTop: 40, textAlign: 'center', color: 'var(--dsw-alias-label-tertiary)' }}>
          Không tìm thấy thông tin dự án.
        </div>
      </div>
    )
  }

  return (
    <div className={css.root}>
      <div className={css.container}>
        {/* 1. Back Navigation Row */}
        <div className={css.backRow}>
          <button className={css.backButton} onClick={() => navigateToProjects()}>
            <IconChevronLeftOutline14 size={16} />
            <span>Quay lại danh sách dự án</span>
          </button>
        </div>

        {/* 2. Project Header */}
        <div className={css.header}>
          <div className={css.titleGroup}>
            <h1 className={css.title}>{project.name}</h1>
            <p className={css.description}>
              {project.description || 'Chưa có mô tả chi tiết cho dự án này.'}
            </p>
          </div>
          <Button variant="primary" onClick={handleStartChat}>
            <span>Bắt đầu trò chuyện</span>
          </Button>
        </div>

        {/* 3. Tabs Navigation */}
        <div className={css.tabsBar}>
          <button
            className={`${css.tabItem} ${detailTab === 'documents' ? css.tabItemActive : ''}`}
            onClick={() => setDetailTab('documents')}
          >
            <IconBrowseOutline16 size={15} />
            <span>Nguồn tài liệu ({projectDocs.length})</span>
          </button>
          <button
            className={`${css.tabItem} ${detailTab === 'settings' ? css.tabItemActive : ''}`}
            onClick={() => setDetailTab('settings')}
          >
            <IconSettingsOutline16 size={15} />
            <span>Cài đặt dự án</span>
          </button>
        </div>

        {/* 4. Tab 1: Documents Management */}
        {detailTab === 'documents' && (
          <>
            {/* Smart Dropzone */}
            <div
              className={`${css.dropzone} ${isDragging ? css.dropzoneActive : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md"
                style={{ display: 'none' }}
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className={css.dropzoneIcon}>
                <IconDownloadOutline16 size={26} style={{ transform: 'rotate(180deg)' }} />
              </div>
              <div className={css.dropzoneTitle}>
                Kéo thả tài liệu vào đây hoặc nhấp để duyệt file
              </div>
              <div className={css.dropzoneSubtitle}>
                Hỗ trợ định dạng PDF, Word (DOCX/DOC), TXT, Markdown (Tối đa 50MB/file)
              </div>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                Chọn file từ máy tính
              </Button>
            </div>

            {/* Real-time Upload Progress Queue */}
            {queueItems.length > 0 && (
              <div className={css.queueArea}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' }}>
                  Hàng đợi nạp tài liệu & Indexing ({queueItems.length} files)
                </div>
                {queueItems.map((item) => (
                  <div key={item.id} className={css.queueCard}>
                    <div className={css.queueCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IconBrowseOutline16 size={16} style={{ color: 'var(--dsw-alias-brand-primary)' }} />
                        <span className={css.queueFileName}>{item.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>
                          ({formatBytes(item.size)})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.status === 'uploading' && (
                          <Pill>
                            <IconLoadingOutline16 size={12} className="spin" style={{ marginRight: 4 }} />
                            Đang tải lên ({item.progress}%)
                          </Pill>
                        )}
                        {item.status === 'parsing' && (
                          <Pill>
                            <IconLoadingOutline16 size={12} className="spin" style={{ marginRight: 4 }} />
                            Docling bóc tách...
                          </Pill>
                        )}
                        {item.status === 'indexing' && (
                          <Pill>
                            <IconLoadingOutline16 size={12} className="spin" style={{ marginRight: 4 }} />
                            Lập chỉ mục Qdrant...
                          </Pill>
                        )}
                        {item.status === 'completed' && (
                          <Pill style={{ color: 'var(--dsw-static-green-500)' }}>
                            <IconCheckOutline16 size={12} style={{ marginRight: 4 }} />
                            Hoàn tất
                          </Pill>
                        )}
                        {item.status === 'failed' && (
                          <Pill style={{ color: 'var(--dsw-static-red-500)' }}>
                            <IconWarningOutline16 size={12} style={{ marginRight: 4 }} />
                            {item.error || 'Lỗi xử lý'}
                          </Pill>
                        )}
                      </div>
                    </div>

                    <div className={css.progressBarTrack}>
                      <div className={css.progressBarFill} style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Documents Inventory Table */}
            <div className={css.tableContainer}>
              <div className={css.tableHeaderRow}>
                <span>Tên tài liệu</span>
                <span>Kích thước</span>
                <span>Số Chunks</span>
                <span>Trạng thái</span>
                <span style={{ textAlign: 'right' }}>Hành động</span>
              </div>

              {isLoadingDocuments[projectId] ? (
                <div className={css.emptyTable}>Đang tải danh sách tài liệu...</div>
              ) : projectDocs.length === 0 ? (
                <div className={css.emptyTable}>
                  Chưa có tài liệu nào trong dự án này. Hãy kéo thả file lên vùng phía trên để bắt đầu nạp tri thức RAG!
                </div>
              ) : (
                projectDocs.map((doc) => (
                  <div key={doc.id} className={css.tableRow}>
                    <div className={css.docNameCell}>
                      <IconBrowseOutline16 size={18} className={css.docIcon} />
                      <span className={css.docTitle} title={doc.file_name}>
                        {doc.file_name}
                      </span>
                    </div>

                    <div style={{ color: 'var(--dsw-alias-label-secondary)' }}>
                      {formatBytes(doc.file_size_bytes)}
                    </div>

                    <div>
                      <Pill>
                        {doc.chunk_count || 0} chunks
                      </Pill>
                    </div>

                    <div>
                      {doc.status === 'completed' ? (
                        <Pill style={{ color: 'var(--dsw-static-green-500)' }}>
                          ✓ Đã lập chỉ mục
                        </Pill>
                      ) : doc.status === 'processing' || doc.status === 'pending' ? (
                        <Pill style={{ color: 'var(--dsw-static-amber-500)' }}>
                          ⏳ Đang xử lý
                        </Pill>
                      ) : (
                        <Pill style={{ color: 'var(--dsw-static-red-500)' }}>
                          ❌ Lỗi
                        </Pill>
                      )}
                    </div>

                    <div className={css.actionsCell}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Xem trước Markdown đã bóc tách"
                        onClick={() => setPreviewDocId(doc.id)}
                      >
                        <IconBrowseOutline16 size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Xóa tài liệu khỏi dự án"
                        onClick={() => setDeletingDoc(doc)}
                      >
                        <IconTrashOutline16 size={15} style={{ color: 'var(--dsw-alias-state-error-primary)' }} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* 5. Tab 2: Settings */}
        {detailTab === 'settings' && (
          <form
            onSubmit={handleSaveSettings}
            style={{
              maxWidth: 600,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              padding: 24,
              borderRadius: 'var(--dsw-radius-lg, 16px)',
              background: 'var(--dsw-alias-bg-layer-1)',
              border: '1px solid var(--dsw-alias-border-l2)',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 550, marginBottom: 6 }}>
                Tên dự án
              </label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 550, marginBottom: 6 }}>
                Mô tả dự án
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--dsw-alias-border-l2)',
                  background: 'var(--dsw-alias-bg-module-platform)',
                  color: 'var(--dsw-alias-label-primary)',
                  fontFamily: 'var(--dsw-font-family)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="primary" disabled={!editName.trim() || isSavingSettings}>
                {isSavingSettings ? 'Đang lưu...' : 'Lưu cấu hình'}
              </Button>
            </div>
          </form>
        )}

        {/* Markdown Preview Modal */}
        <DocumentPreviewModal
          documentId={previewDocId}
          onClose={() => setPreviewDocId(null)}
        />

        {/* Delete Document Modal */}
        <Modal
          open={deletingDoc !== null}
          onClose={() => setDeletingDoc(null)}
          closeLabel="Hủy"
          title="Xác nhận xóa tài liệu"
          description={
            deletingDoc
              ? `Bạn có chắc chắn muốn xóa file "${deletingDoc.file_name}"? Toàn bộ vector chunks liên quan trong Qdrant sẽ bị xóa.`
              : undefined
          }
          footer={(
            <>
              <Button variant="outline" onClick={() => setDeletingDoc(null)}>Hủy</Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>Xóa tài liệu</Button>
            </>
          )}
        >
          <div style={{ fontSize: 13, color: 'var(--dsw-alias-label-secondary)' }}>
            Hành động này không thể hoàn tác.
          </div>
        </Modal>
      </div>
    </div>
  )
}
