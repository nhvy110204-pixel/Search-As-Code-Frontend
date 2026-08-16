import { ModelSelect } from '@/components/interactive/ModelSelect'
import { PlanModeControl } from '@/components/interactive/PlanModeControl'
import {
  StateDot, Tooltip, IconRefreshOutline16, IconSettingsOutline16, IconFolderClose16
} from '@/components/ui'
import { useChatStore } from '@/store/useChatStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import css from './Header.module.css'

export function Header() {
  const {
    availableModels,
    selectedModelId,
    setSelectedModel,
    isPlanMode,
    togglePlanMode,
    activeWorkspaceId,
    workspaces,
    activeSessionId,
    sessions,
    newSession,
  } = useChatStore()

  const { openSettings } = useSettingsStore()

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId)
  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const hasMessages = (activeSession?.messages.length || 0) > 0

  return (
    <header className={css.root}>
      <div className={css.left}>
        <ModelSelect
          models={availableModels}
          selectedModelId={selectedModelId}
          onSelect={setSelectedModel}
        />

        {activeWs && (
          <div className={css.wsBadge}>
            <IconFolderClose16 size={12} />
            <span>{activeWs.name}</span>
          </div>
        )}
      </div>

      <div className={css.right}>
        <PlanModeControl
          isPlanMode={isPlanMode}
          onToggle={togglePlanMode}
        />

        {hasMessages && (
          <Tooltip label="Bắt đầu phiên mới (Làm mới)" delayMs={300}>
            <button
              type="button"
              className={css.iconBtn}
              onClick={() => newSession(activeWorkspaceId)}
              aria-label="Làm mới hội thoại"
            >
              <IconRefreshOutline16 size={16} />
            </button>
          </Tooltip>
        )}

        <Tooltip label="Cài đặt hệ thống" delayMs={300}>
          <button
            type="button"
            className={css.iconBtn}
            onClick={() => openSettings('general')}
            aria-label="Cài đặt"
          >
            <IconSettingsOutline16 size={16} />
          </button>
        </Tooltip>

        <div style={{ marginLeft: 4 }}>
          <Tooltip label="Trạng thái: Đã kết nối">
            <StateDot state="done" size={8} />
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
