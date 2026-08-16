import { useEffect } from 'react'
import { IconCloseOutline16 } from '@/components/ui'
import css from './ImageLightbox.module.css'

export interface ImageLightboxProps {
  url: string | null
  alt?: string
  onClose: () => void
}

export function ImageLightbox({ url, alt = 'Xem ảnh', onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!url) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [url, onClose])

  if (!url) return null

  return (
    <div className={css.backdrop} onClick={onClose}>
      <div className={css.content} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={css.closeButton} onClick={onClose} aria-label="Đóng">
          <IconCloseOutline16 size={18} />
        </button>
        <img src={url} alt={alt} className={css.image} />
      </div>
    </div>
  )
}
