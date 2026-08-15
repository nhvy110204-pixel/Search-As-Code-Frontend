import { useEffect, useRef, useState } from 'react'
import { DisclosureRow } from '@/components/ui/DisclosureRow'
import { IconThinkOutline14 } from '@/components/ui/icons'
import css from './ReasoningRow.module.css'

function firstLine(text: string): string {
  const newline = text.indexOf('\n')
  return newline === -1 ? text : text.slice(0, newline)
}

function latestLine(text: string): string {
  const visible = text.trimEnd()
  const newline = visible.lastIndexOf('\n')
  return newline === -1 ? visible : visible.slice(newline + 1)
}

export interface ReasoningRowProps {
  text: string
  running?: boolean
  title?: string
}

/**
 * Render assistant reasoning block as the collapsible Thinking disclosure row.
 */
export function ReasoningRow({ text, running = false, title = 'Suy nghĩ' }: ReasoningRowProps) {
  const [expanded, setExpanded] = useState(false)
  const summaryRef = useRef<HTMLSpanElement>(null)
  const summary = running ? latestLine(text) : firstLine(text)

  useEffect(() => {
    const element = summaryRef.current
    if (element === null) return
    element.scrollLeft = running ? element.scrollWidth - element.clientWidth : 0
  }, [running, summary])

  if (!text) return null

  return (
    <div className={css.root} data-variant="think" data-state={running ? 'running' : 'ok'}>
      <DisclosureRow
        rowClassName={css.row}
        leadingClassName={css.leading}
        titleClassName={css.title}
        chevronClassName={css.chevron}
        icon={<IconThinkOutline14 size={14} />}
        title={running ? `${title} (đang suy nghĩ...)` : `${title} (${Math.ceil(text.length / 4)} tokens)`}
        open={expanded}
        expandable
        expandOnRowClick
        onToggle={() => setExpanded((v) => !v)}
        collapsedContent={
          <>
            <span className={css.separator} aria-hidden />
            <span ref={summaryRef} className={css.summary} data-follow-end={running || undefined}>
              {summary || 'Đang phân tích dữ liệu...'}
            </span>
          </>
        }
      >
        <div className={css.thinkBody}>{text}</div>
      </DisclosureRow>
    </div>
  )
}
