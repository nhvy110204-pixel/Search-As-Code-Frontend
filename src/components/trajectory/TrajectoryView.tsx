import {
  IconCodeOutline16, IconBrowseOutline16, IconSearchOutline16,
  IconGlobeOutline14, IconCheckOutline16, IconLoadingOutline16
} from '@/components/ui'
import type { ChatSession } from '@/types/chat'
import css from './TrajectoryView.module.css'

export interface TrajectoryViewProps {
  session?: ChatSession
}

export function TrajectoryView({ session }: TrajectoryViewProps) {
  const messages = session?.messages || []
  const steps = messages.flatMap((m) => m.steps || [])

  if (steps.length === 0) {
    return (
      <div className={css.root}>
        <div className={css.empty}>
          Chưa có tiến trình công cụ (Trajectory) nào được ghi nhận trong phiên này.
        </div>
      </div>
    )
  }

  return (
    <div className={css.root}>
      <div className={css.timelineCard}>
        <div className={css.timelineHeader}>
          <span>Lịch sử tiến trình thực thi (Trajectory Timeline)</span>
          <span style={{ fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' }}>
            {steps.length} bước thực hiện
          </span>
        </div>

        <div>
          {steps.map((step, idx) => {
            let Icon = IconCodeOutline16
            if (step.type === 'diff') Icon = IconBrowseOutline16
            if (step.type === 'search') Icon = IconSearchOutline16
            if (step.type === 'web') Icon = IconGlobeOutline14

            return (
              <div key={step.id || idx} className={css.stepItem}>
                <div className={css.stepIcon}>
                  <Icon size={14} />
                </div>
                <div className={css.stepContent}>
                  <div className={css.stepTitle}>{step.title}</div>
                  {step.output && (
                    <div className={css.stepOutput}>
                      {step.output.slice(0, 160)}
                      {step.output.length > 160 ? '...' : ''}
                    </div>
                  )}
                </div>
                <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--dsw-alias-state-success-primary)' }}>
                  {step.status === 'running' ? (
                    <IconLoadingOutline16 size={14} className="spin" />
                  ) : (
                    <IconCheckOutline16 size={14} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
