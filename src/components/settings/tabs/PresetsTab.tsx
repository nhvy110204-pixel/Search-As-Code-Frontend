import {
  IconSendOutline16,
  IconAgentPresetOutline16,
  IconCodeOutline16,
  IconSparkle16,
  IconPersonalizationOutline16,
  IconCheckOutline14,
} from '@/components/ui'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useThemeStore } from '@/store/useThemeStore'

export function PresetsTab() {
  const { presets, selectedPresetId, setSelectedPreset } = useSettingsStore()
  const { isDark } = useThemeStore()

  const cardBg = isDark ? 'var(--dsw-alias-bg-layer-1, #232324)' : '#FFFFFF'
  const cardBorder = isDark ? '1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))' : '1px solid #ECECEC'
  const iconTileBg = isDark ? 'var(--dsw-alias-bg-layer-2, #2c2c2e)' : '#F5F5F5'

  const getPresetIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Send':
        return <IconSendOutline16 size={20} style={{ color: '#0878F9' }} />
      case 'Calendar':
        return <IconAgentPresetOutline16 size={20} style={{ color: '#0878F9' }} />
      case 'Code2':
        return <IconCodeOutline16 size={20} style={{ color: '#0878F9' }} />
      case 'Sparkles':
        return <IconSparkle16 size={20} style={{ color: '#0878F9' }} />
      default:
        return <IconPersonalizationOutline16 size={20} style={{ color: '#0878F9' }} />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isDark ? 'var(--dsw-alias-label-secondary, #999999)' : '#555555' }}>
          Chế độ Agent có sẵn (Presets)
        </h4>
        <span style={{ fontSize: 12.5, color: isDark ? '#888888' : '#777777' }}>
          Click vào thẻ để chuyển đổi nhanh
        </span>
      </div>

      {/* Featured Preset Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        {presets.map((preset) => {
          const isSelected = selectedPresetId === preset.id
          return (
              <div
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '18px 20px',
                  borderRadius: 18,
                  background: cardBg,
                  border: isSelected ? '1.5px solid #0878F9' : cardBorder,
                  cursor: 'pointer',
                  transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease',
                  position: 'relative',
                  boxSizing: 'border-box',
                  minHeight: 160,
                  boxShadow: isSelected ? '0 4px 16px rgba(8, 120, 249, 0.16)' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = isSelected
                    ? '0 6px 20px rgba(8, 120, 249, 0.22)'
                    : (isDark ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 8px 24px rgba(0, 0, 0, 0.06)')
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = isSelected
                    ? '0 4px 16px rgba(8, 120, 249, 0.16)'
                    : 'none'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(0.985)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1)'
                }}
              >
                {/* Icon Tile */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: iconTileBg,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    marginBottom: 10,
                    transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                {getPresetIcon(preset.icon)}
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                {preset.name}
              </div>

              <div
                style={{
                  fontSize: 12.5,
                  color: isDark ? '#aaaaaa' : '#666666',
                  lineHeight: 1.45,
                  marginTop: 4,
                  flex: 1,
                }}
              >
                {preset.description}
              </div>

              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {isSelected ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: 'rgba(8, 120, 249, 0.12)',
                      color: '#0878F9',
                    }}
                  >
                    <IconCheckOutline14 size={10} />
                    Đang kích hoạt
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: isDark ? '#777777' : '#888888' }}>
                    Nhấp để kích hoạt
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
