import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { useProjectStore } from '@/store/useProjectStore'

export interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (projectId: string) => void
}

export function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const { createProject } = useProjectStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const created = await createProject(name.trim(), description.trim() || undefined)
      setName('')
      setDescription('')
      onClose()
      onCreated?.(created.id)
    } catch (err: any) {
      setError(err.message || 'Không thể tạo dự án')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel="Hủy"
      title="Tạo Không gian Dự án Mới"
      description="Khởi tạo một không gian tài liệu RAG độc lập để tải lên tài liệu và bắt đầu nghiên cứu, trò chuyện chuyên sâu."
      footer={(
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim() || isSubmitting}
            onClick={() => handleSubmit()}
          >
            {isSubmitting ? 'Đang khởi tạo...' : 'Tạo Dự án'}
          </Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              background: 'var(--dsw-static-red-50)',
              color: 'var(--dsw-static-red-600)',
              border: '1px solid var(--dsw-static-red-100)',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 550,
              color: 'var(--dsw-alias-label-primary)',
              marginBottom: 6,
            }}
          >
            Tên dự án <span style={{ color: 'var(--dsw-static-red-500)' }}>*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Nghiên cứu Thị trường AI 2026..."
            autoFocus
            required
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 550,
              color: 'var(--dsw-alias-label-primary)',
              marginBottom: 6,
            }}
          >
            Mô tả dự án (Tùy chọn)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả tóm tắt mục tiêu hoặc phạm vi tài liệu trong dự án này..."
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
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
      </form>
    </Modal>
  )
}
