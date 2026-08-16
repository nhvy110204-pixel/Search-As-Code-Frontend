import { IconCloseOutline16, IconBrowseOutline16 } from '@/components/ui'
import type { AttachmentFile } from '@/types/chat'
import css from './AttachmentRail.module.css'

export interface AttachmentRailProps {
  items: AttachmentFile[]
  onRemove: (id: string) => void
  onPreview?: (item: AttachmentFile) => void
}

export function AttachmentRail({ items, onRemove, onPreview }: AttachmentRailProps) {
  if (!items || items.length === 0) return null

  return (
    <div className={css.root}>
      <div className={css.rail}>
        {items.map((item) => {
          const isImage = item.type.startsWith('image/')
          return (
            <div key={item.id} className={css.item}>
              <button
                type="button"
                className={css.thumbnail}
                onClick={() => onPreview?.(item)}
                title={item.name}
              >
                {isImage && item.url ? (
                  <img src={item.url} alt={item.name} />
                ) : (
                  <div className={css.fileFallback}>
                    <IconBrowseOutline16 size={18} />
                    <span>{item.name.slice(0, 10)}</span>
                  </div>
                )}
              </button>
              <button
                type="button"
                className={css.remove}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(item.id)
                }}
                aria-label="Xóa đính kèm"
              >
                <IconCloseOutline16 size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
