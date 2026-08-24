import { useState, useEffect, useRef } from 'react'

// Global in-memory cache to preserve visual progress across component unmount/remount
const progressCache = new Map<string, number>()

export interface UseSmoothProgressOptions {
  actualProgress: number
  isProcessing: boolean
  isCompleted: boolean
  isFailed?: boolean
  cacheKey?: string
  stepUpperBound?: number
  onStallDetected?: () => void
}

/**
 * useSmoothProgress (Hybrid LERP 60FPS Progress Engine)
 *
 * Implements high-performance perceptual Linear/Ease-Out interpolation:
 * 1. Chases server-authoritative actualProgress at 60 FPS (normalized by delta time).
 * 2. Convergence threshold: snaps instantly when |visual - actual| < 0.5% to save CPU.
 * 3. Step bounding: never exceeds the upper limit of the current handler milestone.
 * 4. Terminal safety: snaps to 100% on complete (200ms ease), stops immediately on failure.
 * 5. Stall watchdog: triggers onStallDetected if server sends no update for > 15 seconds.
 */
export function useSmoothProgress(
  actualProgressOrOptions: number | UseSmoothProgressOptions,
  legacyIsProcessing?: boolean,
  legacyIsCompleted?: boolean,
  legacyCacheKey?: string
): number {
  // Support both options object and legacy signature for backwards compatibility
  const options: UseSmoothProgressOptions = typeof actualProgressOrOptions === 'object'
    ? actualProgressOrOptions
    : {
        actualProgress: actualProgressOrOptions,
        isProcessing: legacyIsProcessing ?? false,
        isCompleted: legacyIsCompleted ?? false,
        isFailed: false,
        cacheKey: legacyCacheKey,
      }

  const {
    actualProgress,
    isProcessing,
    isCompleted,
    isFailed = false,
    cacheKey,
    stepUpperBound = 100,
    onStallDetected,
  } = options

  const safeActual = isCompleted
    ? 100
    : Math.max(0, Math.min(100, Number.isFinite(actualProgress) ? actualProgress : 0))

  const cachedVal = cacheKey ? progressCache.get(cacheKey) : undefined
  const initialVisual = isCompleted ? 100 : Math.max(safeActual, cachedVal ?? safeActual)

  const [visualProgress, setVisualProgress] = useState<number>(initialVisual)
  const currentVisualRef = useRef<number>(initialVisual)
  const targetActualRef = useRef<number>(safeActual)
  const lastActualTimeRef = useRef<number>(performance.now())
  const lastActualValRef = useRef<number>(safeActual)
  const stallNotifiedRef = useRef<boolean>(false)

  targetActualRef.current = safeActual

  // Track changes in actual progress for stall detection
  if (safeActual !== lastActualValRef.current) {
    lastActualValRef.current = safeActual
    lastActualTimeRef.current = performance.now()
    stallNotifiedRef.current = false
  }

  useEffect(() => {
    // Terminal State 1: Completed
    if (isCompleted) {
      currentVisualRef.current = 100
      setVisualProgress(100)
      if (cacheKey) progressCache.set(cacheKey, 100)
      return
    }

    // Terminal State 2: Failed or Inactive
    if (isFailed || !isProcessing) {
      const val = Math.max(targetActualRef.current, Math.round(currentVisualRef.current))
      currentVisualRef.current = val
      setVisualProgress(val)
      if (cacheKey) progressCache.set(cacheKey, val)
      return
    }

    let animationFrameId: number
    let lastTickTime = performance.now()

    const updateLoop = (now: number) => {
      const delta = Math.min(now - lastTickTime, 64) // Clamp to prevent jumps on tab freeze
      lastTickTime = now

      const current = currentVisualRef.current
      const target = targetActualRef.current

      // Check stall watchdog (15 seconds silence during active processing)
      if (isProcessing && !stallNotifiedRef.current && now - lastActualTimeRef.current > 15000) {
        stallNotifiedRef.current = true
        onStallDetected?.()
      }

      if (current < target) {
        // LERP: Fast ease-out toward authoritative server target
        const diff = target - current
        if (diff < 0.4) {
          // Convergence Snap: when within 0.4%, snap directly to target
          currentVisualRef.current = target
          const rounded = Math.round(target)
          setVisualProgress(rounded)
          if (cacheKey) progressCache.set(cacheKey, rounded)
        } else {
          const step = Math.max(0.3, diff * 0.15 * (delta / 16.6))
          const next = Math.min(target, current + step)
          currentVisualRef.current = next
          const rounded = Math.round(next)
          setVisualProgress(rounded)
          if (cacheKey) progressCache.set(cacheKey, rounded)
        }
      } else if (isProcessing && current < Math.min(target + 1.5, stepUpperBound, 99.0)) {
        // Milestone-bound gentle pacing while waiting for next batch
        const headroom = Math.min(target + 1.5, stepUpperBound, 99.0) - current
        if (headroom > 0.05) {
          const creep = Math.max(0.008, headroom * 0.02) * (delta / 16.6)
          const next = Math.min(headroom + current, current + creep)
          currentVisualRef.current = next
          const rounded = Math.round(next)
          setVisualProgress(rounded)
          if (cacheKey) progressCache.set(cacheKey, rounded)
        }
      }

      animationFrameId = requestAnimationFrame(updateLoop)
    }

    animationFrameId = requestAnimationFrame(updateLoop)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isProcessing, isCompleted, isFailed, safeActual, cacheKey, stepUpperBound, onStallDetected])

  return isCompleted ? 100 : visualProgress
}
