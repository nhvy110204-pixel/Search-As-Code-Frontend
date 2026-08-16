import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import {
  IconSendOutline16, IconStopFill16, IconPaperclipOutline16, Tooltip
} from '@/components/ui'
import type { AttachmentFile } from '@/types/chat'
import { AttachmentRail } from '@/components/attachment/AttachmentRail'
import { DropOverlay } from '@/components/attachment/DropOverlay'
import css from './ChatInput.module.css'

export interface ChatInputProps {
  isStreaming: boolean
  isPlanMode?: boolean
  onSendMessage: (content: string, attachments?: AttachmentFile[]) => void
  onStopStreaming: () => void
  placeholder?: string
}

export function ChatInput({
  isStreaming,
  isPlanMode = false,
  onSendMessage,
  onStopStreaming,
  placeholder = 'Hỏi tôi bất cứ điều gì... (Shift + Enter để xuống dòng)',
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return
    onSendMessage(text, attachments.length > 0 ? attachments : undefined)
    setText('')
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newAttachments: AttachmentFile[] = Array.from(files).map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }))

    setAttachments((prev) => [...prev, ...newAttachments])
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const newAttachments: AttachmentFile[] = Array.from(files).map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }))

    setAttachments((prev) => [...prev, ...newAttachments])
  }

  return (
    <div
      className={css.root}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DropOverlay active={isDragging} />

      <div className={css.composer}>
        <AttachmentRail
          items={attachments}
          onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        />

        <textarea
          ref={textareaRef}
          className={css.textarea}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isPlanMode ? 'Nhập nhiệm vụ hoặc mục tiêu để lập kế hoạch...' : placeholder}
        />

        <div className={css.footer}>
          <div className={css.leftControls}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Tooltip label="Đính kèm tệp / ảnh">
              <button
                type="button"
                className={css.attachButton}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Đính kèm tệp"
              >
                <IconPaperclipOutline16 size={18} />
              </button>
            </Tooltip>
          </div>

          <div className={css.rightControls}>
            {isStreaming ? (
              <Tooltip label="Dừng phản hồi">
                <button
                  type="button"
                  className={css.stopButton}
                  onClick={onStopStreaming}
                  aria-label="Dừng sinh phản hồi"
                >
                  <IconStopFill16 size={14} />
                </button>
              </Tooltip>
            ) : (
              <Tooltip label="Gửi tin nhắn (Enter)">
                <button
                  type="button"
                  className={css.sendButton}
                  disabled={!text.trim() && attachments.length === 0}
                  onClick={handleSend}
                  aria-label="Gửi"
                >
                  <IconSendOutline16 size={18} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <div className={css.disclaimer}>
        AI có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng trước khi sử dụng.
      </div>
    </div>
  )
}
