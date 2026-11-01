import { useState } from 'react'
import { IconApiOutline14, IconDataOutline16 } from '@/components/ui'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useThemeStore } from '@/store/useThemeStore'

export function ModelsTab() {
  const {
    apiKey,
    baseUrl,
    defaultModel,
    temperature,
    maxTokens,
    updateSettings,
  } = useSettingsStore()

  const { isDark } = useThemeStore()
  const [showKey, setShowKey] = useState(false)

  const cardBg = isDark ? 'var(--dsw-alias-bg-layer-1, #232324)' : '#FFFFFF'
  const cardBorder = isDark ? '1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))' : '1px solid #ECECEC'
  const inputBg = isDark ? 'var(--dsw-alias-bg-layer-2, #2c2c2e)' : '#F9F9F9'
  const inputBorder = isDark ? '1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12))' : '1px solid #E5E5E5'
  const divider = isDark ? 'var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))' : '#EEEEEE'

  const MODELS = [
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek R1',
      badge: 'Lý luận sâu (Reasoner)',
      desc: 'Mô hình chuyên sâu cho bài toán logic phức tạp, giải thuật lập trình và chuỗi suy nghĩ CoT.',
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek V3',
      badge: 'Đa tác vụ (Chat)',
      desc: 'Mô hình tổng quát cân bằng tốc độ, văn phong tự nhiên, tóm tắt và hỗ trợ ngôn ngữ nhanh chóng.',
    },
  ]

  const sectionLabel: React.CSSProperties = {
    margin: '0 0 8px',
    fontSize: 14,
    fontWeight: 600,
    color: isDark ? 'var(--dsw-alias-label-secondary, #999999)' : '#555555',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 1. API Credentials */}
      <div>
        <h4 style={sectionLabel}>Cấu hình DeepSeek API</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* API Key Box */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 18,
              background: cardBg,
              border: cardBorder,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconApiOutline14 size={16} style={{ color: '#0878F9' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                  Khóa API (API Key)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#0878F9',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showKey ? 'Ẩn khóa' : 'Hiện khóa'}
              </button>
            </div>

            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => updateSettings({ apiKey: e.target.value })}
              placeholder="sk-proj-... hoặc khóa riêng tư"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: inputBorder,
                background: inputBg,
                color: 'var(--dsw-alias-label-primary, #181818)',
                fontSize: 13.5,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
          </div>

          {/* Base URL Box */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 18,
              background: cardBg,
              border: cardBorder,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconDataOutline16 size={16} style={{ color: '#0878F9' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                Địa chỉ máy chủ (Base URL)
              </span>
            </div>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => updateSettings({ baseUrl: e.target.value })}
              placeholder="https://api.deepseek.com/v1"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: inputBorder,
                background: inputBg,
                color: 'var(--dsw-alias-label-primary, #181818)',
                fontSize: 13.5,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Model Selection */}
      <div style={{ marginTop: 24 }}>
        <h4 style={sectionLabel}>Mô hình mặc định</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {MODELS.map((m) => {
            const isSelected = defaultModel === m.id
            return (
              <div
                key={m.id}
                onClick={() => updateSettings({ defaultModel: m.id })}
                style={{
                  padding: '16px 18px',
                  borderRadius: 18,
                  background: cardBg,
                  border: isSelected ? '1.5px solid #0878F9' : cardBorder,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease',
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(8, 120, 249, 0.16)'
                    : 'none',
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                    {m.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: isSelected
                        ? 'rgba(8, 120, 249, 0.12)'
                        : (isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F2'),
                      color: isSelected ? '#0878F9' : (isDark ? '#aaaaaa' : '#666666'),
                    }}
                  >
                    {m.badge}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: isDark ? '#aaaaaa' : '#666666', lineHeight: 1.4 }}>
                  {m.desc}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Inference Sliders */}
      <div style={{ marginTop: 24 }}>
        <h4 style={sectionLabel}>Tham số điều khiển</h4>
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 18,
            background: cardBg,
            border: cardBorder,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Temperature */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                Độ sáng tạo (Temperature)
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0878F9' }}>
                {temperature}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                accentColor: '#0878F9',
                cursor: 'pointer',
              }}
            />
          </div>

          <div style={{ height: 1, background: divider }} />

          {/* Max Tokens */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                Giới hạn token phản hồi (Max Tokens)
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0878F9' }}>
                {maxTokens} tokens
              </span>
            </div>
            <input
              type="range"
              min="1024"
              max="8192"
              step="512"
              value={maxTokens}
              onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value, 10) })}
              style={{
                width: '100%',
                accentColor: '#0878F9',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
