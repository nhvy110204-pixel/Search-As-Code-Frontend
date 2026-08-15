import { useState } from 'react'
import { FolderPlus, X } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { Button } from '@/components/ui/Button'
import css from './AddWorkspaceModal.module.css'

export interface AddWorkspaceModalProps {
  open: boolean
  onClose: () => void
}

export function AddWorkspaceModal({ open, onClose }: AddWorkspaceModalProps) {
  const { addWorkspace } = useChatStore()
  const [name, setName] = useState('')
  const [path, setPath] = useState('')

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addWorkspace(name.trim(), path.trim() || `/workspace/${name.toLowerCase().replace(/\s+/g, '-')}`)
    setName('')
    setPath('')
    onClose()
  }

  return (
    <div className={css.overlay}>
      <div className={css.mask} onClick={onClose} />
      <div className={css.modal} role="dialog" aria-modal="true">
        <div className={css.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderPlus size={18} style={{ color: 'var(--dsw-alias-brand-primary-new-colorprimary-new-color)' }} />
            <h3 className={css.title}>Thêm Thư mục / Workspace</h3>
          </div>
          <button type="button" className={css.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className={css.formGroup}>
            <label className={css.label}>Tên Workspace / Dự án</label>
            <input
              type="text"
              autoFocus
              className={css.input}
              placeholder="VD: Dự án AI E-commerce..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={css.formGroup}>
            <label className={css.label}>Đường dẫn thư mục (Path)</label>
            <input
              type="text"
              className={css.input}
              placeholder="VD: /home/projects/ecommerce hoặc D:\Projects..."
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
          </div>

          <div className={css.footer}>
            <Button variant="ghost" type="button" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={!name.trim()}>
              Tạo Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
