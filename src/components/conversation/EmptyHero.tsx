import { useState, useRef } from 'react'
import {
  IconChevronDownOutline14, FishLogo, Menu,
  IconFolderClose16, IconFolderOpen16, IconSettingsOutline14, IconBrowseOutline16,
  IconSendOutline16, IconCodeOutline16, IconSparkle16, IconAgentPresetOutline16,
  IconThinkOutline16, IconChecklistOutline14,
} from '@/components/ui'
import type { MenuEntry } from '@/components/ui/Menu'
import { useProjectStore } from '@/store/useProjectStore'
import { useViewStore } from '@/store/useViewStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useAuthStore } from '@/store/useAuthStore'
import css from './HeroShell.module.css'

export interface EmptyHeroProps {
  onOpenWorkspacePicker?: () => void
}

function getPresetIcon(iconName?: string, size = 14) {
  switch (iconName) {
    case 'Send':
      return <IconSendOutline16 size={size} />
    case 'Calendar':
      return <IconChecklistOutline14 size={size} />
    case 'Code2':
      return <IconCodeOutline16 size={size} />
    case 'Sparkles':
      return <IconSparkle16 size={size} />
    case 'Cpu':
      return <IconAgentPresetOutline16 size={size} />
    case 'Bot':
      return <IconThinkOutline16 size={size} />
    default:
      return <IconSendOutline16 size={size} />
  }
}

export function EmptyHero({ onOpenWorkspacePicker }: EmptyHeroProps) {
  const { getActiveProject } = useProjectStore()
  const { navigateToProjects, navigateToProjectDetail } = useViewStore()
  const { presets, selectedPresetId, setSelectedPreset, openSettings } = useSettingsStore()
  const [presetMenuOpen, setPresetMenuOpen] = useState(false)
  const presetAnchorRef = useRef<HTMLButtonElement>(null)

  const { isAuthenticated, openLoginModal } = useAuthStore()

  const activeProject = getActiveProject()
  const activePreset = presets.find((p) => p.id === selectedPresetId) || presets[0]

  const handleProjectClick = () => {
    if (!isAuthenticated) {
      openLoginModal('login')
      return
    }
    if (activeProject) {
      navigateToProjectDetail(activeProject.id, 'documents')
    } else {
      navigateToProjects()
    }
  }

  const menuItems: MenuEntry[] = [
    {
      type: 'label',
      id: 'header-presets',
      text: 'AGENT PRESETS',
    },
    ...presets.map((preset) => ({
      id: preset.id,
      label: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 500 }}>{preset.name}</span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--dsw-alias-label-tertiary)',
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {preset.description}
          </span>
        </div>
      ),
      icon: getPresetIcon(preset.icon, 15),
    })),
    {
      type: 'separator',
      id: 'sep-settings',
    },
    {
      id: 'manage-presets',
      label: 'Manage Agent Presets...',
      icon: <IconSettingsOutline14 size={14} />,
    },
  ]

  const handleSelectPreset = (id: string) => {
    setPresetMenuOpen(false)
    if (id === 'manage-presets') {
      openSettings('presets')
    } else {
      setSelectedPreset(id)
    }
  }

  return (
    <div className={css.root}>
      <div className={css.stack}>
        {/* Title Headline with Fish Logo */}
        <div className={css.headline}>
          <span className={css.fishHitbox}>
            <FishLogo className={css.fish} size={30} />
          </span>
          <span className={css.headlineText}>Tôi có thể giúp gì cho bạn?</span>
          <span className={css.previewBadge}>RAG</span>
        </div>

        <div className={css.body}>
          {/* Workspace Chip & Agent Preset Chip Row */}
          <div className={css.workspaceRow}>
            {/* 1. Project selector chip */}
            <button
              type="button"
              className={css.workspace}
              onClick={handleProjectClick}
              aria-label="Chọn dự án làm việc"
              title="Nhấp để xem và quản lý tài liệu trong dự án này"
            >
              <span className={css.folder}>
                <IconFolderClose16 size={15} className={css.iconClosed} />
                <IconFolderOpen16 size={15} className={css.iconOpen} />
              </span>
              <span className={css.workspaceLabel}>
                {activeProject ? `Dự án: ${activeProject.name}` : 'Chọn không gian dự án'}
              </span>
              {activeProject && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: 'var(--dsw-alias-bg-module-platform)',
                    color: 'var(--dsw-alias-label-secondary)',
                    marginLeft: 4,
                  }}
                >
                  <IconBrowseOutline16 size={10} style={{ display: 'inline', marginRight: 2 }} />
                  {activeProject.document_count || 0} file
                </span>
              )}
              <IconChevronDownOutline14 className={css.chevron} size={12} />
            </button>

            {/* 2. Agent Preset selector on the right */}
            <Menu
              open={presetMenuOpen}
              portal={true}
              align="start"
              side="bottom"
              selectedId={selectedPresetId}
              onClose={() => setPresetMenuOpen(false)}
              onSelect={handleSelectPreset}
              items={menuItems}
              anchor={
                <button
                  ref={presetAnchorRef}
                  type="button"
                  className={css.workspace}
                  onClick={() => setPresetMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={presetMenuOpen}
                  title={activePreset ? activePreset.description : 'Chọn cấu hình Agent'}
                >
                  <span className={css.folder}>
                    {getPresetIcon(activePreset?.icon, 14)}
                  </span>
                  <span className={css.workspaceLabel}>
                    {activePreset ? activePreset.name : 'Agent preset'}
                  </span>
                  <IconChevronDownOutline14 className={css.chevron} size={12} />
                </button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
