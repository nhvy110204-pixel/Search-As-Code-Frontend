import clsx from 'clsx'
import {
  IconDarkOutline16, IconFollowsystemOutline16, IconLightOutline16,
} from '@/components/ui'
import { useThemeStore } from '@/store/useThemeStore'
import css from './AppearanceRow.module.css'

export function AppearanceRow() {
  const { theme, setTheme } = useThemeStore()

  const CUBES = [
    { id: 'light' as const, label: 'Sáng', Icon: IconLightOutline16 },
    { id: 'dark' as const, label: 'Tối', Icon: IconDarkOutline16 },
    { id: 'system' as const, label: 'Theo hệ thống', Icon: IconFollowsystemOutline16 },
  ]

  return (
    <div className={css.group}>
      <div className={css.title}>Giao diện (Theme)</div>
      <div className={css.cubeRow}>
        {CUBES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={clsx(css.themeCube, theme === id && css.selected)}
            aria-pressed={theme === id}
            onClick={() => setTheme(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
