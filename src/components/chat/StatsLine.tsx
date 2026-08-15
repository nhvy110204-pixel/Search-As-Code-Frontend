import type { MessageStats } from '@/types/chat'
import css from './StatsLine.module.css'

export interface StatsLineProps {
  stats?: MessageStats
  className?: string
}

export function StatsLine({ stats, className }: StatsLineProps) {
  if (!stats) return null
  const { durationMs, tokens, tps } = stats
  if (durationMs === undefined && tokens === undefined && tps === undefined) {
    return null
  }

  const parts: string[] = []
  if (durationMs !== undefined) {
    parts.push(`${(durationMs / 1000).toFixed(1)}s`)
  }
  if (tokens !== undefined) {
    parts.push(`${tokens} tokens`)
  }
  if (tps !== undefined) {
    parts.push(`${tps} tokens/s`)
  }

  return (
    <div className={`${css.root} ${className || ''}`}>
      {parts.map((p, idx) => (
        <span key={idx}>
          {idx > 0 && <span className={css.sep}>·</span>}
          {p}
        </span>
      ))}
    </div>
  )
}
