import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import css from './MessageFeedbackActions.module.css'

export interface MessageFeedbackActionsProps {
  feedback?: 'like' | 'dislike' | null
  onFeedback: (val: 'like' | 'dislike' | null) => void
}

export function MessageFeedbackActions({ feedback, onFeedback }: MessageFeedbackActionsProps) {
  return (
    <div className={css.root}>
      <Tooltip label="Hài lòng với câu trả lời">
        <button
          type="button"
          className={css.button}
          data-active={feedback === 'like'}
          onClick={() => onFeedback(feedback === 'like' ? null : 'like')}
          aria-label="Thích"
        >
          <ThumbsUp size={14} />
        </button>
      </Tooltip>
      <Tooltip label="Chưa hài lòng">
        <button
          type="button"
          className={css.button}
          data-active={feedback === 'dislike'}
          onClick={() => onFeedback(feedback === 'dislike' ? null : 'dislike')}
          aria-label="Không thích"
        >
          <ThumbsDown size={14} />
        </button>
      </Tooltip>
    </div>
  )
}
