import { useEffect, useId } from 'react'
import { Settings, Cpu, UserCheck, Blocks, X } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { GeneralSettingsTab } from './GeneralSettingsTab'
import { ModelSettingsTab } from './ModelSettingsTab'
import { PresetsSettingsTab } from './PresetsSettingsTab'
import { PluginsSettingsTab } from './PluginsSettingsTab'
import css from './SettingsModal.module.css'

const NAV_ITEMS = [
  { id: 'general', label: 'Cài đặt Chung', icon: Settings },
  { id: 'models', label: 'Mô hình & API', icon: Cpu },
  { id: 'presets', label: 'Vai trò & Persona', icon: UserCheck },
  { id: 'plugins', label: 'Công cụ & MCP', icon: Blocks },
] as const

export function SettingsModal() {
  const { isSettingsOpen, activeSettingsTab, closeSettings, setTab } = useSettingsStore()
  const titleId = useId()

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
      <div className={css.mask} onClick={closeSettings} />

      <div className={css.panel} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {/* Left Nav Rail */}
        <nav className={css.nav}>
          <div className={css.navTitle} id={titleId}>Cài đặt Hệ thống</div>
          <div className={css.navList}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSettingsTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={css.navCell}
                  data-active={isActive}
                  onClick={() => setTab(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* Main Content Pane */}
        <main className={css.main}>
          <div className={css.mainHeader}>
            <h2 className={css.sectionTitle}>
              {NAV_ITEMS.find((n) => n.id === activeSettingsTab)?.label}
            </h2>
            <button
              type="button"
              className={css.closeButton}
              onClick={closeSettings}
              aria-label="Đóng cài đặt"
            >
              <X size={18} />
            </button>
          </div>

          {activeSettingsTab === 'general' && <GeneralSettingsTab />}
          {activeSettingsTab === 'models' && <ModelSettingsTab />}
          {activeSettingsTab === 'presets' && <PresetsSettingsTab />}
          {activeSettingsTab === 'plugins' && <PluginsSettingsTab />}
        </main>
      </div>
    </div>
  )
}
