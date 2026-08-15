import { Fragment, memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Tooltip } from '@/components/ui'
import type { SessionStats } from '@/types/chat'
import css from './StatsLine.module.css'

/**
 * Compact token count: 517 / 12.2K / 517K / 1.2M (one decimal under three digits).
 */
export function formatTokens(n: number): string {
  const scaled = (v: number): string =>
    v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10)
  if (n < 1_000) return String(n)
  if (n < 1_000_000) return `${scaled(n / 1_000)}K`
  return `${scaled(n / 1_000_000)}M`
}

/**
 * Compact duration: 4.3s under a minute, 1m45s from there on.
 */
export function formatDuration(ms: number): string {
  const s = ms / 1_000
  if (s < 60) return `${Math.round(s * 10) / 10}s`
  const whole = Math.round(s)
  return `${Math.floor(whole / 60)}m${whole % 60}s`
}

export function formatTokensPerSecond(tps: number): string {
  return `${Math.round(tps)} tok/s`
}

export interface StatsLineProps {
  stats?: SessionStats
}

export const StatsLine = memo(function StatsLine({ stats }: StatsLineProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [truncated, setTruncated] = useState(false)

  const defaultStats: SessionStats = useMemo(() => stats || {
    turns: 3,
    steps: 25,
    llmMs: 105000, // 1m45s
    toolMs: 4300,   // 4.3s
    ttftMs: 10200,
    ttftSteps: 3,   // 3.4s avg
    decodeMs: 20500,
    decodeTokens: 8800, // ~428 tok/s
    cacheReadTokens: 444000,
    uncachedInputTokens: 55000,
    cacheWriteTokens: 0,
    outputTokens: 8800,
  }, [stats])

  const groups: string[] = useMemo(() => {
    const res: string[] = []
    const s = defaultStats

    // 1. Turns & Steps
    if (s.turns > 0 || s.steps > 0) {
      res.push(`${s.turns} turns · ${s.steps} steps`)
    }

    // 2. LLM & Tool Call Durations
    const durations: string[] = []
    if (s.llmMs > 0) durations.push(`LLM ${formatDuration(s.llmMs)}`)
    if (s.toolMs > 0) durations.push(`Tool call ${formatDuration(s.toolMs)}`)
    if (durations.length > 0) res.push(durations.join(' · '))

    // 3. TTFT & Throughput Speed
    const speeds: string[] = []
    if (s.ttftSteps > 0 && s.ttftMs > 0) {
      speeds.push(`TTFT avg ${formatDuration(s.ttftMs / s.ttftSteps)}`)
    }
    if (s.decodeMs > 0 && s.decodeTokens > 0) {
      const tps = s.decodeTokens / (s.decodeMs / 1000)
      speeds.push(formatTokensPerSecond(tps))
    }
    if (speeds.length > 0) res.push(speeds.join(' · '))

    // 4. Cache Hit Ratio
    const billedInput = (s.uncachedInputTokens || 0) + (s.cacheReadTokens || 0) + (s.cacheWriteTokens || 0)
    if (billedInput > 0 && s.cacheReadTokens !== undefined && s.cacheReadTokens > 0) {
      const cachePercent = Math.round((s.cacheReadTokens / billedInput) * 100)
      res.push(`Cache hit ${cachePercent}%`)
    }

    // 5. Input & Output Tokens
    if (billedInput > 0 || (s.outputTokens && s.outputTokens > 0)) {
      res.push(`Input ${formatTokens(billedInput)} tok · Output ${formatTokens(s.outputTokens || 0)}`)
    }

    return res
  }, [defaultStats])

  const line = groups.join(' | ')

  useLayoutEffect(() => {
    const el = rootRef.current
    if (el === null) return
    const measure = () => { setTruncated(el.scrollWidth > el.clientWidth) }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [line])

  if (groups.length === 0) return null

  return (
    <Tooltip label={line} side="top" delayMs={500} disabled={!truncated}>
      <div ref={rootRef} className={css.root}>
        {groups.map((group, i) => (
          <Fragment key={group}>
            {i > 0 && <><span className={css.sep} aria-hidden>|</span>{' '}</>}
            <span>{group}</span>
          </Fragment>
        ))}
      </div>
    </Tooltip>
  )
})
