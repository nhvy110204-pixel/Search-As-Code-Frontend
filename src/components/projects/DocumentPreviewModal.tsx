import { useState, useEffect, useId } from 'react'
import {
  Button, Pill, Tooltip,
  IconCloseOutline16, IconCopyOutline16, IconCheckOutline16,
  IconDownloadOutline16, IconLoadingOutline16
} from '@/components/ui'
import { documentApi } from '@/services/api'
import type { DocumentPreviewResponse } from '@/types/project'
import css from './DocumentPreviewModal.module.css'

export interface DocumentPreviewModalProps {
  documentId: string | null
  onClose: () => void
}

export function DocumentPreviewModal({ documentId, onClose }: DocumentPreviewModalProps) {
  const [data, setData] = useState<DocumentPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (!documentId) {
      setData(null)
      return
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    setLoading(true)
    setError(null)

    documentApi
      .getPreview(documentId)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Không thể tải nội dung xem trước'))
      .finally(() => setLoading(false))

    return () => window.removeEventListener('keydown', onKey)
  }, [documentId, onClose])

  const handleCopyMarkdown = () => {
    if (!data?.content) return
    navigator.clipboard.writeText(data.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMarkdown = () => {
    if (!data?.content) return
    const blob = new Blob([data.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const baseName = (data.file_name || 'document').replace(/\.[^/.]+$/, '')
    link.href = url
    link.download = `${baseName}_parsed.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!documentId) return null

  return (
    <div className={css.overlay} role="presentation">
      <div className={css.mask} onClick={onClose} />

      <div className={css.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {/* Header - No bottom border line */}
        <div className={css.header}>
          <div className={css.headerLeft}>
            {data ? (
              <Tooltip label={data.file_name} delayMs={300}>
                <h2 className={css.title} id={titleId}>
                  Xem trước: {data.file_name}
                </h2>
              </Tooltip>
            ) : (
              <h2 className={css.title} id={titleId}>
                Xem trước tài liệu
              </h2>
            )}
            {data && (
              <div className={css.subtitle}>
                <span>Định dạng: {data.mime_type}</span>
                <span>•</span>
                <span>{data.chunk_count || 0} Chunks</span>
              </div>
            )}
          </div>

          <Tooltip label="Đóng (Esc)" delayMs={300}>
            <button
              type="button"
              className={css.closeButton}
              onClick={onClose}
              aria-label="Đóng cửa sổ xem trước"
            >
              <IconCloseOutline16 size={18} />
            </button>
          </Tooltip>
        </div>

        {/* Body */}
        <div className={css.body}>
          {loading && (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--dsw-alias-label-secondary)' }}>
              <IconLoadingOutline16 size={20} className="spin" style={{ display: 'inline', marginRight: 8 }} />
              Đang tải nội dung Markdown đã bóc tách...
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--dsw-static-red-50)',
                color: 'var(--dsw-static-red-600)',
                border: 'none',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* 1. Summary Box - No border line */}
              {data.summary && (
                <div className={css.summaryBox}>
                  <div className={css.summaryHeader}>
                    <Pill>Tóm tắt AI</Pill>
                    <span className={css.summaryTitle}>Tổng quan nội dung Docling</span>
                  </div>
                  <p className={css.summaryText}>
                    {data.summary}
                  </p>
                </div>
              )}

              {/* 2. Markdown Content Box - No border line */}
              <div className={css.markdownSection}>
                <div className={css.markdownHeader}>
                  <span className={css.sectionLabel}>Nội dung văn bản bóc tách (Markdown)</span>
                </div>
                <div className={css.markdownBox}>
                  {data.content || '(Chưa có nội dung văn bản nào được bóc tách từ file này)'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - No top border line */}
        <div className={css.footer}>
          {data?.content && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
                <IconDownloadOutline16 size={13} style={{ marginRight: 4 }} />
                <span>Xuất file .md</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCopyMarkdown}>
                {copied ? (
                  <>
                    <IconCheckOutline16 size={13} style={{ color: 'var(--dsw-static-green-500)', marginRight: 4 }} />
                    <span style={{ color: 'var(--dsw-static-green-500)' }}>Đã chép</span>
                  </>
                ) : (
                  <>
                    <IconCopyOutline16 size={13} style={{ marginRight: 4 }} />
                    <span>Chép Markdown</span>
                  </>
                )}
              </Button>
            </>
          )}
          <Button variant="primary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
