import { useState } from 'react'
import { Button } from '@/components/ui'
import css from './ApprovalPanel.module.css'

export interface ApprovalPanelProps {
  reason: string
  command?: string
  toolName?: string
  onAllow: () => void
  onReject: () => void
}

export function ApprovalPanel({
  reason,
  command,
  toolName = 'Bash / Terminal',
  onAllow,
  onReject,
}: ApprovalPanelProps) {
  const [answered, setAnswered] = useState(false)

  const handleAllow = () => {
    setAnswered(true)
    onAllow()
  }

  const handleReject = () => {
    setAnswered(true)
    onReject()
  }

  return (
    <div className={css.root}>
      <div className={css.card}>
        <div className={css.strip}>
          <span className={css.dot} />
          <span>Yêu cầu phê duyệt hành động ({toolName})</span>
        </div>

        <div className={css.body}>
          <div className={css.headline}>{reason}</div>
          {command && <div className={css.command}>{command}</div>}
        </div>

        <div className={css.actionRow}>
          <Button
            variant="outline"
            className={css.reject}
            disabled={answered}
            onClick={handleReject}
          >
            Từ chối (Reject)
          </Button>
          <Button
            variant="primary"
            disabled={answered}
            onClick={handleAllow}
          >
            Cho phép một lần (Allow Once)
          </Button>
        </div>
      </div>
    </div>
  )
}
