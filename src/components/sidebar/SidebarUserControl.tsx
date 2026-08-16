import { useState } from 'react'
import clsx from 'clsx'
import {
  Tooltip, Menu, type MenuEntry,
  IconSettingsOutline14, IconUserOutline16, IconRightUpOutline14
} from '@/components/ui'
import { useAuthStore } from '@/store/useAuthStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import css from './SidebarUserControl.module.css'

export interface SidebarUserControlProps {
  wide: boolean
}

export function SidebarUserControl({ wide }: SidebarUserControlProps) {
  const {
    user,
    isAuthenticated,
    openLoginModal,
    openProfileModal,
    logout,
  } = useAuthStore()
  const { openSettings } = useSettingsStore()

  const [menuOpen, setMenuOpen] = useState(false)

  // When not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className={css.root}>
        {wide ? (
          <button
            type="button"
            className={css.guestBtnWide}
            onClick={() => openLoginModal('login')}
            aria-label="Đăng nhập hoặc đăng ký"
          >
            <IconUserOutline16 size={15} />
            <span className={css.guestBtnLabel}>Đăng nhập / Đăng ký</span>
          </button>
        ) : (
          <Tooltip label="Đăng nhập" delayMs={400} side="right">
            <button
              type="button"
              className={css.userTriggerRail}
              onClick={() => openLoginModal('login')}
              aria-label="Đăng nhập"
            >
              <div className={css.guestAvatar}>
                <IconUserOutline16 size={15} />
              </div>
            </button>
          </Tooltip>
        )}
      </div>
    )
  }

  // When logged in
  const displayName = user.full_name || user.username || 'Người dùng'
  const displayEmail = user.email || `@${user.username}`
  const initialLetter = displayName.charAt(0).toUpperCase()

  const menuItems: MenuEntry[] = [
    {
      id: 'profile',
      label: 'Hồ sơ người dùng',
      icon: <IconUserOutline16 size={15} />,
    },
    {
      id: 'settings',
      label: 'Cài đặt ',
      icon: <IconSettingsOutline14 size={15} />,
    },
    {
      type: 'separator',
      id: 'sep-auth-1',
    },
    {
      id: 'logout',
      label: 'Đăng xuất',
      icon: <IconRightUpOutline14 size={15} />,
      danger: true,
    },
  ]

  const handleMenuSelect = (id: string) => {
    setMenuOpen(false)
    if (id === 'profile') {
      openProfileModal()
    } else if (id === 'settings') {
      openSettings('general')
    } else if (id === 'logout') {
      logout()
    }
  }

  const triggerNode = wide ? (
    <button
      type="button"
      className={clsx(css.userTriggerWide, menuOpen && css.open)}
      onClick={() => setMenuOpen((v) => !v)}
      aria-label="Tài khoản cá nhân"
      aria-expanded={menuOpen}
    >
      <div className={css.avatar}>
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={displayName}
            className={css.avatarImg}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none'
            }}
          />
        ) : (
          <span>{initialLetter}</span>
        )}
      </div>
      <div className={css.userInfo}>
        <span className={css.displayName}>{displayName}</span>
        <span className={css.displayEmail}>{displayEmail}</span>
      </div>
    </button>
  ) : (
    <Tooltip label={`${displayName} (${displayEmail})`} delayMs={400} side="right">
      <button
        type="button"
        className={clsx(css.userTriggerRail, menuOpen && css.open)}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Tài khoản cá nhân"
        aria-expanded={menuOpen}
      >
        <div className={css.avatar}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className={css.avatarImg}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <span>{initialLetter}</span>
          )}
        </div>
      </button>
    </Tooltip>
  )

  return (
    <div className={css.root}>
      <Menu
        open={menuOpen}
        anchor={triggerNode}
        items={menuItems}
        onSelect={handleMenuSelect}
        onClose={() => setMenuOpen(false)}
        side={wide ? 'top' : 'right'}
        align="start"
        className={clsx(css.menuWrapper, wide && css.menuWrapperWide)}
        portal
      />
    </div>
  )
}
