import { useMemo, type ChangeEvent } from 'react'
import clsx from 'clsx'
import css from './Slider.module.css'

export interface SliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
  showMinMax?: boolean
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled = false,
  className,
  showMinMax = false,
}: SliderProps) {
  const percentage = useMemo(() => {
    const clamped = Math.max(min, Math.min(max, value))
    return ((clamped - min) / (max - min)) * 100
  }, [min, max, value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value))
  }

  return (
    <div className={clsx(css.root, className)}>
      <div className={css.trackContainer}>
        <div className={css.track}>
          <div className={css.trackFill} style={{ width: `${percentage}%` }} />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          className={css.nativeInput}
        />

        <div className={css.thumb} style={{ left: `${percentage}%` }} />
      </div>

      {showMinMax && (
        <div className={css.labels}>
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}
