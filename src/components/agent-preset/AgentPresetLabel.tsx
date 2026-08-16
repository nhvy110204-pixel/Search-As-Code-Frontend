import { Tooltip } from '@/components/ui'
import css from './AgentPresetLabel.module.css'

export interface AgentPresetLabelProps {
  presetName?: string
}

export function AgentPresetLabel({
  presetName = 'Standard mode',
}: AgentPresetLabelProps) {
  return (
    <Tooltip label={`Active mode: ${presetName}`} delayMs={300}>
      <span className={css.label}>
        <span>{presetName}</span>
      </span>
    </Tooltip>
  )
}
