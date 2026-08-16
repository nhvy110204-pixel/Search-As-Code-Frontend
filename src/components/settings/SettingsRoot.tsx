import { useEffect, useId, useRef } from 'react'
import clsx from 'clsx'
import {
  IconSettingsOutline16, IconDataOutline16, IconAgentPresetOutline16,
  IconPersonalizationOutline16, IconCloseOutline16, Tooltip
} from '@/components/ui'
import { useSettingsStore } from '@/store/useSettingsStore'
import { AppearanceRow } from './AppearanceRow'
import { EnterBehaviorRow } from './EnterBehaviorRow'
import { GeneralSettingsTab } from './GeneralSettingsTab'
import { ModelsSection } from './ModelsSection'
import { AgentPresetSection } from './AgentPresetSection'
import { PluginsSettingsTab } from './PluginsSettingsTab'
import css from './SettingsRoot.module.css'

const SECTIONS = [
  { id: 'general', label: 'Cài đặt Chung', Icon: IconSettingsOutline16 },
  { id: 'models', label: 'Mô hình & API', Icon: IconDataOutline16 },
  { id: 'presets', label: 'Cấu hình Agent', Icon: IconAgentPresetOutline16 },
  { id: 'plugins', label: 'Công cụ & MCP', Icon: IconPersonalizationOutline16 },
] as const

export function SettingsRoot() {
  const { isSettingsOpen, activeSettingsTab, closeSettings, setTab } = useSettingsStore()
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isSettingsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isSettingsOpen, closeSettings])

  if (!isSettingsOpen) return null

  return (
    <div className={css.overlay} role="presentation">
      <div className={css.mask} onClick={closeSettings} aria-hidden="true" />

      <div className={css.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {/* Top-Right Close Button */}
        <Tooltip label="Đóng (Esc)" delayMs={300}>
          <button
            ref={closeButtonRef}
            type="button"
            className={css.close}
            onClick={closeSettings}
            aria-label="Đóng cài đặt"
          >
            <IconCloseOutline16 size={16} />
          </button>
        </Tooltip>

        {/* Left Nav Rail (188px) */}
        <nav className={css.nav}>
          <div className={css.navTitle} id={titleId}>Cài đặt</div>
          <div className={css.navList}>
            {SECTIONS.map((sec) => {
              const Icon = sec.Icon
              const isActive = activeSettingsTab === sec.id
              return (
                <button
                  key={sec.id}
                  type="button"
                  className={clsx(css.navCell, isActive && css.active)}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setTab(sec.id)}
                >
                  <Icon className={css.navIcon} size={16} />
                  <span className={css.navLabel}>{sec.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content Column */}
        <div className={css.content}>
          <div className={css.options}>
            {activeSettingsTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <AppearanceRow />
                <EnterBehaviorRow />
                <GeneralSettingsTab />
              </div>
            )}
            {activeSettingsTab === 'models' && <ModelsSection />}
            {activeSettingsTab === 'presets' && <AgentPresetSection />}
            {activeSettingsTab === 'plugins' && <PluginsSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
