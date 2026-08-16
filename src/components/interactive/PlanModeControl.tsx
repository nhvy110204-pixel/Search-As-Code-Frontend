import { IconListPenOutline16 } from '@/components/ui'
import css from './PlanModeControl.module.css'

export interface PlanModeControlProps {
  isPlanMode: boolean
  onToggle: () => void
}

export function PlanModeControl({ isPlanMode, onToggle }: PlanModeControlProps) {
  return (
    <div
      className={css.root}
      data-active={isPlanMode}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-label="Chế độ lập kế hoạch"
    >
      <IconListPenOutline16 size={15} />
      <span>Plan Mode</span>
      <div className={css.toggle}>
        <div className={css.knob} />
      </div>
    </div>
  )
}
