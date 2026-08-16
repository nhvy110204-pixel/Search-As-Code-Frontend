import { IconDownloadOutline16 } from '@/components/ui'
import css from './DropOverlay.module.css'

export interface DropOverlayProps {
  active: boolean
  label?: string
}

export function DropOverlay({ active, label = 'Thả tệp vào đây để tải lên' }: DropOverlayProps) {
  if (!active) return null

  return (
    <div className={css.overlay}>
      <IconDownloadOutline16 size={36} className={css.icon} style={{ transform: 'rotate(180deg)' }} />
      <span className={css.text}>{label}</span>
    </div>
  )
}
