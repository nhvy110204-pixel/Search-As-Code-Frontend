import { useState, useEffect } from 'react'
import { Modal, Button, Pill } from '@/components/ui'
import { documentApi } from '@/services/api'
import type { DocumentPreviewResponse } from '@/types/project'

export interface DocumentPreviewModalProps {
  documentId: string | null
  onClose: () => void
}

export function DocumentPreviewModal({ documentId, onClose }: DocumentPreviewModalProps) {
  const [data, setData] = useState<DocumentPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) {
      setData(null)
      return
    }

    setLoading(true)
    setError(null)

    documentApi
      .getPreview(documentId)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Không thể tải nội dung xem trước'))
      .finally(() => setLoading(false))
  }, [documentId])

  return (
    <Modal
      open={documentId !== null}
      onClose={onClose}
      closeLabel="Đóng"
      title={data ? `Xem trước: ${data.file_name}` : 'Xem trước tài liệu'}
      description={data ? `Định dạng: ${data.mime_type} • Số Chunks: ${data.chunk_count}` : undefined}
      footer={(
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      )}
    >
      {loading && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--dsw-alias-label-secondary)' }}>
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
            border: '1px solid var(--dsw-static-red-100)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary Box */}
          {data.summary && (
            <div
              style={{
                padding: 14,
                borderRadius: 'var(--dsw-radius-lg, 16px)',
                background: 'var(--dsw-alias-bg-module-platform)',
                border: '1px solid var(--dsw-alias-border-l1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Pill>Tóm tắt AI</Pill>
                <span style={{ fontSize: 13, fontWeight: 550, color: 'var(--dsw-alias-label-primary)' }}>
                  Tổng quan nội dung
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' }}>
                {data.summary}
              </p>
            </div>
          )}

          {/* Markdown Content Box */}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--dsw-alias-label-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              Nội dung văn bản bóc tách (Markdown)
            </div>
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                padding: 16,
                borderRadius: 'var(--dsw-radius-lg, 16px)',
                background: 'var(--dsw-alias-bg-base)',
                border: '1px solid var(--dsw-alias-border-l2)',
                fontFamily: 'var(--dsw-font-mono, monospace)',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--dsw-alias-label-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {data.content || '(Chưa có nội dung văn bản nào được bóc tách từ file này)'}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
