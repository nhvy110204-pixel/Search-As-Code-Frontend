import type { AttachmentFile } from '@/types/chat'
import css from './MessageImage.module.css'

export interface MessageImageProps {
  attachments?: AttachmentFile[]
  onOpenLightbox?: (url: string) => void
}

export function MessageImage({ attachments, onOpenLightbox }: MessageImageProps) {
  if (!attachments || attachments.length === 0) return null

  const imageAttachments = attachments.filter((a) => a.type.startsWith('image/') && a.url)
  if (imageAttachments.length === 0) return null

  return (
    <div className={css.container}>
      {imageAttachments.map((img) => (
        <img
          key={img.id}
          src={img.url}
          alt={img.name}
          className={css.thumb}
          onClick={() => onOpenLightbox?.(img.url)}
        />
      ))}
    </div>
  )
}
