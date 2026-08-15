import { useState, useRef, useEffect, type KeyboardEvent, type FocusEvent } from 'react'
import clsx from 'clsx'
import {
  IconCheckOutline16,
  IconChevronDownOutline14,
  IconChevronRightOutline14,
} from '@/components/ui'
import type { ModelOption } from '@/types/chat'
import css from './ModelSelect.module.css'

type Pane = 'root' | 'model' | 'effort'

export interface EffortLevel {
  id: string
  name: string
  description?: string
}

export const EFFORT_LEVELS: EffortLevel[] = [
  { id: 'low', name: 'Thấp (Low)', description: 'Tối ưu tốc độ, suy nghĩ ngắn gọn cho câu hỏi đơn giản' },
  { id: 'medium', name: 'Trung bình (Medium)', description: 'Cân bằng giữa tốc độ phản hồi và độ sâu lập luận' },
  { id: 'high', name: 'Cao (High)', description: 'Suy nghĩ tối đa, phân tích sâu và lập luận logic toàn diện' },
]

export interface ModelSelectProps {
  models: ModelOption[]
  selectedModelId: string
  selectedEffort?: string
  locked?: boolean
  onSelect: (modelId: string, effort?: string) => void
}

export function ModelSelect({
  models,
  selectedModelId,
  selectedEffort = 'high',
  locked = false,
  onSelect,
}: ModelSelectProps) {
  const [open, setOpen] = useState(false)
  const [pane, setPane] = useState<Pane>('root')
  const [effort, setEffort] = useState<string>(selectedEffort)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0]
  const currentEffortObj = EFFORT_LEVELS.find((e) => e.id === effort) || EFFORT_LEVELS[2]

  const hasReasoning = currentModel?.reasoningEnabled !== false

  const modelLabel = currentModel?.name || 'DeepSeek-V3'
  const effortLabel = hasReasoning ? currentEffortObj.name.split(' ')[0] : undefined

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setPane('root')
      }
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [open])

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      if (pane !== 'root') setPane('root')
      else {
        setOpen(false)
        setPane('root')
      }
    }
  }

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && rootRef.current?.contains(event.relatedTarget)) return
    setOpen(false)
    setPane('root')
  }

  const chooseModel = (id: string) => {
    onSelect(id, effort)
    setOpen(false)
    setPane('root')
  }

  const chooseEffort = (effortId: string) => {
    setEffort(effortId)
    onSelect(selectedModelId, effortId)
    setOpen(false)
    setPane('root')
  }

  // Model provider groupings
  const deepseekModels = models.filter((m) => m.provider === 'deepseek' || m.id.includes('deepseek'))
  const otherModels = models.filter((m) => m.provider !== 'deepseek' && !m.id.includes('deepseek'))

  return (
    <div ref={rootRef} className={css.root} onKeyDown={onRootKeyDown} onBlur={onBlur}>
      {/* Trigger Button (Figma 313:14108) */}
      <button
        ref={triggerRef}
        type="button"
        className={css.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={locked}
        title={effortLabel ? `${modelLabel} · ${effortLabel}` : modelLabel}
        onClick={() => {
          if (open) {
            setOpen(false)
            setPane('root')
          } else {
            setPane('root')
            setOpen(true)
          }
        }}
      >
        <span className={css.triggerLabel}>{modelLabel}</span>
        {effortLabel && <span className={css.triggerEffort}>· {effortLabel}</span>}
        <IconChevronDownOutline14 className={clsx(css.chevron, open && css.chevronOpen)} />
      </button>

      {/* Two-Level Menu Dropdown (Figma 496:26454) */}
      {open && (
        <div className={css.menu} role="menu">
          {/* Level 1: Root Menu */}
          {pane === 'root' && (
            <>
              <button
                type="button"
                role="menuitem"
                className={css.cell}
                onClick={() => setPane('model')}
              >
                <span className={css.cellLabel}>Mô hình (Model)</span>
                <span className={css.cellValue}>{modelLabel}</span>
                <IconChevronRightOutline14 className={css.cellChevron} />
              </button>

              {hasReasoning && (
                <button
                  type="button"
                  role="menuitem"
                  className={css.cell}
                  onClick={() => setPane('effort')}
                >
                  <span className={css.cellLabel}>Mức độ suy nghĩ (Effort)</span>
                  <span className={css.cellValue}>{currentEffortObj.name}</span>
                  <IconChevronRightOutline14 className={css.cellChevron} />
                </button>
              )}
            </>
          )}

          {/* Level 2: Model Selection Pane */}
          {pane === 'model' && (
            <div className={css.groups}>
              {deepseekModels.length > 0 && (
                <section className={css.group}>
                  <div className={css.groupTitle}>DeepSeek AI Models</div>
                  {deepseekModels.map((m) => {
                    const isSelected = m.id === selectedModelId
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        className={clsx(css.option, isSelected && css.selected)}
                        onClick={() => chooseModel(m.id)}
                      >
                        <span className={css.optionCopy}>
                          <span className={css.modelName}>{m.name}</span>
                          {m.description && <span className={css.description}>{m.description}</span>}
                        </span>
                        <span className={css.check}>
                          {isSelected && <IconCheckOutline16 />}
                        </span>
                      </button>
                    )
                  })}
                </section>
              )}

              {otherModels.length > 0 && (
                <section className={css.group}>
                  <div className={css.groupTitle}>Mô hình khác</div>
                  {otherModels.map((m) => {
                    const isSelected = m.id === selectedModelId
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        className={clsx(css.option, isSelected && css.selected)}
                        onClick={() => chooseModel(m.id)}
                      >
                        <span className={css.optionCopy}>
                          <span className={css.modelName}>{m.name}</span>
                          {m.description && <span className={css.description}>{m.description}</span>}
                        </span>
                        <span className={css.check}>
                          {isSelected && <IconCheckOutline16 />}
                        </span>
                      </button>
                    )
                  })}
                </section>
              )}
            </div>
          )}

          {/* Level 2: Effort Selection Pane */}
          {pane === 'effort' && (
            <div className={css.groups}>
              <section className={css.group}>
                <div className={css.groupTitle}>Reasoning Effort</div>
                {EFFORT_LEVELS.map((lvl) => {
                  const isSelected = lvl.id === effort
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      className={clsx(css.option, isSelected && css.selected)}
                      onClick={() => chooseEffort(lvl.id)}
                    >
                      <span className={css.optionCopy}>
                        <span className={css.modelName}>{lvl.name}</span>
                        {lvl.description && <span className={css.description}>{lvl.description}</span>}
                      </span>
                      <span className={css.check}>
                        {isSelected && <IconCheckOutline16 />}
                      </span>
                    </button>
                  )
                })}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
