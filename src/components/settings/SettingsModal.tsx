import { useEffect } from 'react'
import clsx from 'clsx'
import {
  IconSettingsOutline16,
  IconDataOutline16,
  IconAgentPresetOutline16,
  IconPersonalizationOutline16,
  IconCloseOutline16,
  IconLogoutOutline16,
} from '@/components/ui'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { GeneralTab } from './tabs/GeneralTab'
import { ModelsTab } from './tabs/ModelsTab'
import { PresetsTab } from './tabs/PresetsTab'
import { ToolsTab } from './tabs/ToolsTab'
import css from './SettingsModal.module.css'

interface TabDef {
  id: string
  label: string
  icon: React.ReactNode
}

const TABS: TabDef[] = [
  { id: 'general', label: 'Chung & Giao diện', icon: <IconSettingsOutline16 size={16} /> },
  { id: 'models', label: 'Mô hình & API', icon: <IconDataOutline16 size={16} /> },
  { id: 'presets', label: 'Chế độ Agent', icon: <IconAgentPresetOutline16 size={16} /> },
  { id: 'tools', label: 'Công cụ & Tích hợp', icon: <IconPersonalizationOutline16 size={16} /> },
]

export function SettingsModal() {
  const {
    isSettingsOpen,
    activeSettingsTab,
    closeSettings,
    setSettingsTab,
  } = useSettingsStore()

  const { logout, isAuthenticated } = useAuthStore()

  // Close on Escape key
  useEffect(() => {
    if (!isSettingsOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSettingsOpen, closeSettings])

  if (!isSettingsOpen) return null

  const currentTab = TABS.find((t) => t.id === activeSettingsTab) || TABS[0]

  return (
    <div className={css.overlay} role="presentation">
      {/* Backdrop */}
      <div className={css.mask} onClick={closeSettings} aria-hidden="true" />

      {/* Main Settings Modal */}
      <div
        className={css.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Cài đặt hệ thống"
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          className={css.modalClose}
          onClick={closeSettings}
          aria-label="Đóng cài đặt"
        >
          <IconCloseOutline16 size={15} />
        </button>

        {/* Left Sidebar (240px) */}
        <aside className={css.sidebar}>
          <div className={css.sidebarHeader}>
            <h2 className={css.sidebarTitle}>Cài đặt</h2>
          </div>

          <nav className={css.navList}>
            {TABS.map((tab) => {
              const isActive = activeSettingsTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={clsx(css.navItem, isActive && css.active)}
                  onClick={() => setSettingsTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={css.navIcon}>{tab.icon}</span>
                  <span className={css.navLabel}>{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Sidebar Footer with Logout */}
          <div className={css.sidebarFooter}>
            {isAuthenticated && (
              <button
                type="button"
                className={css.logoutBtn}
                onClick={() => {
                  closeSettings()
                  logout()
                }}
              >
                <span className={css.logoutIcon}>
                  <IconLogoutOutline16 size={16} />
                </span>
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <main className={css.content}>
          <div className={css.contentHeader}>
            <h3 className={css.contentTitle}>{currentTab.label}</h3>
          </div>

          <div key={activeSettingsTab} className={css.tabContent}>
            {activeSettingsTab === 'general' && <GeneralTab />}
            {activeSettingsTab === 'models' && <ModelsTab />}
            {activeSettingsTab === 'presets' && <PresetsTab />}
            {activeSettingsTab === 'tools' && <ToolsTab />}
          </div>
        </main>
      </div>
    </div>
  )
}
