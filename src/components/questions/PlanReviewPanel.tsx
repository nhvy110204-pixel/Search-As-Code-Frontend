import { useState } from 'react'
import { Button } from '@/components/ui'
import { AssistantMarkdown } from '@/components/chat/AssistantMarkdown'
import css from './PlanReviewPanel.module.css'

export interface PlanReviewPanelProps {
  planContent: string
  onApprove: () => void
  onReject: () => void
}

export function PlanReviewPanel({
  planContent,
  onApprove,
  onReject,
}: PlanReviewPanelProps) {
  const [answered, setAnswered] = useState(false)

  const handleApprove = () => {
    setAnswered(true)
    onApprove()
  }

  const handleReject = () => {
    setAnswered(true)
    onReject()
  }

  return (
    <div className={css.frame}>
      <div className={css.card}>
        <div className={css.strip}>
          <span className={css.dot} />
          <span>Đang đợi xem xét và duyệt kế hoạch (Plan Review)</span>
        </div>

        <div className={css.body}>
          <AssistantMarkdown content={planContent} />
        </div>

        <div className={css.footer}>
          <div />
          <div className={css.actions}>
            <Button
              variant="outline"
              disabled={answered}
              onClick={handleReject}
            >
              Từ chối kế hoạch
            </Button>
            <Button
              variant="primary"
              disabled={answered}
              onClick={handleApprove}
            >
              Phê duyệt kế hoạch
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
