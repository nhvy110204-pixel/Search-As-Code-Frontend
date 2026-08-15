import { type ChangeEvent, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './Switch.module.css'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  className?: string
  id?: string
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  id,
}: SwitchProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    onChange(e.target.checked)
  }

  return (
    <label
      htmlFor={id}
      className={clsx(css.root, disabled && css.rootDisabled, className)}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className={css.nativeInput}
      />
      <div className={clsx(css.pill, checked && css.pillChecked)}>
        <div className={css.knob} />
      </div>

      {(label || description) && (
        <div className={css.content}>
          {label && <span className={css.label}>{label}</span>}
          {description && <span className={css.description}>{description}</span>}
        </div>
      )}
    </label>
  )
}
