import css from './AgentPresetLabel.module.css'

export interface AgentPresetLabelProps {
  presetName?: string
}

export function AgentPresetLabel({
  presetName = 'Standard mode',
}: AgentPresetLabelProps) {
  return (
    <span className={css.label} title={`Active mode: ${presetName}`}>
      <span>{presetName}</span>
    </span>
  )
}
