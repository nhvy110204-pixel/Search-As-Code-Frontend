import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Sparkles, Check } from 'lucide-react'
import type { ModelOption } from '@/types/chat'
import css from './ModelSelect.module.css'

export interface ModelSelectProps {
  models: ModelOption[]
  selectedModelId: string
  onSelect: (modelId: string) => void
}

export function ModelSelect({ models, selectedModelId, onSelect }: ModelSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={css.root} ref={ref}>
      <button
        type="button"
        className={css.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <Sparkles size={14} style={{ color: 'var(--dsw-alias-brand-primary-new-colorprimary-new-color)' }} />
        <span>{currentModel?.name || 'Chọn mô hình'}</span>
        <ChevronDown size={14} style={{ color: 'var(--dsw-alias-label-tertiary)' }} />
      </button>

      {open && (
        <div className={css.dropdown}>
          {models.map((model) => {
            const isSelected = model.id === selectedModelId
            return (
              <button
                key={model.id}
                type="button"
                className={css.option}
                data-active={isSelected}
                onClick={() => {
                  onSelect(model.id)
                  setOpen(false)
                }}
              >
                <div className={css.optionHeader}>
                  <span className={css.optionName}>{model.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {model.reasoningEnabled && <span className={css.reasoningBadge}>CoT Thinking</span>}
                    {isSelected && <Check size={14} style={{ color: 'var(--dsw-alias-brand-primary-new-colorprimary-new-color)' }} />}
                  </div>
                </div>
                {model.description && <span className={css.optionDesc}>{model.description}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
