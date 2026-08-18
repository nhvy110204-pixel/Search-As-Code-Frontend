import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Button, Modal, Pill, Checkbox, Menu, Tooltip, SelectDropdown, StateDot,
  IconSettingsOutline16, IconChevronLeftOutline14, IconBrowseOutline16,
  IconTrashOutline16, IconCheckOutline16, IconWarningOutline16,
  IconLoadingOutline16, IconDownloadOutline16, IconEllipsisOutline16,
  IconInspectOutline12, IconPlusOutline16, IconCloseOutline16,
  IconDataOutline16, IconSearchOutline16, IconRefreshOutline16,
  IconSparkle16, IconCodeOutline16, type SelectOption
} from '@/components/ui'

import { useProjectStore } from '@/store/useProjectStore'
import { useChatStore } from '@/store/useChatStore'
import { useViewStore } from '@/store/useViewStore'
import { KnowledgeSummaryStrip } from './KnowledgeSummaryStrip'
import { GlobalDragOverlay } from './GlobalDragOverlay'
import { FloatingUploadTray } from './FloatingUploadTray'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { DocumentDetailModal } from './DocumentDetailModal'
import { ProjectSettingsView } from './ProjectSettingsView'
import { ProjectAnalyticsView } from './ProjectAnalyticsView'
import { useSmoothProgress } from './useSmoothProgress'
import type { DocumentResponse } from '@/types/project'
import css from './ProjectDetailView.module.css'

export interface ProjectDetailViewProps {
  projectId: string
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'completed', label: 'Đã lập chỉ mục', icon: <StateDot state="done" size={9} /> },
  { value: 'processing', label: 'Đang xử lý', icon: <IconLoadingOutline16 size={12} style={{ color: 'var(--dsw-static-amber-500, #f59e0b)' }} /> },
  { value: 'failed', label: 'Lỗi nạp', icon: <StateDot state="error" size={9} /> },
]

const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'name', label: 'Tên file A-Z' },
  { value: 'size', label: 'Dung lượng' },
  { value: 'chunks', label: 'Số Chunks' },
]


function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function getFileBadge(fileName: string) {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) {
    return <span className={css.docBadgePdf}>PDF</span>
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    return <span className={css.docBadgeDocx}>DOCX</span>
  }
  if (lower.endsWith('.md')) {
    return <span className={css.docBadgeMd}>MD</span>
  }
  return <span className={css.docBadgeTxt}>TXT</span>
}

