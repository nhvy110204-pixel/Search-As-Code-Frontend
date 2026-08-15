import { useState } from 'react'
import clsx from 'clsx'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import css from './QuestionComposer.module.css'

export interface QuestionOption {
  label: string
  description?: string
  recommended?: boolean
}

export interface QuestionItem {
  id: string
  question: string
  options?: QuestionOption[]
  isMultiSelect?: boolean
}

export interface QuestionComposerProps {
  questions: QuestionItem[]
  onSubmit: (answers: Record<string, string | string[]>) => void
  onSkip?: () => void
}

export function QuestionComposer({
  questions,
  onSubmit,
  onSkip,
}: QuestionComposerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [customDraft, setCustomDraft] = useState('')

  const currentQ = questions[currentIndex]
  if (!currentQ) return null

  const isMulti = !!currentQ.isMultiSelect
  const currentAnswer = answers[currentQ.id] || (isMulti ? [] : '')

  const handleSelectOption = (label: string) => {
    if (isMulti) {
      const arr = Array.isArray(currentAnswer) ? [...currentAnswer] : []
      const idx = arr.indexOf(label)
      if (idx >= 0) arr.splice(idx, 1)
      else arr.push(label)
      setAnswers((prev) => ({ ...prev, [currentQ.id]: arr }))
    } else {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: label }))
      setCustomDraft('')
    }
  }

  const handleCustomChange = (text: string) => {
    setCustomDraft(text)
    if (!isMulti) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: text }))
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setCustomDraft('')
    } else {
      onSubmit(answers)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setCustomDraft('')
    }
  }

  return (
    <div className={css.frame}>
      <div className={css.card}>
        <div className={css.header}>
          <div className={css.headingBlock}>
            <div className={css.eyebrow}>CÂU HỎI TỪ ASSISTANT</div>
            <h3 className={css.title}>{currentQ.question}</h3>
          </div>

          {questions.length > 1 && (
            <div className={css.pager}>
              <button
                type="button"
                className={css.iconButton}
                disabled={currentIndex === 0}
                onClick={handlePrev}
                aria-label="Câu trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className={css.progress}>
                {currentIndex + 1} / {questions.length}
              </span>
              <button
                type="button"
                className={css.iconButton}
                disabled={currentIndex === questions.length - 1}
                onClick={handleNext}
                aria-label="Câu tiếp theo"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className={css.body}>
          <div className={css.options}>
            {currentQ.options?.map((opt, idx) => {
              const isSelected = isMulti
                ? Array.isArray(currentAnswer) && currentAnswer.includes(opt.label)
                : currentAnswer === opt.label

              return (
                <button
                  key={opt.label}
                  type="button"
                  className={clsx(css.option, isSelected && css.optionSelected)}
                  onClick={() => handleSelectOption(opt.label)}
                >
                  {isMulti ? (
                    <div className={clsx(css.checkbox, isSelected && css.checkboxChecked)}>
                      {isSelected && <Check size={10} />}
                    </div>
                  ) : (
                    <div className={css.number}>{idx + 1}</div>
                  )}

                  <div className={css.optionCopy}>
                    <div className={css.optionLine}>
                      <span className={css.optionLabel}>{opt.label}</span>
                      {opt.recommended && <span className={css.badge}>Gợi ý</span>}
                    </div>
                    {opt.description && (
                      <div className={css.description}>{opt.description}</div>
                    )}
                  </div>
                </button>
              )
            })}

            {/* Custom Write-in Row */}
            <div className={clsx(css.customRow, customDraft && css.customRowActive)}>
              <div className={css.number}>✍️</div>
              <input
                className={css.customInput}
                placeholder="Hoặc nhập câu trả lời khác của bạn..."
                value={customDraft}
                onChange={(e) => handleCustomChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={css.footer}>
          <div>
            {onSkip && (
              <Button variant="outline" onClick={onSkip}>
                Bỏ qua (Skip)
              </Button>
            )}
          </div>

          <div className={css.footerActions}>
            <Button
              variant="primary"
              onClick={handleNext}
            >
              {currentIndex === questions.length - 1 ? 'Gửi câu trả lời' : 'Tiếp theo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
