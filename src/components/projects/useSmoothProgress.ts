import { useState, useEffect, useRef } from 'react'

// Global in-memory cache to preserve interpolated progress across component unmount/remount
const progressCache = new Map<string, number>()

/**
 * useSmoothProgress
 * High-performance perceptual progress interpolation & micro-trickle hook.
 * Preserves progress across window minimize/reopen, tab switching, and component remounts.
 *
 * @param targetProgress Real progress percentage from backend/store (0-100)
 * @param isProcessing Whether the task is currently active
 * @param isCompleted Whether the task has reached terminal completion
 * @param cacheKey Unique identifier (e.g. item.id or doc.id) to persist interpolated progress
 * @returns Current smoothly interpolated progress integer (0-100)
 */
export function useSmoothProgress(
  targetProgress: number,
  isProcessing: boolean,
  isCompleted: boolean,
  cacheKey?: string
): number {
  const cachedVal = cacheKey ? progressCache.get(cacheKey) : undefined
  const initialProgress = isCompleted ? 100 : Math.max(targetProgress, cachedVal ?? targetProgress)

  const [displayProgress, setDisplayProgress] = useState<number>(initialProgress)
  const currentRef = useRef<number>(initialProgress)
  const targetRef = useRef<number>(targetProgress)
  targetRef.current = targetProgress

  useEffect(() => {
    if (isCompleted) {
      setDisplayProgress(100)
      currentRef.current = 100
      if (cacheKey) progressCache.set(cacheKey, 100)
      return
    }

    if (!isProcessing) {
      const val = Math.max(targetProgress, currentRef.current)
      setDisplayProgress(val)
      currentRef.current = val
      if (cacheKey) progressCache.set(cacheKey, val)
      return
    }

    let animationFrameId: number
    let lastTickTime = performance.now()

    const updateLoop = (now: number) => {
      const delta = Math.min(now - lastTickTime, 64) // Clamp to prevent jumps on tab freeze
      lastTickTime = now

      const current = currentRef.current
      const target = Math.max(targetRef.current, current)

      if (current < target) {
        // Interpolate towards target (fast at first, smoothly decelerating)
        const step = Math.max(0.4, (target - current) * 0.12 * (delta / 16.6))
        const next = Math.min(target, current + step)
        currentRef.current = next
        const rounded = Math.round(next)
        setDisplayProgress(rounded)
        if (cacheKey) progressCache.set(cacheKey, rounded)
      } else if (current < 92 && isProcessing) {
        // Micro-trickle: creep forward slowly while waiting for next poll
        const trickleRate = Math.max(0.015, (92 - current) * 0.0008) * (delta / 16.6)
        const next = Math.min(92, current + trickleRate)
        currentRef.current = next
        const rounded = Math.round(next)
        setDisplayProgress(rounded)
        if (cacheKey) progressCache.set(cacheKey, rounded)
      }

      animationFrameId = requestAnimationFrame(updateLoop)
    }

    animationFrameId = requestAnimationFrame(updateLoop)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isProcessing, isCompleted, targetProgress, cacheKey])

  return isCompleted ? 100 : displayProgress
}
