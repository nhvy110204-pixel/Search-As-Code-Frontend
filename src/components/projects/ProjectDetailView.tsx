import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Button, Modal, Pill, Input, Menu, Tooltip,
  IconSettingsOutline16, IconChevronLeftOutline14, IconBrowseOutline16,
  IconTrashOutline16, IconCheckOutline16, IconWarningOutline16,
  IconLoadingOutline16, IconDownloadOutline16, IconEllipsisOutline16,
  IconInspectOutline12, IconPlusOutline16, IconCloseOutline16,
  IconDataOutline16
} from '@/components/ui'
import { useProjectStore } from '@/store/useProjectStore'
import { useChatStore } from '@/store/useChatStore'
import { useViewStore } from '@/store/useViewStore'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { DocumentDetailModal } from './DocumentDetailModal'
import { ProjectSettingsView } from './ProjectSettingsView'
import { ProjectAnalyticsView } from './ProjectAnalyticsView'
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
    deleteProject,
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

  // Preview, Detail & Delete targets
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<DocumentResponse | null>(null)
  const [detailDoc, setDetailDoc] = useState<DocumentResponse | null>(null)
  const [menuOpenDocId, setMenuOpenDocId] = useState<string | null>(null)

  const [showUploadDropzone, setShowUploadDropzone] = useState(false)
  const hasDocuments = projectDocs.length > 0 || queueItems.length > 0
  const isUploadVisible = !hasDocuments || showUploadDropzone

  useEffect(() => {
    fetchDocuments(projectId)
  }, [projectId, fetchDocuments])

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    uploadFiles(projectId, fileArray)
    setShowUploadDropzone(false)
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
        {/* Project Header with integrated back button on title hover */}
        <div className={css.header}>
          <div className={css.titleGroup}>
            <div className={css.titleWrapper}>
              <Tooltip label="Quay lại danh sách dự án" side="top" delayMs={200}>
                <span className={css.tooltipAnchor}>
                  <button
                    type="button"
                    className={css.titleBackButton}
                    onClick={() => navigateToProjects()}
                    aria-label="Quay lại danh sách dự án"
                  >
                    {/* Normal State: Only project name */}
                    <span className={css.titleNormal}>
                      <h1 className={css.title}>{project.name}</h1>
                    </span>

                    {/* Hover State: Icon with circle background */}
                    <span className={css.titleHover}>
                      <span className={css.backIconCircle}>
                        <IconChevronLeftOutline14 size={18} className={css.backIcon} />
                      </span>
                    </span>
                  </button>
                </span>
              </Tooltip>
            </div>
            <p className={css.description}>
              {project.description || 'Chưa có mô tả chi tiết cho dự án này.'}
            </p>
          </div>
          <div className={css.headerActions}>
            {hasDocuments && (
              <Tooltip label={showUploadDropzone ? 'Thu gọn khung tải lên' : 'Tải thêm tài liệu vào dự án'} delayMs={300}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadDropzone((prev) => !prev)
                    if (detailTab !== 'documents') {
                      setDetailTab('documents')
                    }
                  }}
                >
                  <IconPlusOutline16 size={15} style={{ marginRight: 6 }} />
                  <span>Tải tài liệu lên</span>
                </Button>
              </Tooltip>
            )}
            <Tooltip label="Tạo phiên trò chuyện mới với tài liệu dự án này" delayMs={300}>
              <Button variant="primary" onClick={handleStartChat}>
                <span>Bắt đầu trò chuyện</span>
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* 3. Tabs Navigation */}
        <div className={css.tabsBar}>
          <button
            className={`${css.tabItem} ${detailTab === 'analytics' ? css.tabItemActive : ''}`}
            onClick={() => setDetailTab('analytics')}
          >
            <IconDataOutline16 size={15} />
            <span>Chỉ số & Phân tích</span>
          </button>
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
            {/* Smart Dropzone: Shown by default if no documents, or toggled via button if documents exist */}
            {isUploadVisible && (
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
                {hasDocuments && (
                  <Tooltip label="Đóng khung tải lên" delayMs={300}>
                    <button
                      type="button"
                      className={css.dropzoneCloseBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowUploadDropzone(false)
                      }}
                      aria-label="Đóng khung tải lên"
                    >
                      <IconCloseOutline16 size={14} />
                    </button>
                  </Tooltip>
                )}
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
            )}

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
                <span>Chunks</span>
                <span>Trạng thái</span>
                <span style={{ textAlign: 'right' }}></span>
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
                      <Tooltip label={doc.file_name} delayMs={300}>
                        <span className={css.docTitle}>
                          {doc.file_name}
                        </span>
                      </Tooltip>
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
                          Đang xử lý
                        </Pill>
                      ) : (
                        <Pill style={{ color: 'var(--dsw-static-red-500)' }}>
                          Lỗi
                        </Pill>
                      )}
                    </div>

                    <div className={css.actionsCell}>
                      <Menu
                        open={menuOpenDocId === doc.id}
                        onClose={() => setMenuOpenDocId(null)}
                        align="end"
                        portal
                        anchor={
                          <Tooltip label="Tùy chọn tài liệu" delayMs={300}>
                            <button
                              type="button"
                              className={css.menuButton}
                              data-active={menuOpenDocId === doc.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpenDocId(menuOpenDocId === doc.id ? null : doc.id)
                              }}
                              aria-label="Tùy chọn tài liệu"
                            >
                              <IconEllipsisOutline16 size={16} />
                            </button>
                          </Tooltip>
                        }
                        items={[
                          {
                            id: 'detail',
                            label: 'Chi tiết tài liệu & Chunks',
                            icon: <IconInspectOutline12 size={14} />,
                          },
                          {
                            id: 'preview',
                            label: 'Xem trước nội dung',
                            icon: <IconBrowseOutline16 size={14} />,
                          },
                          {
                            type: 'separator',
                            id: `sep-${doc.id}`,
                          },
                          {
                            id: 'delete',
                            label: 'Xóa tài liệu',
                            icon: <IconTrashOutline16 size={14} style={{ color: 'var(--dsw-alias-state-error-primary)' }} />,
                            danger: true,
                          },
                        ]}
                        onSelect={(actionId) => {
                          setMenuOpenDocId(null)
                          if (actionId === 'preview') {
                            setPreviewDocId(doc.id)
                          } else if (actionId === 'detail') {
                            setDetailDoc(doc)
                          } else if (actionId === 'delete') {
                            setDeletingDoc(doc)
                          }
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* 5. Tab 2: Analytics & Insights */}
        {detailTab === 'analytics' && (
          <ProjectAnalyticsView
            project={project}
            documents={projectDocs}
          />
        )}

        {/* 6. Tab 3: Settings (Embedded 2-Column SaC Settings) */}
        {detailTab === 'settings' && (
          <ProjectSettingsView
            project={project}
            onUpdate={async (data) => {
              await updateProject(projectId, data.name, data.description || undefined, data.settings)
            }}
            onDelete={async () => {
              await deleteProject(projectId)
              navigateToProjects()
            }}
          />
        )}

        {/* Markdown Preview Modal */}
        <DocumentPreviewModal
          documentId={previewDocId}
          onClose={() => setPreviewDocId(null)}
        />

        {/* Document Details Modal (Settings-styled with Chunk Search) */}
        <DocumentDetailModal
          document={detailDoc}
          open={detailDoc !== null}
          onClose={() => setDetailDoc(null)}
          onOpenPreview={(id) => setPreviewDocId(id)}
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
