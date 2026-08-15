import { UploadCloud } from 'lucide-react'
import css from './DropOverlay.module.css'

export interface DropOverlayProps {
  active: boolean
  label?: string
}

export function DropOverlay({ active, label = 'Thả tệp vào đây để tải lên' }: DropOverlayProps) {
  if (!active) return null

  return (
    <div className={css.overlay}>
      <UploadCloud size={36} className={css.icon} />
      <span className={css.text}>{label}</span>
    </div>
  )
}
