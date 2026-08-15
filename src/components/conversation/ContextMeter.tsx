import { useState, useRef, useEffect } from 'react'
import { Tooltip } from '@/components/ui'
import css from './ContextMeter.module.css'

const RADIUS = 5.5
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export interface ContextMeterProps {
  totalTokens?: number
  maxTokens?: number
  systemTokens?: number
  toolsTokens?: number
  messageTokens?: number
}

export function ContextMeter({
  totalTokens = 18420,
  maxTokens = 64000,
  systemTokens = 4200,
  toolsTokens = 2320,
  messageTokens = 11900,
}: ContextMeterProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)

  const percent = Math.min(100, Math.round((totalTokens / maxTokens) * 100))
  const strokeDashoffset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const breakdownTotal = systemTokens + toolsTokens + messageTokens || 1

  return (
    <span ref={rootRef} className={css.root}>
      <Tooltip label={`Dung lượng ngữ cảnh đã dùng: ${percent}%`} side="top" delayMs={200} disabled={open}>
        <button
          type="button"
          className={css.trigger}
          aria-label={`Ngữ cảnh ${percent}%`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r={RADIUS} className={css.track} />
            <circle
              cx="7"
              cy="7"
              r={RADIUS}
              className={css.fill}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 7 7)"
            />
          </svg>
        </button>
      </Tooltip>

      {open && (
        <div className={css.panel} role="dialog">
          <div className={css.header}>
            <span className={css.headline}>Dung lượng ngữ cảnh</span>
            <span className={css.figures}>
              {totalTokens.toLocaleString()} / {maxTokens.toLocaleString()}
            </span>
          </div>

          <div className={css.bar}>
            <div
              className={`${css.segment} ${css.colorSystem}`}
              style={{ width: `${(systemTokens / breakdownTotal) * 100}%` }}
            />
            <div
              className={`${css.segment} ${css.colorTools}`}
              style={{ width: `${(toolsTokens / breakdownTotal) * 100}%` }}
            />
            <div
              className={`${css.segment} ${css.colorMessages}`}
              style={{ width: `${(messageTokens / breakdownTotal) * 100}%` }}
            />
          </div>

          <dl className={css.rows}>
            <div className={css.row}>
              <dt>
                <span className={`${css.swatch} ${css.colorSystem}`} />
                System Prompt
              </dt>
              <dd>{systemTokens.toLocaleString()}</dd>
            </div>
            <div className={css.row}>
              <dt>
                <span className={`${css.swatch} ${css.colorTools}`} />
                Công cụ (Tools/MCP)
              </dt>
              <dd>{toolsTokens.toLocaleString()}</dd>
            </div>
            <div className={css.row}>
              <dt>
                <span className={`${css.swatch} ${css.colorMessages}`} />
                Tin nhắn hội thoại
              </dt>
              <dd>{messageTokens.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      )}
    </span>
  )
}
