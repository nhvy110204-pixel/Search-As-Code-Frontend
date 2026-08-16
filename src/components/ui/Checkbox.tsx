import { type ChangeEvent, type ReactNode } from 'react'
import clsx from 'clsx'
import { IconCheckOutline14 } from './icons'
import css from './Checkbox.module.css'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  className?: string
  id?: string
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  id,
}: CheckboxProps) {
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
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className={css.nativeInput}
      />
      <div className={clsx(css.box, checked && css.boxChecked)}>
        {checked && <IconCheckOutline14 size={12} className={css.icon} />}
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
