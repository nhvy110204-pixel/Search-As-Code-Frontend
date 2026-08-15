import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import css from './PopupSelectView.module.css'

export interface CommandItem {
  id: string
  label: string
  detail?: string
  icon?: React.ReactNode
}

export interface PopupSelectViewProps {
  open: boolean
  query: string
  commands: CommandItem[]
  onSelect: (item: CommandItem) => void
  onClose: () => void
}

export function PopupSelectView({
  open,
  query,
  commands,
  onSelect,
  onClose,
}: PopupSelectViewProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    (c.detail && c.detail.toLowerCase().includes(query.toLowerCase()))
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filtered.length > 0) {
          e.preventDefault()
          onSelect(filtered[activeIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filtered, activeIndex, onSelect, onClose])

  if (!open || filtered.length === 0) return null

  return (
    <div ref={cardRef} className={css.card} role="listbox">
      <div className={css.viewport}>
        {filtered.map((item, idx) => {
          const isActive = idx === activeIndex
          return (
            <div
              key={item.id}
              className={clsx(css.row, isActive && css.rowActive)}
              role="option"
              aria-selected={isActive}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {item.icon && <span style={{ flex: 'none', display: 'flex' }}>{item.icon}</span>}
              <span className={css.label}>{item.label}</span>
              {item.detail && <span className={css.detail}>{item.detail}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
