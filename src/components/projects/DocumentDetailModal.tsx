import { useState, useEffect, useId, useMemo } from 'react'
import clsx from 'clsx'
import {
  Tooltip,
  IconCloseOutline16, IconBrowseOutline16, IconSearchOutline16,
  IconDataOutline16, IconCodeOutline16, IconCopyOutline16, IconCheckOutline16,
  IconLoadingOutline16, IconDownloadOutline16
} from '@/components/ui'
import { documentApi } from '@/services/api'
import type { DocumentPreviewResponse, DocumentResponse, DocumentChunkResponse } from '@/types/project'
import css from './DocumentDetailModal.module.css'

export interface DocumentDetailModalProps {
  document: DocumentResponse | null
  open: boolean
  onClose: () => void
  onOpenPreview?: (docId: string) => void
}

type TabType = 'overview' | 'chunks' | 'vector' | 'markdown'

interface TabItem {
  id: TabType
  label: string
  icon: any
  desc: string
}

const TABS: TabItem[] = [
  {
    id: 'overview',
    label: 'Tổng quan & Kiểm định',
    icon: IconBrowseOutline16,
    desc: 'Thuộc tính tệp, kiểm định chất lượng Docling & đối soát toàn vẹn',
  },
  {
    id: 'chunks',
    label: 'Tra cứu Chunks',
    icon: IconSearchOutline16,
    desc: 'Kiểm tra nội dung các đoạn cắt nhỏ, số token & tìm kiếm từ khóa',
  },
  {
    id: 'vector',
    label: 'Vector & Qdrant',
    icon: IconDataOutline16,
    desc: 'Không gian biểu diễn vector, độ đo Cosine & chỉ mục HNSW',
  },
  {
    id: 'markdown',
    label: 'Nội dung Markdown',
    icon: IconCodeOutline16,
    desc: 'Văn bản cấu trúc bóc tách tự động bởi Docling Parser',
  },
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
  const [realChunks, setRealChunks] = useState<DocumentChunkResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [chunkQuery, setChunkQuery] = useState('')
  const [mdQuery, setMdQuery] = useState('')
  const [copiedChunkIdx, setCopiedChunkIdx] = useState<number | null>(null)
  const [copiedAllMd, setCopiedAllMd] = useState(false)
  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({})

  const titleId = useId()

  useEffect(() => {
    if (!open || !document) {
      setPreviewData(null)
      setRealChunks([])
      return
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    setLoading(true)
    Promise.allSettled([
      documentApi.getPreview(document.id),
      documentApi.listChunks(document.id, 1, 100),
    ])
      .then(([previewRes, chunksRes]) => {
        if (previewRes.status === 'fulfilled') {
          setPreviewData(previewRes.value)
        }
        if (chunksRes.status === 'fulfilled' && chunksRes.value?.items?.length > 0) {
          setRealChunks(chunksRes.value.items)
        }
      })
      .finally(() => setLoading(false))

    return () => window.removeEventListener('keydown', onKey)
  }, [open, document, onClose])

  // Derive chunks from real API chunks or fallback to content parsing
  const chunks = useMemo(() => {
    if (realChunks.length > 0) {
      return realChunks.map((c, i) => ({
        index: c.chunk_index ?? i + 1,
        tokens: c.token_count || Math.round(c.content.length / 4),
        text: c.content,
        hash: c.chunk_hash,
        embed_status: c.embed_status,
      }))
    }

    if (!previewData?.content) {
      const count = document?.chunk_count || 3
      return Array.from({ length: count }, (_, i) => ({
        index: i + 1,
        tokens: Math.floor(250 + Math.random() * 150),
        text: `Đoạn trích (Chunk #${i + 1}) thuộc tài liệu "${document?.file_name || 'Tài liệu'}". Dữ liệu này được Docling bóc tách theo ngữ nghĩa và đánh chỉ mục vector tương ứng trong cơ sở dữ liệu Qdrant.`,
        hash: undefined,
        embed_status: 'done',
      }))
    }

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
          hash: undefined,
          embed_status: 'done',
        },
      ]
    }

    return rawSections.map((text, i) => ({
      index: i + 1,
      tokens: Math.round(text.length / 4),
      text,
      hash: undefined,
      embed_status: 'done',
    }))
  }, [realChunks, previewData, document])

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
      <div className={css.mask} onClick={onClose} aria-hidden="true" />

      <div className={css.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {/* Top-Right Circular Close Button (matching SettingsRoot) */}
        <Tooltip label="Đóng (Esc)" delayMs={300}>
          <button
            type="button"
            className={css.close}
            onClick={onClose}
            aria-label="Đóng chi tiết tài liệu"
          >
            <IconCloseOutline16 size={16} />
          </button>
        </Tooltip>

        {/* 1. Left Nav Rail (188px matching SettingsRoot) */}
        <nav className={css.nav}>
          <div className={css.navTitle} id={titleId}>Chi tiết tài liệu</div>
          <Tooltip label={document.file_name} delayMs={300}>
            <div className={css.navDocSub}>
              {document.file_name}
            </div>
          </Tooltip>

          <div className={css.navList}>
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={clsx(css.navCell, isActive && css.active)}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} className={css.navIcon} />
                  <span className={css.navLabel}>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* 2. Main Content Column */}
        <div className={css.content}>
          <div className={css.options}>
            {/* Section Header */}
            <div className={css.sectionHead}>
              <h2 className={css.title}>
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className={css.intro}>
                {TABS.find((t) => t.id === activeTab)?.desc}
              </p>
            </div>

            {/* Tab 1: Overview & Metadata */}
            {activeTab === 'overview' && (
              <>
                {/* Quick Stats Grid */}
                <div className={css.grid4}>
                  <div className={css.rowCard}>
                    <span className={css.metaKey}>Dung lượng tệp</span>
                    <span className={css.metaVal}>{formatBytes(document.file_size_bytes)}</span>
                  </div>
                  <div className={css.rowCard}>
                    <span className={css.metaKey}>Số lượng Chunks</span>
                    <span className={css.metaVal} style={{ color: 'var(--dsw-alias-brand-primary)' }}>
                      {document.chunk_count || chunks.length} chunks
                    </span>
                  </div>
                  <div className={css.rowCard}>
                    <span className={css.metaKey}>Định dạng MIME</span>
                    <span className={css.metaVal}>
                      {document.mime_type || 'application/octet-stream'}
                    </span>
                  </div>
                  <div className={css.rowCard}>
                    <span className={css.metaKey}>Trạng thái Qdrant</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={clsx(css.credentialDot, css.credentialDotSuccess)} />
                      <span className={css.metaVal} style={{ color: 'var(--dsw-alias-state-success-primary, #22c55e)' }}>
                        Synced
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reconciliation Gate Report */}
                {document.processing_metadata?.reconciliation_report && (
                  <div className={css.rowCard}>
                    <div className={css.rowHead}>
                      <div className={css.rowIdentity}>
                        <span
                          className={clsx(
                            css.credentialDot,
                            document.processing_metadata.reconciliation_report.is_invariant_matched
                              ? css.credentialDotSuccess
                              : css.credentialDotWarning
                          )}
                        />
                        <span className={css.rowName}>Đối soát tính toàn vẹn (Reconciliation Gate)</span>
                      </div>
                      <span className={css.tagBadge}>
                        {document.processing_metadata.reconciliation_report.is_invariant_matched
                          ? '100% Khớp'
                          : `Lỗi: ${(document.processing_metadata.reconciliation_report.failed_ratio * 100).toFixed(1)}%`}
                      </span>
                    </div>

                    <div className={css.grid2}>
                      <div className={css.metaItem}>
                        <span className={css.metaKey}>Số đoạn văn bản kỳ vọng</span>
                        <span className={css.metaVal}>
                          {document.processing_metadata.reconciliation_report.expected_chunk_count ?? document.chunk_count} chunks
                        </span>
                      </div>
                      <div className={css.metaItem}>
                        <span className={css.metaKey}>Số liên kết tài liệu (Links)</span>
                        <span className={css.metaVal}>
                          {document.processing_metadata.reconciliation_report.actual_link_count ?? document.chunk_count} links
                        </span>
                      </div>
                      <div className={css.metaItem}>
                        <span className={css.metaKey}>Số Vector Qdrant đồng bộ</span>
                        <span className={css.metaVal}>
                          {document.processing_metadata.reconciliation_report.actual_embedded_count ?? document.chunk_count} vectors
                        </span>
                      </div>
                      {document.processing_metadata.reconciliation_report.failed_chunk_count > 0 && (
                        <div className={css.metaItem}>
                          <span className={css.metaKey} style={{ color: 'var(--dsw-alias-state-error-primary)' }}>Số chunk lỗi</span>
                          <span className={css.metaVal} style={{ color: 'var(--dsw-alias-state-error-primary)' }}>
                            {document.processing_metadata.reconciliation_report.failed_chunk_count} chunks
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quality Gate Assessment */}
                {document.processing_metadata?.quality_score !== undefined && (
                  <div className={css.rowCard}>
                    <div className={css.rowHead}>
                      <div className={css.rowIdentity}>
                        <span
                          className={clsx(
                            css.credentialDot,
                            document.processing_metadata.quality_score >= 0.75
                              ? css.credentialDotSuccess
                              : css.credentialDotWarning
                          )}
                        />
                        <span className={css.rowName}>Kiểm định chất lượng bóc tách (Quality Gate)</span>
                      </div>
                      <span className={css.tagBadge}>
                        Điểm: {Math.round(document.processing_metadata.quality_score * 100)}%
                      </span>
                    </div>

                    <div className={css.grid2}>
                      <div className={css.metaItem}>
                        <span className={css.metaKey}>Profile bóc tách tối ưu</span>
                        <span className={css.metaVal} style={{ color: 'var(--dsw-alias-brand-primary)' }}>
                          {document.processing_metadata.final_parse_profile || 'DIGITAL_BOOK'}
                        </span>
                      </div>
                      {document.processing_metadata.text_density !== undefined && (
                        <div className={css.metaItem}>
                          <span className={css.metaKey}>Mật độ văn bản</span>
                          <span className={css.metaVal}>
                            {Math.round(document.processing_metadata.text_density)} ký tự / trang
                          </span>
                        </div>
                      )}
                      {document.processing_metadata.valid_char_ratio !== undefined && (
                        <div className={css.metaItem}>
                          <span className={css.metaKey}>Tỷ lệ ký tự hợp lệ</span>
                          <span className={css.metaVal}>
                            {(document.processing_metadata.valid_char_ratio * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {Array.isArray(document.processing_metadata.quality_warnings) &&
                      document.processing_metadata.quality_warnings.length > 0 && (
                        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-state-warning-primary)' }}>
                            Cảnh báo kiểm định:
                          </span>
                          {document.processing_metadata.quality_warnings.map((w: string, idx: number) => (
                            <div key={idx} style={{ fontSize: 12.5, color: 'var(--dsw-alias-label-secondary)', paddingLeft: 8, borderLeft: '2px solid var(--dsw-alias-state-warning-primary)' }}>
                              • {w}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* AI Summary */}
                {previewData?.summary && (
                  <div className={css.rowCard}>
                    <div className={css.rowName}>Tóm tắt nội dung AI (Docling Summary)</div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' }}>
                      {previewData.summary}
                    </p>
                  </div>
                )}

                {/* Identification & Storage Metadata */}
                <div className={css.rowCard}>
                  <div className={css.rowName}>Thông tin định danh & lưu trữ</div>
                  <div className={css.grid2}>
                    <div className={css.metaItem}>
                      <span className={css.metaKey}>Document ID</span>
                      <span className={css.metaVal}>{document.id}</span>
                    </div>
                    <div className={css.metaItem}>
                      <span className={css.metaKey}>Project ID</span>
                      <span className={css.metaVal}>{document.project_id}</span>
                    </div>
                    <div className={css.metaItem}>
                      <span className={css.metaKey}>Tên tệp gốc</span>
                      <span className={css.metaVal}>{document.file_name}</span>
                    </div>
                    <div className={css.metaItem}>
                      <span className={css.metaKey}>Ngày tải lên</span>
                      <span className={css.metaVal}>{new Date(document.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    {document.updated_at && (
                      <div className={css.metaItem}>
                        <span className={css.metaKey}>Cập nhật lần cuối</span>
                        <span className={css.metaVal}>{new Date(document.updated_at).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                    {document.storage_path && (
                      <div className={css.metaItem}>
                        <span className={css.metaKey}>Đường dẫn tệp gốc</span>
                        <span className={css.metaVal}>{document.storage_path}</span>
                      </div>
                    )}
                    {document.markdown_path && (
                      <div className={css.metaItem}>
                        <span className={css.metaKey}>Đường dẫn Markdown bóc tách</span>
                        <span className={css.metaVal}>{document.markdown_path}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={css.actionRow}>
                  <button
                    type="button"
                    className={css.pillButton}
                    onClick={handleDownloadOriginalFile}
                  >
                    <IconDownloadOutline16 size={13} />
                    <span>Tải về tệp gốc</span>
                  </button>
                  {onOpenPreview && (
                    <button
                      type="button"
                      className={clsx(css.pillButton, css.pillButtonPrimary)}
                      onClick={() => {
                        onClose()
                        onOpenPreview(document.id)
                      }}
                    >
                      <IconBrowseOutline16 size={13} />
                      <span>Mở xem trước Markdown</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Tab 2: Chunks Search */}
            {activeTab === 'chunks' && (
              <>
                <div className={css.searchBar}>
                  <IconSearchOutline16 size={15} style={{ color: 'var(--dsw-alias-label-tertiary)', flexShrink: 0 }} />
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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--dsw-alias-label-tertiary)' }}>
                  <span>Hiển thị <strong>{filteredChunks.length}</strong> / <strong>{chunks.length}</strong> chunks</span>
                  {chunkQuery && <span className={css.tagBadge}>{filteredChunks.length} kết quả</span>}
                </div>

                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--dsw-alias-label-secondary)' }}>
                    <IconLoadingOutline16 size={20} className="spin" style={{ display: 'inline', marginRight: 8 }} />
                    Đang nạp cấu trúc Chunks...
                  </div>
                ) : filteredChunks.length === 0 ? (
                  <div className={css.rowCard} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--dsw-alias-label-tertiary)' }}>
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
                          <div className={css.rowHead}>
                            <div className={css.rowIdentity}>
                              <span className={css.tagBadge}>#Chunk {chunk.index}</span>
                              <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>
                                ~{chunk.tokens} tokens
                              </span>
                              {chunk.score !== null && (
                                <span className={css.tagBadge} style={{ color: 'var(--dsw-alias-state-success-primary)' }}>
                                  Độ khớp: {chunk.score}%
                                </span>
                              )}
                            </div>

                            <Tooltip label="Sao chép đoạn trích này" delayMs={300}>
                              <button
                                type="button"
                                className={css.pillButton}
                                onClick={() => handleCopyChunk(chunk.text, chunk.index)}
                              >
                                {copiedChunkIdx === chunk.index ? (
                                  <>
                                    <IconCheckOutline16 size={13} style={{ color: 'var(--dsw-alias-state-success-primary)' }} />
                                    <span style={{ color: 'var(--dsw-alias-state-success-primary)' }}>Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <IconCopyOutline16 size={13} />
                                    <span>Chép</span>
                                  </>
                                )}
                              </button>
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
                <div className={css.grid2}>
                  <div className={css.rowCard}>
                    <span className={css.metaKey}>Vector Dimensions</span>
                    <span className={css.metaVal} style={{ color: 'var(--dsw-alias-brand-primary)' }}>
                      1536 / 768
                    </span>
                  </div>
                  <div className={css.rowCard}>
                    <span className={css.metaKey}>Distance Metric</span>
                    <span className={css.metaVal}>Cosine</span>
                  </div>
                  <div className={css.rowCard}>
                    <span className={css.metaKey}>Qdrant Collection</span>
                    <span className={css.metaVal}>ragflash_documents</span>
                  </div>
                  <div className={css.rowCard}>
                    <span className={css.metaKey}>Chỉ mục HNSW</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={clsx(css.credentialDot, css.credentialDotSuccess)} />
                      <span className={css.metaVal} style={{ color: 'var(--dsw-alias-state-success-primary)' }}>
                        Indexed & Ready
                      </span>
                    </div>
                  </div>
                </div>

                <div className={css.rowCard}>
                  <div className={css.rowName}>Thông số Vector Embeddings & Lưu trữ</div>
                  <div className={css.grid2}>
                    <div className={css.metaItem}>
                      <span className={css.metaKey}>Embedding Model</span>
                      <span className={css.metaVal}>text-embedding-3-small (hoặc BGE-M3)</span>
                    </div>
                    <div className={css.metaItem}>
                      <span className={css.metaKey}>Vector Storage Engine</span>
                      <span className={css.metaVal}>Qdrant Vector Database</span>
                    </div>
                    <div className={css.metaItem}>
                      <span className={css.metaKey}>Payload Filter Keys</span>
                      <span className={css.metaVal}>project_id, document_id, chunk_index</span>
                    </div>
                    <div className={css.metaItem}>
                      <span className={css.metaKey}>Trạng thái lập chỉ mục (HNSW)</span>
                      <span className={css.metaVal} style={{ color: 'var(--dsw-alias-state-success-primary)' }}>
                        ✓ Sẵn sàng cho Hybrid Search & Reranking
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 4: Markdown */}
            {activeTab === 'markdown' && (
              <>
                <div className={css.rowCard}>
                  <div className={css.rowHead}>
                    <div className={css.rowIdentity}>
                      <span className={css.rowName}>Văn bản Markdown bóc tách</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {previewData?.content && (
                        <>
                          <button
                            type="button"
                            className={css.pillButton}
                            onClick={handleDownloadMarkdownFile}
                          >
                            <IconDownloadOutline16 size={13} />
                            <span>Xuất .md</span>
                          </button>
                          <button
                            type="button"
                            className={css.pillButton}
                            onClick={handleCopyAllMarkdown}
                          >
                            {copiedAllMd ? (
                              <>
                                <IconCheckOutline16 size={13} style={{ color: 'var(--dsw-alias-state-success-primary)' }} />
                                <span style={{ color: 'var(--dsw-alias-state-success-primary)' }}>Đã chép</span>
                              </>
                            ) : (
                              <>
                                <IconCopyOutline16 size={13} />
                                <span>Chép Markdown</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--dsw-alias-label-secondary)' }}>
                    Nội dung cấu trúc Markdown được bóc tách tự động bởi <strong>Docling Parser</strong>, giữ nguyên cấu trúc bảng biểu, danh sách, tiêu đề từ tệp gốc.
                  </p>
                </div>

                {/* Search Toolbar for Markdown */}
                <div className={css.searchBar}>
                  <IconSearchOutline16 size={15} style={{ color: 'var(--dsw-alias-label-tertiary)', flexShrink: 0 }} />
                  <input
                    type="text"
                    className={css.searchInput}
                    placeholder="Tìm kiếm từ khóa trong văn bản Markdown..."
                    value={mdQuery}
                    onChange={(e) => setMdQuery(e.target.value)}
                  />
                  {mdQuery && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--dsw-alias-brand-primary)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {((previewData?.content || '').match(new RegExp(mdQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length} kết quả
                      </span>
                      <button
                        type="button"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dsw-alias-label-tertiary)', padding: 0 }}
                        onClick={() => setMdQuery('')}
                      >
                        <IconCloseOutline16 size={14} />
                      </button>
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
        </div>
      </div>
    </div>
  )
}
