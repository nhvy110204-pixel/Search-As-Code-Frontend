import { useState } from 'react'
import {
  IconLightOutline16,
  IconDarkOutline16,
  IconFollowsystemOutline16,
  IconChevronRightOutline14,
  IconRightUpOutline14,
  SlidingSegmentedControl,
} from '@/components/ui'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useSettingsStore } from '@/store/useSettingsStore'

export function GeneralTab() {
  const { user, isAuthenticated } = useAuthStore()
  const { theme, setTheme, isDark } = useThemeStore()
  const { language, updateSettings } = useSettingsStore()
  const [enterBehavior, setEnterBehavior] = useState<'enter' | 'ctrl_enter'>('enter')

  const displayName = user?.full_name || user?.username || 'Vy'
  const subtitle = isAuthenticated ? 'Mật khẩu, bảo mật, thông tin cá nhân' : 'Chưa đăng nhập'

  // Dynamic theme colors matching reference screenshot exactly in light mode
  const cardBg = isDark ? 'var(--dsw-alias-bg-layer-1, #232324)' : '#FFFFFF'
  const cardBorder = isDark ? '1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))' : '1px solid #ECECEC'
  const divider = isDark ? 'var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))' : '#EEEEEE'
  const hoverShadow = isDark
    ? '0 8px 24px rgba(0, 0, 0, 0.35)'
    : '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)'

  const cardStyle: React.CSSProperties = {
    padding: '16px 20px',
    background: cardBg,
    borderRadius: 18,
    border: cardBorder,
    boxSizing: 'border-box',
    transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease',
  }

  const sectionLabel: React.CSSProperties = {
    margin: '0 0 8px',
    fontSize: 14,
    fontWeight: 600,
    color: isDark ? 'var(--dsw-alias-label-secondary, #999999)' : '#555555',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 1. Account Profile Card with Smooth Hover & Click Physics */}
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = hoverShadow
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(0.985)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {/* Silhouette Avatar */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: isDark ? '#333333' : '#E2E2E2',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill={isDark ? '#777777' : '#FFFFFF'} />
                <path d="M4 20C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 20" stroke={isDark ? '#777777' : '#FFFFFF'} strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dsw-alias-label-primary, #181818)', lineHeight: 1.3 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12.5, color: isDark ? '#999999' : '#666666', marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
        </div>

        <IconRightUpOutline14 size={15} style={{ color: isDark ? '#aaaaaa' : '#222222', flexShrink: 0, transform: 'rotate(-45deg)' }} />
      </div>

      {/* 2. Mức sử dụng (Quota / Usage) */}
      <div style={{ marginTop: 22 }}>
        <h4 style={sectionLabel}>Mức sử dụng</h4>
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Pill Badge 'Gói miễn phí' */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 12px',
                borderRadius: 999,
                background: isDark ? 'rgba(8, 120, 249, 0.18)' : '#EAF3FE',
                color: '#0878F9',
                fontSize: 13,
                fontWeight: 600,
                transition: 'transform 160ms ease',
              }}
            >
              Gói miễn phí
            </span>
            <span style={{ fontSize: 13, color: isDark ? '#aaaaaa' : '#666666' }}>
              Đã dùng 0%
            </span>
          </div>

          <div style={{ fontSize: 12.5, color: isDark ? '#888888' : '#777777', marginTop: 8 }}>
            Giới hạn hàng tuần sẽ đặt lại vào 20 tháng 10
          </div>

          {/* Progress Bar with Fluid Spring Animation */}
          <div
            style={{
              height: 6,
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E8E8E8',
              borderRadius: 999,
              margin: '14px 0 16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '55%',
                height: '100%',
                background: '#0878F9',
                borderRadius: 999,
                transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          {/* Upgrade Action with Hover feedback */}
          <div>
            <button
              type="button"
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                fontSize: 14,
                fontWeight: 600,
                color: '#0878F9',
                cursor: 'pointer',
                transition: 'opacity 120ms ease, transform 100ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              Nâng cấp
            </button>
          </div>
        </div>
      </div>

      {/* 3. Ngôn ngữ with Smooth Hover & Click Physics */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => updateSettings({ language: language === 'vi' ? 'en' : 'vi' })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && updateSettings({ language: language === 'vi' ? 'en' : 'vi' })}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = hoverShadow
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(0.985)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1)'
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
            Ngôn ngữ
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13.5, color: isDark ? '#aaaaaa' : '#555555' }}>
              {language === 'en' ? 'English' : 'Tiếng Việt'}
            </span>
            <IconChevronRightOutline14 size={14} style={{ color: isDark ? '#888888' : '#777777' }} />
          </div>
        </div>
      </div>

      {/* 4. Giao diện with SlidingSegmentedControl */}
      <div style={{ marginTop: 22 }}>
        <h4 style={sectionLabel}>Giao diện</h4>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          {/* Row 1: Chế độ with Sliding Glider */}
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
              Chế độ
            </span>
            <SlidingSegmentedControl<'light' | 'dark' | 'system'>
              isCircle={true}
              options={[
                { id: 'light', icon: <IconLightOutline16 size={15} />, ariaLabel: 'Sáng', label: '' },
                { id: 'dark', icon: <IconDarkOutline16 size={15} />, ariaLabel: 'Tối', label: '' },
                { id: 'system', icon: <IconFollowsystemOutline16 size={15} />, ariaLabel: 'Hệ thống', label: '' },
              ]}
              value={theme}
              onChange={(val) => setTheme(val)}
            />
          </div>

          <div style={{ height: 1, background: divider, margin: '0 20px' }} />

          {/* Row 2: Hành vi gửi tin nhắn with Sliding Glider */}
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                Hành vi gửi tin nhắn
              </div>
              <div style={{ fontSize: 12, color: isDark ? '#888888' : '#777777', marginTop: 2 }}>
                {enterBehavior === 'enter' ? 'Enter để gửi, Shift+Enter xuống dòng' : 'Ctrl+Enter để gửi'}
              </div>
            </div>

            <SlidingSegmentedControl<'enter' | 'ctrl_enter'>
              options={[
                { id: 'enter', label: 'Enter' },
                { id: 'ctrl_enter', label: 'Ctrl+Enter' },
              ]}
              value={enterBehavior}
              onChange={(val) => setEnterBehavior(val)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
