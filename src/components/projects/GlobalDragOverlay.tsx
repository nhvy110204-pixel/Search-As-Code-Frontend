import { IconDownloadOutline16 } from '@/components/ui'
import css from './GlobalDragOverlay.module.css'

export interface GlobalDragOverlayProps {
  visible: boolean
}

export function GlobalDragOverlay({ visible }: GlobalDragOverlayProps) {
  if (!visible) return null

  return (
    <div className={css.overlay} aria-hidden="true">
      <div className={css.box}>
        <div className={css.iconCircle}>
          <IconDownloadOutline16 size={32} style={{ transform: 'rotate(180deg)' }} />
        </div>
        <div className={css.title}>Thả tài liệu để nạp vào tri thức RAG</div>
        <div className={css.subtitle}>
          Docling AI sẽ tự động phân tích cấu trúc bảng biểu, cắt đoạn tối ưu và lưu vector vào Qdrant.
        </div>
      </div>
    </div>
  )
}
