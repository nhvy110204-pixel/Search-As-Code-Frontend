import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'
import { ArrowUp, Square, Plus, Terminal, Sparkles, BookOpen, Bug, Search, FileText } from 'lucide-react'
import type { AttachmentFile } from '@/types/chat'
import { AttachmentRail } from '@/components/attachment/AttachmentRail'
import { DropOverlay } from '@/components/attachment/DropOverlay'
import { ModelSelect } from '@/components/model-selection/ModelSelect'
import { ContextMeter } from './ContextMeter'
import { PopupSelectView, type CommandItem } from '@/components/commands/PopupSelectView'
import { Tooltip, SelectDropdown } from '@/components/ui'
import { useChatStore } from '@/store/useChatStore'
import css from './InputBar.module.css'

const SLASH_COMMANDS: CommandItem[] = [
  { id: 'goal', label: '/goal', detail: 'Chạy tác vụ tự động dài hạn tới khi hoàn thành mục tiêu', icon: <Sparkles size={14} /> },
  { id: 'plan', label: '/plan', detail: 'Lập kế hoạch hành động chi tiết trước khi thực hiện', icon: <FileText size={14} /> },
  { id: 'browser', label: '/browser', detail: 'Duyệt web và trích xuất dữ liệu trang web', icon: <Search size={14} /> },
  { id: 'debug', label: '/debug', detail: 'Chẩn đoán lỗi và gỡ lỗi mã nguồn', icon: <Bug size={14} /> },
  { id: 'explain', label: '/explain', detail: 'Giải thích chi tiết kiến trúc hoặc chức năng', icon: <BookOpen size={14} /> },
  { id: 'terminal', label: '/terminal', detail: 'Đề xuất lệnh bash / powershell an toàn', icon: <Terminal size={14} /> },
]

export interface InputBarProps {
  hero?: boolean
  isStreaming: boolean
  onSendMessage: (content: string, attachments?: AttachmentFile[]) => void
  onStopStreaming: () => void
}

export function InputBar({
  hero = false,
  isStreaming,
  onSendMessage,
  onStopStreaming,
}: InputBarProps) {
  const { availableModels, selectedModelId, selectedEffort, setSelectedModel, isPlanMode, togglePlanMode } = useChatStore()
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto resize
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const targetHeight = Math.max(hero ? 48 : 34, Math.min(el.scrollHeight, 220))
    el.style.height = `${targetHeight}px`
  }, [text, hero])

  // Handle slash commands detection
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)

    if (val.startsWith('/')) {
      setShowCommands(true)
      setCommandQuery(val.slice(1))
    } else {
      setShowCommands(false)
    }
  }

  const handleSelectCommand = (cmd: CommandItem) => {
    setText(`${cmd.label} `)
    setShowCommands(false)
    textareaRef.current?.focus()
  }

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming) return
    onSendMessage(text, attachments.length > 0 ? attachments : undefined)
    setText('')
    setAttachments([])
    setShowCommands(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showCommands) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newAtts: AttachmentFile[] = Array.from(files).map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }))
    setAttachments((prev) => [...prev, ...newAtts])
    e.target.value = ''
  }

  return (
    <div
      className={hero ? `${css.root} ${css.hero}` : css.root}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files?.length) {
          const newAtts = Array.from(e.dataTransfer.files).map((f) => ({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: f.name,
            size: f.size,
            type: f.type,
            url: URL.createObjectURL(f),
          }))
          setAttachments((prev) => [...prev, ...newAtts])
        }
      }}
    >
      <DropOverlay active={isDragging} />

      <div className={css.card}>
        {/* Floating Overlay Anchor for Popups */}
        <div className={css.overlayAnchor}>
          <PopupSelectView
            open={showCommands}
            query={commandQuery}
            commands={SLASH_COMMANDS}
            onSelect={handleSelectCommand}
            onClose={() => setShowCommands(false)}
          />
        </div>

        {attachments.length > 0 && (
          <div className={css.attachments}>
            <AttachmentRail
              items={attachments}
              onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
            />
          </div>
        )}

        <div className={css.scroll}>
          <div className={css.grow}>
            <textarea
              ref={textareaRef}
              className={css.input}
              rows={hero ? 2 : 1}
              placeholder={isPlanMode ? 'Nhập mục tiêu để lập kế hoạch hoặc gõ / để mở lệnh...' : 'Gửi tin nhắn hoặc gõ / để xem lệnh nhanh...'}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* Toolbar Row */}
        <div className={css.row}>
          <div className={css.tools}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Tooltip label="Đính kèm tệp / hình ảnh" delayMs={300}>
              <button
                type="button"
                className={css.add}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Đính kèm"
              >
                <Plus size={16} />
              </button>
            </Tooltip>

            <div className={css.modes}>
              <SelectDropdown
                variant="pill"
                placement="top"
                value={isPlanMode ? 'plan' : 'chat'}
                options={[
                  {
                    value: 'chat',
                    label: 'Chế độ Thường (Normal)',
                    description: 'Trò chuyện và phản hồi trực tiếp',
                  },
                  {
                    value: 'plan',
                    label: 'Chế độ Kế hoạch (Plan Mode)',
                    description: 'Tự động lập kế hoạch và duyệt trước khi thực thi',
                  },
                ]}
                onChange={(val) => {
                  if ((val === 'plan') !== isPlanMode) togglePlanMode()
                }}
              />
            </div>
          </div>

          <div className={css.trailing}>
            <ModelSelect
              models={availableModels}
              selectedModelId={selectedModelId}
              selectedEffort={selectedEffort}
              onSelect={setSelectedModel}
            />

            <ContextMeter />

            {isStreaming ? (
              <Tooltip label="Dừng phản hồi" delayMs={300}>
                <button
                  type="button"
                  className={css.primary}
                  onClick={onStopStreaming}
                  aria-label="Dừng"
                  style={{ background: 'var(--dsw-alias-button-info-fill)' }}
                >
                  <Square size={14} fill="currentColor" />
                </button>
              </Tooltip>
            ) : (
              <Tooltip label="Gửi tin nhắn (Enter)" delayMs={300}>
                <button
                  type="button"
                  className={css.primary}
                  disabled={!text.trim() && attachments.length === 0}
                  onClick={handleSend}
                  aria-label="Gửi tin nhắn"
                >
                  <ArrowUp size={18} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
