import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import {
  BrandWordmark, FishLogo, IconNewChatOutline16, IconPanelLeftOutline16,
  Tooltip
} from '@/components/ui'
import { WorkspaceBrowser } from '@/components/workspace/WorkspaceBrowser'
import { AddWorkspaceModal } from '@/components/layout/AddWorkspaceModal'
import { SidebarUserControl } from './SidebarUserControl'
import { useChatStore } from '@/store/useChatStore'
import css from './SidebarRoot.module.css'

export interface SidebarRootProps {
  collapsed: boolean
  width?: number
  onToggleCollapse: () => void
}

export function SidebarRoot({
  collapsed,
  width = 260,
  onToggleCollapse,
}: SidebarRootProps) {
  const { newSession, activeWorkspaceId } = useChatStore()

  const [settled, setSettled] = useState(collapsed)
  const [isAddWsOpen, setIsAddWsOpen] = useState(false)

  useEffect(() => {
    if (!collapsed) { setSettled(false); return }
    const timer = window.setTimeout(() => { setSettled(true) }, 150)
    return () => window.clearTimeout(timer)
  }, [collapsed])

  const wide = !collapsed || !settled
  const lastWideWidth = useRef(width)
  if (!collapsed) lastWideWidth.current = width

  const everWide = useRef(!collapsed)
  if (!collapsed) everWide.current = true

  return (
    <div
      className={clsx(
        css.root,
        !wide && css.collapsed,
        !wide && everWide.current && css.railIn,
        collapsed && wide && css.fading,
      )}
      style={wide ? { width: collapsed ? lastWideWidth.current : width } : undefined}
    >
      {/* 1. Logo row */}
      <div className={css.logoRow}>
        {wide && (
          <button
            type="button"
            className={clsx(css.brand, css.wide)}
            aria-label="DeepSeek Chat"
            onClick={() => newSession(activeWorkspaceId)}
          >
            <BrandWordmark />
          </button>
        )}

        <Tooltip label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'} delayMs={500}>
          <button
            type="button"
            className={clsx(css.iconButton, css.toggle)}
            aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
            onClick={onToggleCollapse}
          >
            {!wide && <FishLogo className={css.railFish} size={24} />}
            <IconPanelLeftOutline16 className={css.panelIcon} size={wide ? 16 : 18} />
          </button>
        </Tooltip>
      </div>

      {/* 2. New Session button */}
      <Tooltip label="Cuộc trò chuyện mới" delayMs={500} disabled={wide}>
        <button
          type="button"
          className={css.newSession}
          aria-label="Cuộc trò chuyện mới"
          onClick={() => newSession(activeWorkspaceId)}
        >
          <IconNewChatOutline16 size={wide ? 14 : 18} />
          {wide && <span className={clsx(css.newSessionLabel, css.wide)}>Cuộc trò chuyện mới</span>}
        </button>
      </Tooltip>

      {/* 3. Browsing Region */}
      <div className={css.regionArea}>
        <WorkspaceBrowser
          wide={wide}
          onOpenAddWorkspace={() => setIsAddWsOpen(true)}
        />
      </div>

      {/* 4. Foot Area (User Profile & Context Menu) */}
      <div className={css.footArea}>
        <SidebarUserControl wide={wide} />
      </div>

      <AddWorkspaceModal open={isAddWsOpen} onClose={() => setIsAddWsOpen(false)} />
    </div>
  )
}