function DocumentProcessingPill({
  docId,
  progress,
  stageText,
}: {
  docId: string
  progress: number
  stageText: string
}) {
  const smoothProgress = useSmoothProgress(progress, true, false, docId)

  return (
    <Tooltip label={`Tiến trình nạp: ${stageText} (${smoothProgress}%)`} delayMs={200}>
      <div className={css.processingStatusGroup}>
        <Pill style={{ color: 'var(--dsw-static-amber-500)', gap: 6 }}>
          <IconLoadingOutline16 size={11} style={{ color: 'var(--dsw-static-amber-500)' }} />
          <span>Đang nạp {smoothProgress}%</span>
        </Pill>
        <div className={css.statusProgressBar}>
          <div className={css.statusProgressFill} style={{ width: `${smoothProgress}%` }} />
        </div>
      </div>
    </Tooltip>
  )
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const {
    projects,
    documents,
    projectStats,
    isLoadingDocuments,
    uploadQueue,
    fetchDocuments,
    fetchProjectStats,
    uploadFiles,
    deleteDocument,
    batchDeleteDocuments,
    reindexDocument,
    reindexProject,
    updateProject,
    deleteProject,
    setActiveProject,
    clearCompletedUploads,
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

  const currentStats = projectStats[projectId] || null

  // File Input Ref & Drag overlay state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isGlobalDragging, setIsGlobalDragging] = useState(false)
  const dragCounter = useRef(0)

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'size' | 'chunks'>('newest')

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Preview, Detail & Delete targets
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<DocumentResponse | null>(null)
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [detailDoc, setDetailDoc] = useState<DocumentResponse | null>(null)
  const [menuOpenDocId, setMenuOpenDocId] = useState<string | null>(null)

  // Fetch initial documents and stats
  useEffect(() => {
    fetchDocuments(projectId)
    fetchProjectStats(projectId)
  }, [projectId, fetchDocuments, fetchProjectStats])

  // Global drag-and-drop listener for the Documents tab
  useEffect(() => {
    if (detailTab !== 'documents') return

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current += 1
      if (e.dataTransfer?.types.includes('Files')) {
        setIsGlobalDragging(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsGlobalDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsGlobalDragging(false)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const fileArray = Array.from(e.dataTransfer.files)
        uploadFiles(projectId, fileArray)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [detailTab, projectId, uploadFiles])

  // File picker handler
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    uploadFiles(projectId, fileArray)
  }

  // Filtered & Sorted documents
  const filteredDocuments = useMemo(() => {
    return projectDocs
      .filter((doc) => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          if (!doc.file_name.toLowerCase().includes(q)) return false
        }
        // 2. Status Filter
        if (statusFilter === 'completed' && doc.status !== 'completed') return false
        if (statusFilter === 'processing' && doc.status !== 'processing' && doc.status !== 'pending') return false
        if (statusFilter === 'failed' && doc.status !== 'failed') return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.file_name.localeCompare(b.file_name)
        if (sortBy === 'size') return (b.file_size_bytes || 0) - (a.file_size_bytes || 0)
        if (sortBy === 'chunks') return (b.chunk_count || 0) - (a.chunk_count || 0)
        // newest
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })
  }, [projectDocs, searchQuery, statusFilter, sortBy])

  // Select all toggle
  const handleSelectAllToggle = () => {
    if (selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredDocuments.map((d) => d.id)))
    }
  }

  const handleRowSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
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

  const handleBatchDeleteConfirm = async () => {
    if (selectedIds.size === 0) return
    await batchDeleteDocuments(Array.from(selectedIds), projectId)
    setSelectedIds(new Set())
    setBatchDeleting(false)
  }

  const handleBatchReindex = async () => {
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      reindexDocument(id, projectId)
    }
    setSelectedIds(new Set())
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
      {/* Global Drag & Drop Overlay */}
      <GlobalDragOverlay visible={isGlobalDragging} />

      <div className={css.container}>
        {/* 1. Project Header */}
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
                    <span className={css.titleNormal}>
                      <h1 className={css.title}>{project.name}</h1>
                    </span>
                    <span className={css.titleHover}>
                      <span className={css.backIconCircle}>
                        <IconChevronLeftOutline14 size={16} />
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

            <Tooltip label="Tải thêm tài liệu vào tri thức RAG" delayMs={300}>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                {queueItems.some((i) => i.status !== 'completed' && i.status !== 'failed') ? (
                  <IconLoadingOutline16 size={15} className="spin" style={{ marginRight: 6, color: 'var(--dsw-alias-brand-primary)' }} />
                ) : (
                  <IconPlusOutline16 size={15} style={{ marginRight: 6 }} />
                )}
                <span>{queueItems.some((i) => i.status !== 'completed' && i.status !== 'failed') ? 'Đang nạp...' : 'Tải tài liệu lên'}</span>
              </Button>
            </Tooltip>

            <Tooltip label="Tạo phiên trò chuyện mới với tri thức dự án này" delayMs={300}>
              <Button variant="primary" onClick={handleStartChat}>
                <span>Bắt đầu trò chuyện</span>
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md"
          style={{ display: 'none' }}
          onChange={(e) => handleFilesSelected(e.target.files)}
        />

        {/* 2. Tabs Navigation */}
        <div className={css.tabsBar}>
          <button
            className={`${css.tabItem} ${detailTab === 'documents' ? css.tabItemActive : ''}`}
            onClick={() => setDetailTab('documents')}
          >
            <IconBrowseOutline16 size={15} />
            <span>Nguồn tài liệu ({projectDocs.length})</span>
          </button>
          <button
            className={`${css.tabItem} ${detailTab === 'analytics' ? css.tabItemActive : ''}`}
            onClick={() => setDetailTab('analytics')}
          >
            <IconDataOutline16 size={15} />
            <span>Chỉ số & Phân tích</span>
          </button>
          <button
            className={`${css.tabItem} ${detailTab === 'settings' ? css.tabItemActive : ''}`}
            onClick={() => setDetailTab('settings')}
          >
            <IconSettingsOutline16 size={15} />
            <span>Cài đặt dự án</span>
          </button>
        </div>

        {/* 3. Tab 1: Documents Management */}
        {detailTab === 'documents' && (
          <>
            {/* Knowledge Summary Strip */}
            <KnowledgeSummaryStrip
              projectId={projectId}
              documents={projectDocs}
              stats={currentStats}
              onReindexAll={async () => {
                await reindexProject(projectId)
              }}
            />

            {/* Integrated Ingestion Toolbar */}
            <div className={css.toolbar}>
              <div className={css.toolbarLeft}>
                <SelectDropdown
                  value={statusFilter}
                  options={STATUS_OPTIONS}
                  onChange={(val) => setStatusFilter(val as any)}
                  variant="form"
                  className={css.filterDropdown}
                />

                <SelectDropdown
                  value={sortBy}
                  options={SORT_OPTIONS}
                  onChange={(val) => setSortBy(val as any)}
                  variant="form"
                  className={css.filterDropdownSort}
                />
              </div>

              <div className={css.toolbarRight}>
                <div className={css.searchContainer}>
                  <IconSearchOutline16 size={14} className={css.searchIcon} />
                  <input
                    type="text"
                    className={css.searchInput}
                    placeholder="Tìm kiếm tài liệu... (/)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className={css.clearSearchBtn}
                      onClick={() => setSearchQuery('')}
                    >
                      <IconCloseOutline16 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Enterprise Data Grid */}
            <div className={css.gridRoot}>
              <div className={css.gridHeader}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={
                      selectedIds.size > 0 &&
                      selectedIds.size === filteredDocuments.length
                    }
                    onChange={handleSelectAllToggle}
                  />
                </div>
                <span>Tên tài liệu</span>
                <span>Dung lượng</span>
                <span>Độ phủ Chunks</span>
                <span>Trạng thái RAG</span>
                <span></span>
              </div>

              {isLoadingDocuments[projectId] ? (
                <div className={css.emptyGrid}>
                  <IconLoadingOutline16 size={20} className="spin" style={{ marginBottom: 8 }} />
                  <div>Đang tải danh sách tài liệu...</div>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className={css.emptyGrid}>
                  {searchQuery ? (
                    'Không tìm thấy tài liệu phù hợp với từ khóa tìm kiếm.'
                  ) : (
                    <>
                      <div>Chưa có tài liệu nào trong dự án.</div>
                      <div style={{ marginTop: 6, fontSize: 12.5 }}>
                        Kéo thả file vào bất kỳ đâu trên màn hình hoặc nhấp <strong>"Tải tài liệu lên"</strong> để bắt đầu!
                      </div>
                    </>
                  )}
                </div>
              ) : (
                filteredDocuments.map((doc) => {
                  const isSelected = selectedIds.has(doc.id)
                  const isProcessing = doc.status === 'processing' || doc.status === 'pending'
                  const isCompleted = doc.status === 'completed'
                  const isFailed = doc.status === 'failed'

                  return (
                    <div
                      key={doc.id}
                      className={`${css.gridRow} ${isSelected ? css.gridRowSelected : ''} ${isProcessing ? css.gridRowProcessing : ''}`}
                    >
                      {/* Checkbox */}
                      <div onClick={(e) => handleRowSelect(doc.id, e)}>
                        <Checkbox checked={isSelected} onChange={() => {}} />
                      </div>

                      {/* File Name + Type Badge */}
                      <div className={css.docTitleCell}>
                        {getFileBadge(doc.file_name)}
                        <Tooltip label={doc.file_name} delayMs={300}>
                          <span
                            className={css.docNameText}
                            onClick={() => setDetailDoc(doc)}
                          >
                            {doc.file_name}
                          </span>
                        </Tooltip>
                      </div>

                      {/* File Size */}
                      <div style={{ color: 'var(--dsw-alias-label-secondary)' }}>
                        {formatBytes(doc.file_size_bytes)}
                      </div>

                      {/* Chunk Density */}
                      <div className={css.chunkDensityCell}>
                        <Pill>
                          {doc.chunk_count || 0} chunks
                        </Pill>
                        <div className={css.chunkDensityBar}>
                          <div
                            className={css.chunkDensityFill}
                            style={{
                              width: `${Math.min(100, Math.max(15, (doc.chunk_count || 1) * 3))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        {isCompleted && (
                          <Tooltip
                            label={
                              doc.processing_metadata?.quality_score !== undefined
                                ? `Chất lượng bóc tách: ${Math.round(doc.processing_metadata.quality_score * 100)}% (${doc.processing_metadata.final_parse_profile || 'DIGITAL_BOOK'})`
                                : 'Đã lập chỉ mục và đồng bộ Vector Qdrant'
                            }
                            delayMs={200}
                          >
                            <Pill style={{ color: 'var(--dsw-static-green-500)', gap: 6 }}>
                              <StateDot state="done" size={8} />
                              <span>Đã lập chỉ mục</span>
                            </Pill>
                          </Tooltip>
                        )}
                        {doc.status === 'completed_with_warnings' && (
                          <Tooltip
                            label={
                              doc.processing_metadata?.quality_warnings?.[0] ||
                              `Độ nhận diện văn bản thấp (${Math.round((doc.processing_metadata?.quality_score || 0.4) * 100)}%)`
                            }
                            delayMs={200}
                          >
                            <Pill style={{ color: 'var(--dsw-static-amber-500)', gap: 6 }}>
                              <StateDot state="warning" size={8} />
                              <span>Cảnh báo chất lượng</span>
                            </Pill>
                          </Tooltip>
                        )}
                        {isProcessing && (() => {
                          const queueItem = queueItems.find((q) => q.documentId === doc.id || q.name === doc.file_name)
                          const prog = queueItem?.progress ?? (doc.processing_metadata?.progress as number) ?? 0
                          const stageText = queueItem?.stage ?? (doc.processing_metadata?.stage as string) ?? 'Đang nạp dữ liệu'

                          return <DocumentProcessingPill docId={doc.id} progress={prog} stageText={stageText} />
                        })()}

                        {isFailed && (
                          <Tooltip label={(doc.processing_metadata?.error_message as string) || 'Quá trình nạp gặp lỗi'} delayMs={200}>
                            <Pill style={{ color: 'var(--dsw-static-red-500)', gap: 6 }}>
                              <StateDot state="error" size={8} />
                              <span>Lỗi nạp</span>
                            </Pill>
                          </Tooltip>
                        )}
                      </div>

                      {/* Actions Menu */}

                      <div className={css.actionsCell}>
                        <Menu
                          open={menuOpenDocId === doc.id}
                          onClose={() => setMenuOpenDocId(null)}
                          align="end"
                          portal
                          anchor={
                            <Tooltip label="Tùy chọn thao tác" delayMs={300}>
                              <button
                                type="button"
                                className={css.actionBtn}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMenuOpenDocId(menuOpenDocId === doc.id ? null : doc.id)
                                }}
                                aria-label="Tùy chọn thao tác"
                              >
                                <IconEllipsisOutline16 size={15} />
                              </button>
                            </Tooltip>
                          }
                          items={[
                            {
                              id: 'detail',
                              label: 'Chi tiết & Chunks',
                              icon: <IconInspectOutline12 size={14} />,
                            },
                            {
                              id: 'preview',
                              label: 'Xem trước nội dung',
                              icon: <IconBrowseOutline16 size={14} />,
                            },
                            {
                              type: 'separator',
                              id: `sep-1-${doc.id}`,
                            },
                            {
                              id: 'reindex',
                              label: 'Đồng bộ lại file này (Re-index)',
                              icon: <IconRefreshOutline16 size={14} />,
                            },
                            {
                              type: 'separator',
                              id: `sep-2-${doc.id}`,
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
                            if (actionId === 'detail') {
                              setDetailDoc(doc)
                            } else if (actionId === 'preview') {
                              setPreviewDocId(doc.id)
                            } else if (actionId === 'reindex') {
                              reindexDocument(doc.id, projectId)
                            } else if (actionId === 'delete') {
                              setDeletingDoc(doc)
                            }
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              )}

            </div>

            {/* Floating Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className={css.floatingActionBar}>
                <span className={css.selectedCountText}>
                  Đã chọn {selectedIds.size} tài liệu
                </span>
                <div className={css.bulkActionsGroup}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchReindex}
                  >
                    <IconRefreshOutline16 size={13} style={{ marginRight: 4 }} />
                    <span>Đồng bộ lại</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBatchDeleting(true)}
                    style={{ color: 'var(--dsw-static-red-500)' }}
                  >
                    <IconTrashOutline16 size={13} style={{ marginRight: 4 }} />
                    <span>Xóa đã chọn</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 4. Tab 2: Analytics & Insights */}
        {detailTab === 'analytics' && (
          <ProjectAnalyticsView
            project={project}
            documents={projectDocs}
          />
        )}

        {/* 5. Tab 3: Settings */}
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
      </div>

      {/* Floating Upload Tray */}
      <FloatingUploadTray
        items={queueItems}
        onClearCompleted={() => clearCompletedUploads(projectId)}
      />

      {/* Modals: Preview, Detail, Delete, Batch Delete */}
      <DocumentPreviewModal
        documentId={previewDocId}
        onClose={() => setPreviewDocId(null)}
      />

      <DocumentDetailModal
        document={detailDoc}
        open={detailDoc !== null}
        onClose={() => setDetailDoc(null)}
        onOpenPreview={(id) => {
          setDetailDoc(null)
          setPreviewDocId(id)
        }}
      />

      {/* Single Delete Modal */}
      <Modal
        open={deletingDoc !== null}
        onClose={() => setDeletingDoc(null)}
        title="Xác nhận xóa tài liệu"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="outline" onClick={() => setDeletingDoc(null)}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              style={{ background: 'var(--dsw-alias-state-error-primary)', borderColor: 'var(--dsw-alias-state-error-primary)' }}
              onClick={handleDeleteConfirm}
            >
              Xóa vĩnh viễn
            </Button>
          </div>
        }
      >
        <div style={{ fontSize: 13.5, color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.5 }}>
          Bạn có chắc chắn muốn xóa tài liệu <strong>"{deletingDoc?.file_name}"</strong>? Toàn bộ {deletingDoc?.chunk_count || 0} vector chunks liên quan trong Qdrant cũng sẽ được thu hồi.
        </div>
      </Modal>

      {/* Batch Delete Modal */}
      <Modal
        open={batchDeleting}
        onClose={() => setBatchDeleting(false)}
        title="Xóa hàng loạt tài liệu"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="outline" onClick={() => setBatchDeleting(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              style={{ background: 'var(--dsw-alias-state-error-primary)', borderColor: 'var(--dsw-alias-state-error-primary)' }}
              onClick={handleBatchDeleteConfirm}
            >
              Xóa {selectedIds.size} tài liệu
            </Button>
          </div>
        }
      >
        <div style={{ fontSize: 13.5, color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.5 }}>
          Bạn có chắc chắn muốn xóa <strong>{selectedIds.size} tài liệu</strong> đã chọn? Thao tác này sẽ xóa sạch dữ liệu văn bản và các vector chunks tương ứng khỏi Qdrant.
        </div>
      </Modal>
    </div>
  )
}

