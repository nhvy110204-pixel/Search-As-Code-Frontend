import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import {
  BrandWordmark, FishLogo, IconNewChatOutline16, IconPanelLeftOutline16,
  IconFolderClose16, IconFolderOpen16, Tooltip
} from '@/components/ui'
import { WorkspaceBrowser } from '@/components/workspace/WorkspaceBrowser'
import { SidebarUserControl } from './SidebarUserControl'
import { useChatStore } from '@/store/useChatStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useViewStore } from '@/store/useViewStore'
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
  const { newSession } = useChatStore()
  const { getActiveProject, fetchProjects } = useProjectStore()
  const { currentView, navigateToProjects, navigateToChat } = useViewStore()

  const [settled, setSettled] = useState(collapsed)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

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

  const activeProject = getActiveProject()

  const handleNewChat = () => {
    newSession(activeProject?.id)
    navigateToChat()
  }

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
            aria-label="RAGFlash AI"
            onClick={handleNewChat}
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

      {/* 2. New Chat Action */}
      <Tooltip label="Đoạn chat mới" delayMs={500} disabled={wide}>
        <button
          type="button"
          className={css.navItem}
          aria-label="Đoạn chat mới"
          onClick={handleNewChat}
        >
          <span className={css.navIconSlot}>
            <IconNewChatOutline16 size={18} />
          </span>
          {wide && <span className={css.navLabel}>Đoạn chat mới</span>}
        </button>
      </Tooltip>

      {/* 3. Projects Navigation Button */}
      <Tooltip label="Dự án" delayMs={500} disabled={wide}>
        <button
          type="button"
          className={clsx(css.navItem, currentView === 'projects' && css.navItemActive)}
          aria-label="Dự án"
          onClick={() => navigateToProjects()}
        >
          <span className={clsx(css.navIconSlot, css.folderSwap)}>
            <IconFolderClose16 size={18} className={css.iconClosed} />
            <IconFolderOpen16 size={18} className={css.iconOpen} />
          </span>
          {wide && <span className={css.navLabel}>Dự án</span>}
        </button>
      </Tooltip>

      {/* 4. Recent Chat Sessions Area */}
      <div className={css.regionArea}>
        <WorkspaceBrowser wide={wide} />
      </div>

      {/* 5. Foot Area (User Profile & Context Menu) */}
      <div className={css.footArea}>
        <SidebarUserControl wide={wide} />
      </div>
    </div>
  )
}
