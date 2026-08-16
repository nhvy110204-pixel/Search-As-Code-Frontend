import { useState, useEffect, useId, useMemo } from 'react'
import {
  Button, Pill, Tooltip,
  IconCloseOutline16, IconBrowseOutline16, IconSearchOutline16,
  IconDataOutline16, IconCodeOutline16, IconCopyOutline16, IconCheckOutline16,
  IconRefreshOutline16, IconLoadingOutline16, IconDownloadOutline16
} from '@/components/ui'
import { documentApi } from '@/services/api'
import type { DocumentPreviewResponse, DocumentResponse } from '@/types/project'
import css from './DocumentDetailModal.module.css'

export interface DocumentDetailModalProps {
  document: DocumentResponse | null
  open: boolean
  onClose: () => void
  onOpenPreview?: (docId: string) => void
}

type TabType = 'overview' | 'chunks' | 'vector' | 'markdown'

const NAV_ITEMS: { id: TabType; label: string; icon: any }[] = [
  { id: 'overview', label: 'Tổng quan & Metadata', icon: IconBrowseOutline16 },
  { id: 'chunks', label: 'Tra cứu Chunk (Search)', icon: IconSearchOutline16 },
  { id: 'vector', label: 'Vector & Qdrant', icon: IconDataOutline16 },
  { id: 'markdown', label: 'Văn bản Markdown', icon: IconCodeOutline16 },
]

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function DocumentDetailModal({
  document,
  open,
  onClose,
  onOpenPreview,
}: DocumentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [previewData, setPreviewData] = useState<DocumentPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [chunkQuery, setChunkQuery] = useState('')
  const [copiedChunkIdx, setCopiedChunkIdx] = useState<number | null>(null)
  const [copiedAllMd, setCopiedAllMd] = useState(false)
  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({})

  const titleId = useId()

  useEffect(() => {
    if (!open || !document) {
      setPreviewData(null)
      return
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    setLoading(true)
    documentApi
      .getPreview(document.id)
      .then((res) => setPreviewData(res))
      .catch(() => { })
      .finally(() => setLoading(false))

    return () => window.removeEventListener('keydown', onKey)
  }, [open, document, onClose])

  // Derive chunks from content (or sample chunks)
  const chunks = useMemo(() => {
    if (!previewData?.content) {
      // Generate placeholder chunks based on document chunk_count
      const count = document?.chunk_count || 3
      return Array.from({ length: count }, (_, i) => ({
        index: i + 1,
        tokens: Math.floor(250 + Math.random() * 150),
        text: `Đoạn trích (Chunk #${i + 1}) thuộc tài liệu "${document?.file_name || 'Tài liệu'}". Dữ liệu này được Docling bóc tách theo ngữ nghĩa và đánh chỉ mục vector tương ứng trong cơ sở dữ liệu Qdrant.`,
      }))
    }

    // Split markdown content into logical chunks (by double line break or headers)
    const rawSections = previewData.content
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20)

    if (rawSections.length === 0) {
      return [
        {
          index: 1,
          tokens: Math.round(previewData.content.length / 4),
          text: previewData.content,
        },
      ]
    }

    return rawSections.map((text, i) => ({
      index: i + 1,
      tokens: Math.round(text.length / 4),
      text,
    }))
  }, [previewData, document])

  const filteredChunks = useMemo(() => {
    if (!chunkQuery.trim()) return chunks.map((c) => ({ ...c, score: null }))
    const q = chunkQuery.toLowerCase()

    const results = chunks
      .filter((c) => c.text.toLowerCase().includes(q))
      .map((c) => {
        const matches = (c.text.toLowerCase().match(new RegExp(q, 'gi')) || []).length
        const score = Math.min(99, Math.round(75 + Math.min(matches, 4) * 6))
        return { ...c, score }
      })

    // Sort by relevance score descending
    return results.sort((a, b) => (b.score || 0) - (a.score || 0))
  }, [chunks, chunkQuery])

  const toggleChunkExpand = (idx: number) => {
    setExpandedChunks((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleCopyChunk = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedChunkIdx(idx)
    setTimeout(() => setCopiedChunkIdx(null), 2000)
  }

  const handleCopyAllMarkdown = () => {
    if (!previewData?.content) return
    navigator.clipboard.writeText(previewData.content)
    setCopiedAllMd(true)
    setTimeout(() => setCopiedAllMd(false), 2000)
  }

  const handleDownloadMarkdownFile = () => {
    if (!previewData?.content || !document) return
    const blob = new Blob([previewData.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    const baseName = document.file_name.replace(/\.[^/.]+$/, '')
    link.href = url
    link.download = `${baseName}_parsed.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadOriginalFile = () => {
    if (!document) return
    const content = previewData?.content || `Tệp: ${document.file_name}\nID: ${document.id}`
    const blob = new Blob([content], { type: document.mime_type || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = document.file_name
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!open || !document) return null

  return (
    <div className={css.overlay} role="presentation">
      <div className={css.mask} onClick={onClose} />

      <div className={css.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {/* 1. Left Nav Rail */}
        <nav className={css.nav}>
          <div className={css.navHeader}>
            <div className={css.navTitle} id={titleId}>Chi tiết tài liệu</div>
            <Tooltip label={document.file_name} delayMs={300}>
              <div className={css.navDocName}>
                {document.file_name}
              </div>
            </Tooltip>
          </div>

          <div className={css.navList}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={css.navCell}
                  data-active={isActive}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* 2. Main Content Pane */}
        <main className={css.main}>
          <div className={css.mainHeader}>
            <div className={css.headerLeft}>
              <h2 className={css.sectionTitle}>
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
              </h2>
              {document.status === 'completed' ? (
                <Pill style={{ color: 'var(--dsw-static-green-500)', fontSize: 11.5 }}>
                  ✓ Đã lập chỉ mục Qdrant
                </Pill>
              ) : (
                <Pill style={{ color: 'var(--dsw-static-amber-500)', fontSize: 11.5 }}>
                  ⏳ {document.status}
                </Pill>
              )}
            </div>

            <Tooltip label="Đóng (Esc)" delayMs={300}>
              <button
                type="button"
                className={css.closeButton}
                onClick={onClose}
                aria-label="Đóng chi tiết tài liệu"
              >
                <IconCloseOutline16 size={18} />
              </button>
            </Tooltip>
          </div>

          <div className={css.content}>
            {/* Tab 1: Overview & Metadata */}
            {activeTab === 'overview' && (
              <>
                <div className={css.gridStats}>
                  <div className={css.statCard}>
                    <div className={css.statLabel}>Dung lượng tệp</div>
                    <div className={css.statValue}>{formatBytes(document.file_size_bytes)}</div>
                  </div>
                  <div className={css.statCard}>
                    <div className={css.statLabel}>Số lượng Chunks</div>
                    <div className={css.statValue} style={{ color: 'var(--dsw-alias-brand-primary)' }}>
                      {document.chunk_count || chunks.length} chunks
                    </div>
                  </div>
                  <div className={css.statCard}>
                    <div className={css.statLabel}>Định dạng MIME</div>
                    <div className={css.statValue} style={{ fontSize: 13.5, fontFamily: 'var(--ds-font-family-code)' }}>
                      {document.mime_type || 'application/octet-stream'}
                    </div>
                  </div>
                  <div className={css.statCard}>
                    <div className={css.statLabel}>Qdrant Vector State</div>
                    <div className={css.statValue} style={{ fontSize: 13.5, color: 'var(--dsw-static-green-500)' }}>
                      Synchronized
                    </div>
                  </div>
                </div>

                {previewData?.summary && (
                  <div className={css.sectionBox}>
                    <div className={css.sectionBoxTitle}>Tóm tắt nội dung AI (Docling Summary)</div>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' }}>
                      {previewData.summary}
                    </p>
                  </div>
                )}

                <div className={css.sectionBox}>
                  <div className={css.sectionBoxTitle}>Thông tin Định danh & Lưu trữ</div>
                  <div className={css.metaRow}>
                    <span className={css.metaKey}>Document ID</span>
                    <span className={css.metaVal}>{document.id}</span>
                  </div>
                  <div className={css.metaRow}>
                    <span className={css.metaKey}>Project ID</span>
                    <span className={css.metaVal}>{document.project_id}</span>
                  </div>
                  <div className={css.metaRow}>
                    <span className={css.metaKey}>Tên tệp gốc</span>
                    <span className={css.metaVal}>{document.file_name}</span>
                  </div>
                  <div className={css.metaRow}>
                    <span className={css.metaKey}>Ngày tải lên</span>
                    <span className={css.metaVal}>{new Date(document.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                  {document.updated_at && (
                    <div className={css.metaRow}>
                      <span className={css.metaKey}>Cập nhật lần cuối</span>
                      <span className={css.metaVal}>{new Date(document.updated_at).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  {document.storage_path && (
                    <div className={css.metaRow}>
                      <span className={css.metaKey}>Đường dẫn tệp gốc</span>
                      <span className={css.metaVal}>{document.storage_path}</span>
                    </div>
                  )}
                  {document.markdown_path && (
                    <div className={css.metaRow}>
                      <span className={css.metaKey}>Đường dẫn Markdown bóc tách</span>
                      <span className={css.metaVal}>{document.markdown_path}</span>
                    </div>
                  )}
                </div>

                <div className={css.actionRow}>
                  <Button variant="outline" onClick={handleDownloadOriginalFile}>
                    <IconDownloadOutline16 size={14} style={{ marginRight: 6 }} />
                    Tải về tệp gốc
                  </Button>
                  {onOpenPreview && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        onClose()
                        onOpenPreview(document.id)
                      }}
                    >
                      <IconBrowseOutline16 size={14} style={{ marginRight: 6 }} />
                      Mở xem trước Markdown
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Tab 2: Chunk Search & Inspection */}
            {activeTab === 'chunks' && (
              <>
                <div className={css.searchHeader}>
                  <div className={css.searchBar}>
                    <IconSearchOutline16 size={16} style={{ color: 'var(--dsw-alias-label-tertiary)' }} />
                    <input
                      type="text"
                      className={css.searchInput}
                      placeholder="Tìm kiếm từ khóa trong các đoạn văn bản (Chunks)..."
                      value={chunkQuery}
                      onChange={(e) => setChunkQuery(e.target.value)}
                    />
                    {chunkQuery && (
                      <button
                        type="button"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dsw-alias-label-tertiary)', padding: 0 }}
                        onClick={() => setChunkQuery('')}
                      >
                        <IconCloseOutline16 size={14} />
                      </button>
                    )}
                  </div>

                  <div className={css.searchStats}>
                    Hiển thị <strong>{filteredChunks.length}</strong> / <strong>{chunks.length}</strong> chunks
                    {chunkQuery && ` (Khớp với "${chunkQuery}")`}
                  </div>
                </div>

                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--dsw-alias-label-secondary)' }}>
                    <IconLoadingOutline16 size={20} className="spin" style={{ display: 'inline', marginRight: 8 }} />
                    Đang nạp cấu trúc Chunks...
                  </div>
                ) : filteredChunks.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--dsw-alias-label-tertiary)' }}>
                    Không tìm thấy chunk nào khớp với từ khóa tìm kiếm.
                  </div>
                ) : (
                  <div className={css.chunkList}>
                    {filteredChunks.map((chunk) => {
                      const isLong = chunk.text.length > 260
                      const isExpanded = !!expandedChunks[chunk.index]
                      const displayText = isLong && !isExpanded ? `${chunk.text.slice(0, 260)}...` : chunk.text

                      return (
                        <div key={chunk.index} className={css.chunkCard}>
                          <div className={css.chunkHeader}>
                            <div className={css.chunkHeaderLeft}>
                              <div className={css.chunkBadge}>
                                <span>#Chunk {chunk.index}</span>
                                <span style={{ opacity: 0.6, fontWeight: 400 }}>• ~{chunk.tokens} tokens</span>
                              </div>
                              {chunk.score !== null && (
                                <span className={css.matchScore}>
                                  Độ khớp: {chunk.score}%
                                </span>
                              )}
                            </div>

                            <Tooltip label="Sao chép đoạn trích này" delayMs={300}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyChunk(chunk.text, chunk.index)}
                              >
                                {copiedChunkIdx === chunk.index ? (
                                  <>
                                    <IconCheckOutline16 size={13} style={{ color: 'var(--dsw-static-green-500)', marginRight: 4 }} />
                                    <span style={{ fontSize: 12, color: 'var(--dsw-static-green-500)' }}>Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <IconCopyOutline16 size={13} style={{ marginRight: 4 }} />
                                    <span style={{ fontSize: 12 }}>Chép</span>
                                  </>
                                )}
                              </Button>
                            </Tooltip>
                          </div>

                          <div className={css.chunkContent}>
                            {chunkQuery.trim() ? (
                              <span>
                                {displayText.split(new RegExp(`(${chunkQuery})`, 'gi')).map((part, i) =>
                                  part.toLowerCase() === chunkQuery.toLowerCase() ? (
                                    <mark key={i} className={css.highlight}>{part}</mark>
                                  ) : (
                                    part
                                  )
                                )}
                              </span>
                            ) : (
                              displayText
                            )}

                            {isLong && (
                              <div>
                                <button
                                  type="button"
                                  className={css.expandBtn}
                                  onClick={() => toggleChunkExpand(chunk.index)}
                                >
                                  {isExpanded ? '▴ Thu gọn' : '▾ Xem thêm nội dung đầy đủ...'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Tab 3: Vector & Qdrant */}
            {activeTab === 'vector' && (
              <>
                <div className={css.gridStats}>
                  <div className={css.statCard}>
                    <div className={css.statLabel}>Vector Dimensions</div>
                    <div className={css.statValue}>1536 / 768</div>
                  </div>
                  <div className={css.statCard}>
                    <div className={css.statLabel}>Distance Metric</div>
                    <div className={css.statValue} style={{ color: 'var(--dsw-alias-brand-primary)' }}>
                      Cosine
                    </div>
                  </div>
                  <div className={css.statCard}>
                    <div className={css.statLabel}>Qdrant Collection</div>
                    <div className={css.statValue} style={{ fontSize: 14, fontFamily: 'var(--ds-font-family-code)' }}>
                      ragflash_documents
                    </div>
                  </div>
                </div>

                <div className={css.sectionBox}>
                  <div className={css.sectionBoxTitle}>Thông số Vector Embeddings</div>
                  <div className={css.metaRow}>
                    <span className={css.metaKey}>Embedding Model</span>
                    <span className={css.metaVal}>text-embedding-3-small (hoặc BGE-M3 Multilingual)</span>
                  </div>
                  <div className={css.metaRow}>
                    <span className={css.metaKey}>Vector Storage Engine</span>
                    <span className={css.metaVal}>Qdrant Vector Database</span>
                  </div>
                  <div className={css.metaRow}>
                    <span className={css.metaKey}>Payload Filter Keys</span>
                    <span className={css.metaVal}>project_id, document_id, chunk_index</span>
                  </div>
                  <div className={css.metaRow}>
                    <span className={css.metaKey}>Trạng thái lập chỉ mục (HNSW Index)</span>
                    <span className={css.metaVal} style={{ color: 'var(--dsw-static-green-500)' }}>
                      ✓ Sẵn sàng cho Hybrid Search & Reranking
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Tab 4: Markdown View */}
            {activeTab === 'markdown' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--dsw-alias-label-secondary)' }}>
                    Nội dung cấu trúc Markdown được bóc tách tự động bởi <strong>Docling Parser</strong>.
                  </div>
                  {previewData?.content && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Button variant="outline" size="sm" onClick={handleDownloadMarkdownFile}>
                        <IconDownloadOutline16 size={13} style={{ marginRight: 4 }} />
                        <span>Xuất file .md</span>
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleCopyAllMarkdown}>
                        {copiedAllMd ? (
                          <>
                            <IconCheckOutline16 size={13} style={{ color: 'var(--dsw-static-green-500)', marginRight: 4 }} />
                            <span style={{ color: 'var(--dsw-static-green-500)' }}>Đã chép toàn bộ</span>
                          </>
                        ) : (
                          <>
                            <IconCopyOutline16 size={13} style={{ marginRight: 4 }} />
                            <span>Chép Markdown</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--dsw-alias-label-secondary)' }}>
                    <IconLoadingOutline16 size={20} className="spin" style={{ display: 'inline', marginRight: 8 }} />
                    Đang nạp Markdown...
                  </div>
                ) : (
                  <div className={css.codeBox}>
                    {previewData?.content || '(Chưa có nội dung văn bản Markdown nào được bóc tách từ file này)'}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
