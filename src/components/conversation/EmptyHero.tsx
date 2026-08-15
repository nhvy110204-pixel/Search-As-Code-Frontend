import { useState, useRef } from 'react'
import { Folder, Send, Calendar, Code2, Sparkles, Cpu, Bot, Settings2 } from 'lucide-react'
import { IconChevronDownOutline14, FishLogo, Menu } from '@/components/ui'
import type { MenuEntry } from '@/components/ui/Menu'
import { useChatStore } from '@/store/useChatStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import css from './HeroShell.module.css'

export interface EmptyHeroProps {
  onOpenWorkspacePicker?: () => void
}

function getPresetIcon(iconName?: string, size = 14) {
  switch (iconName) {
    case 'Send':
      return <Send size={size} />
    case 'Calendar':
      return <Calendar size={size} />
    case 'Code2':
      return <Code2 size={size} />
    case 'Sparkles':
      return <Sparkles size={size} />
    case 'Cpu':
      return <Cpu size={size} />
    case 'Bot':
      return <Bot size={size} />
    default:
      return <Send size={size} />
  }
}

export function EmptyHero({ onOpenWorkspacePicker }: EmptyHeroProps) {
  const { workspaces, activeWorkspaceId } = useChatStore()
  const { presets, selectedPresetId, setSelectedPreset, openSettings } = useSettingsStore()
  const [presetMenuOpen, setPresetMenuOpen] = useState(false)
  const presetAnchorRef = useRef<HTMLButtonElement>(null)

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId)
  const activePreset = presets.find((p) => p.id === selectedPresetId) || presets[0]

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
      icon: <Settings2 size={14} />,
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
          <span className={css.previewBadge}>PROD</span>
        </div>

        <div className={css.body}>
          {/* Workspace Chip & Agent Preset Chip Row */}
          <div className={css.workspaceRow}>
            {/* 1. Workspace folder selector */}
            <button
              type="button"
              className={css.workspace}
              onClick={onOpenWorkspacePicker}
              aria-label="Chọn thư mục làm việc"
            >
              <Folder size={14} className={css.folder} />
              <span className={css.workspaceLabel}>
                {activeWs ? activeWs.name : 'Chọn thư mục làm việc'}
              </span>
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
