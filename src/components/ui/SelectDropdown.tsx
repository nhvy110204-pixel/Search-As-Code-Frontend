import { useState, useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { IconCheckOutline16, IconChevronDownOutline14 } from '@/components/ui/icons'
import css from './SelectDropdown.module.css'

export interface SelectOption {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
}

export interface SelectDropdownProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  variant?: 'pill' | 'form'
  placement?: 'top' | 'top-end' | 'bottom' | 'bottom-end'
  className?: string
  menuClassName?: string
  fullWidth?: boolean
  title?: string
  icon?: ReactNode
}

export function SelectDropdown({
  value,
  options,
  onChange,
  placeholder = 'Chọn một tùy chọn...',
  disabled = false,
  variant = 'pill',
  placement = 'bottom',
  className,
  menuClassName,
  fullWidth = false,
  title,
  icon,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
  }

  const placementClass = {
    'top': css.placementTop,
    'top-end': css.placementTopEnd,
    'bottom': css.placementBottom,
    'bottom-end': css.placementBottomEnd,
  }[placement]

  const isForm = variant === 'form'

  return (
    <div
      ref={rootRef}
      className={clsx(css.root, (fullWidth || isForm) && css.rootFull, className)}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={clsx(isForm ? css.triggerForm : css.triggerPill)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        title={title || displayLabel}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
          {icon || selectedOption?.icon}
          <span className={css.triggerLabel}>{displayLabel}</span>
        </div>
        <IconChevronDownOutline14 className={clsx(css.chevron, open && css.chevronOpen)} />
      </button>

      {open && (
        <div
          role="listbox"
          className={clsx(
            css.menu,
            placementClass,
            isForm && css.menuFullWidth,
            menuClassName
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                className={clsx(css.option, isSelected && css.optionSelected)}
                onClick={() => handleSelect(opt.value)}
              >
                <span className={css.optionCopy}>
                  <span className={css.optionLabel}>{opt.label}</span>
                  {opt.description && <span className={css.optionDesc}>{opt.description}</span>}
                </span>
                <span className={css.check}>
                  {isSelected && <IconCheckOutline16 />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
