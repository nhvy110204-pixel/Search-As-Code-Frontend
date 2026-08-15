import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: ThemeMode
  isDark: boolean
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setDark: (dark: boolean) => void
}

const STORAGE_KEY = 'chatbot_theme_mode'

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

function applyTheme(isDark: boolean) {
  if (isDark) {
    document.body.setAttribute('data-ds-dark-theme', '')
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.body.removeAttribute('data-ds-dark-theme')
    document.documentElement.removeAttribute('data-theme')
  }
}

export const useThemeStore = create<ThemeState>((set) => {
  const initialMode: ThemeMode = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved as ThemeMode
      }
      const legacyIsDark = localStorage.getItem('chatbot_theme_is_dark')
      if (legacyIsDark !== null) {
        return legacyIsDark === 'true' ? 'dark' : 'light'
      }
      return 'system'
    } catch {
      return 'system'
    }
  })()

  const initialIsDark = resolveIsDark(initialMode)
  applyTheme(initialIsDark)

  return {
    theme: initialMode,
    isDark: initialIsDark,
    setTheme: (mode: ThemeMode) => {
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {}
      const isDark = resolveIsDark(mode)
      applyTheme(isDark)
      set({ theme: mode, isDark })
    },
    toggleTheme: () => {
      set((state) => {
        const nextMode: ThemeMode = state.isDark ? 'light' : 'dark'
        try {
          localStorage.setItem(STORAGE_KEY, nextMode)
        } catch {}
        const nextDark = resolveIsDark(nextMode)
        applyTheme(nextDark)
        return { theme: nextMode, isDark: nextDark }
      })
    },
    setDark: (dark: boolean) => {
      const mode: ThemeMode = dark ? 'dark' : 'light'
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {}
      applyTheme(dark)
      set({ theme: mode, isDark: dark })
    },
  }
})
