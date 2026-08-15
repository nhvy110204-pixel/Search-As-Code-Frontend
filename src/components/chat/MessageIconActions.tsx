import { useState, type ReactNode } from 'react'
import { IconCopyOutline16, IconCheckOutline16 } from '@/components/ui/icons'
import { Tooltip } from '@/components/ui/Tooltip'
import { writeClipboard } from '@/components/ui/clipboard'
import type { MessageStats } from '@/types/chat'
import css from './MessageIconActions.module.css'

export interface MessageIconActionsProps {
  text: string
  time?: number
  stats?: MessageStats
  extraActions?: ReactNode
  className?: string
}

export function MessageIconActions({ text, time, stats, extraActions, className }: MessageIconActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!text || copied) return
    const ok = await writeClipboard(text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  const timeLabel = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined

  return (
    <div className={`${css.root} ${className || ''}`}>
      <Tooltip label={copied ? 'Đã sao chép' : 'Sao chép văn bản'}>
        <button
          type="button"
          className={css.button}
          onClick={handleCopy}
          aria-label="Sao chép"
          data-copied={copied || undefined}
        >
          {copied ? <IconCheckOutline16 size={15} /> : <IconCopyOutline16 size={15} />}
        </button>
      </Tooltip>

      {extraActions}

      {timeLabel && <span className={css.clock}>{timeLabel}</span>}

      {stats && (
        <span className={css.stats}>
          {stats.durationMs !== undefined && <span>· {(stats.durationMs / 1000).toFixed(1)}s</span>}
          {stats.tokens !== undefined && <span>· {stats.tokens} tokens</span>}
          {stats.tps !== undefined && <span>· {stats.tps} tps</span>}
        </span>
      )}
    </div>
  )
}
