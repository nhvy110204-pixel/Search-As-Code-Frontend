import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Languages, Flag } from 'lucide-react'
import {
  IconSettingsOutline16, IconLightOutline16, IconDarkOutline16, IconFollowsystemOutline16,
  Tooltip
} from '@/components/ui'
import { useThemeStore } from '@/store/useThemeStore'
import css from './HeaderSettingsPopover.module.css'

export function HeaderSettingsPopover() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const [lang, setLang] = useState<'vi' | 'en'>('vi')
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { theme, setTheme } = useThemeStore()

  // Calculate popover position relative to trigger button
  useEffect(() => {
    if (!open || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setOpen(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleToggleLanguage = () => {
    setLang((prev) => (prev === 'vi' ? 'en' : 'vi'))
  }

  const handleFeedback = () => {
    setFeedbackSuccess(true)
    setTimeout(() => {
      setFeedbackSuccess(false)
      setOpen(false)
    }, 1200)
  }

  return (
    <>
      <Tooltip label="Tùy chọn giao diện & cài đặt" delayMs={400}>
        <button
          ref={triggerRef}
          type="button"
          className={css.settingsTrigger}
          aria-label="Cài đặt giao diện"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <IconSettingsOutline16 size={16} />
        </button>
      </Tooltip>

      {open && pos && createPortal(
        <div
          ref={popoverRef}
          className={css.popover}
          style={{ top: `${pos.top}px`, right: `${pos.right}px` }}
          role="dialog"
          aria-label="Cài đặt nhanh"
        >
          {/* 1. Theme Mode Switcher */}
          <div className={css.themeRow} role="radiogroup" aria-label="Chọn chủ đề giao diện">
            <button
              type="button"
              className={css.themeBtn}
              data-active={theme === 'light' || undefined}
              onClick={() => setTheme('light')}
              title="Chủ đề Sáng (Light)"
              aria-label="Light mode"
            >
              <IconLightOutline16 size={17} />
            </button>

            <button
              type="button"
              className={css.themeBtn}
              data-active={theme === 'dark' || undefined}
              onClick={() => setTheme('dark')}
              title="Chủ đề Tối (Dark)"
              aria-label="Dark mode"
            >
              <IconDarkOutline16 size={17} />
            </button>

            <button
              type="button"
              className={css.themeBtn}
              data-active={theme === 'system' || undefined}
              onClick={() => setTheme('system')}
              title="Tự động theo Hệ thống (System)"
              aria-label="System mode"
            >
              <IconFollowsystemOutline16 size={17} />
            </button>
          </div>

          <div className={css.divider} />

          {/* 2. Language Switcher */}
          <button
            type="button"
            className={css.menuItem}
            onClick={handleToggleLanguage}
          >
            <Languages size={17} className={css.itemIcon} />
            <span className={css.itemLabel}>Language</span>
            <span className={css.itemValue}>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
          </button>

          {/* 3. Feedback Action */}
          <button
            type="button"
            className={css.menuItem}
            onClick={handleFeedback}
          >
            <Flag size={17} className={css.itemIcon} />
            <span className={css.itemLabel}>
              {feedbackSuccess ? '✓ Cảm ơn góp ý!' : 'Feedback'}
            </span>
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
