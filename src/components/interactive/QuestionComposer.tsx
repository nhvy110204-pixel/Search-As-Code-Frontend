import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import css from './QuestionComposer.module.css'

export interface QuestionOption {
  id: string
  label: string
  recommended?: boolean
}

export interface QuestionComposerProps {
  question: string
  options: QuestionOption[]
  onSubmit: (selectedId: string) => void
  onCancel?: () => void
}

export function QuestionComposer({ question, options, onSubmit, onCancel }: QuestionComposerProps) {
  const [selected, setSelected] = useState<string>(options[0]?.id || '')

  return (
    <div className={css.card}>
      <div className={css.question}>{question}</div>
      <div className={css.options}>
        {options.map((opt) => (
          <div
            key={opt.id}
            className={css.option}
            data-selected={selected === opt.id}
            onClick={() => setSelected(opt.id)}
            role="radio"
            aria-checked={selected === opt.id}
          >
            <input
              type="radio"
              name="user-question-option"
              checked={selected === opt.id}
              onChange={() => setSelected(opt.id)}
            />
            <span>{opt.label}</span>
            {opt.recommended && (
              <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 'auto' }}>(Khuyên dùng)</span>
            )}
          </div>
        ))}
      </div>
      <div className={css.footer}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Bỏ qua
          </Button>
        )}
        <Button variant="primary" onClick={() => onSubmit(selected)}>
          Xác nhận lựa chọn
        </Button>
      </div>
    </div>
  )
}
