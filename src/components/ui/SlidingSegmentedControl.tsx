import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useThemeStore } from '@/store/useThemeStore'

export interface SegmentOption<T extends string = string> {
  id: T
  label: ReactNode
  icon?: ReactNode
  ariaLabel?: string
}

export interface SlidingSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  isCircle?: boolean
  className?: string
}

export function SlidingSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  isCircle = false,
  className,
}: SlidingSegmentedControlProps<T>) {
  const { isDark } = useThemeStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map())

  const [glider, setGlider] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  })

  // Measure active button position & width whenever value changes or on mount
  useLayoutEffect(() => {
    const updateGlider = () => {
      const activeBtn = buttonRefs.current.get(value)
      if (!activeBtn || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const btnRect = activeBtn.getBoundingClientRect()

      setGlider({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
        ready: true,
      })
    }

    updateGlider()

    // Handle window resize
    window.addEventListener('resize', updateGlider)
    return () => window.removeEventListener('resize', updateGlider)
  }, [value, options])

  const trackBg = isDark ? '#2c2c2e' : '#EEEEEE'
  const activeBg = isDark ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF'
  const shadow = isDark
    ? '0 2px 6px rgba(0, 0, 0, 0.3)'
    : '0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)'

  return (
    <div
      ref={containerRef}
      className={className}
      role="radiogroup"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        background: trackBg,
        padding: 3,
        borderRadius: 999,
        gap: 2,
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* Sliding Glider Indicator */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 3,
          bottom: 3,
          left: 0,
          width: glider.width,
          transform: `translate3d(${glider.left}px, 0, 0)`,
          borderRadius: 999,
          background: activeBg,
          boxShadow: shadow,
          opacity: glider.ready ? 1 : 0,
          transition: glider.ready
            ? 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), width 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease'
            : 'none',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Buttons */}
      {options.map((opt) => {
        const isActive = value === opt.id
        return (
          <button
            key={opt.id}
            ref={(el) => {
              if (el) buttonRefs.current.set(opt.id, el)
              else buttonRefs.current.delete(opt.id)
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.ariaLabel || (typeof opt.label === 'string' ? opt.label : undefined)}
            onClick={() => onChange(opt.id)}
            style={{
              position: 'relative',
              zIndex: 2,
              border: 'none',
              borderRadius: 999,
              background: 'transparent',
              color: isActive ? '#0878F9' : (isDark ? '#aaaaaa' : '#666666'),
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              outline: 'none',
              transition: 'color 160ms ease, transform 100ms ease',
              ...(isCircle
                ? {
                    width: 32,
                    height: 32,
                    padding: 0,
                  }
                : {
                    padding: '4px 14px',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                  }),
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {opt.icon}
            {opt.label && (!isCircle || !opt.icon) && <span>{opt.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
