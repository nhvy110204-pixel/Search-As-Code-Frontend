import { create } from 'zustand'
import type { UserProfile, TokenResponse, LoginCredentials, RegisterData, UserUpdateRequest } from '@/types/auth'
import { authApi, userApi } from '@/services/api'

const AUTH_STORAGE_KEY = 'ragflash_auth_session'

interface StoredAuthData {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: UserProfile
}

interface AuthStore {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoginModalOpen: boolean
  loginModalDefaultTab: 'login' | 'register'
  isProfileModalOpen: boolean
  authError: string | null

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  refreshAuthToken: () => Promise<string | null>
  updateUserProfile: (data: UserUpdateRequest) => Promise<boolean>
  openLoginModal: (tab?: 'login' | 'register') => void
  closeLoginModal: () => void
  openProfileModal: () => void
  closeProfileModal: () => void
  clearAuthError: () => void
  setAuthSession: (response: TokenResponse) => void
  initAuth: () => Promise<void>
}

function loadStoredAuth(): StoredAuthData | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.accessToken && parsed.user) {
      return parsed
    }
  } catch (e) {
    console.error('Error loading stored auth:', e)
  }
  return null
}

function saveStoredAuth(data: StoredAuthData | null) {
  try {
    if (data) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch (e) {
    console.error('Error saving stored auth:', e)
  }
}

// Mutex lock for refreshing token to prevent multiple concurrent refresh calls
let refreshPromise: Promise<string | null> | null = null

export const useAuthStore = create<AuthStore>((set, get) => {
  const stored = typeof window !== 'undefined' ? loadStoredAuth() : null

  return {
    user: stored?.user ?? null,
    accessToken: stored?.accessToken ?? null,
    refreshToken: stored?.refreshToken ?? null,
    expiresAt: stored?.expiresAt ?? null,
    isAuthenticated: !!(stored?.accessToken && stored?.user),
    isLoading: false,
    isLoginModalOpen: false,
    loginModalDefaultTab: 'login',
    isProfileModalOpen: false,
    authError: null,

    openLoginModal: (tab = 'login') => {
      set({ isLoginModalOpen: true, loginModalDefaultTab: tab, authError: null })
    },

    closeLoginModal: () => {
      set({ isLoginModalOpen: false, authError: null })
    },

    openProfileModal: () => {
      set({ isProfileModalOpen: true })
    },

    closeProfileModal: () => {
      set({ isProfileModalOpen: false })
    },

    clearAuthError: () => {
      set({ authError: null })
    },

    setAuthSession: (response: TokenResponse) => {
      const expiresAt = Date.now() + response.expires_in_seconds * 1000
      const storedData: StoredAuthData = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt,
        user: response.user,
      }
      saveStoredAuth(storedData)

      set({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt,
        isAuthenticated: true,
        authError: null,
        isLoginModalOpen: false,
      })
    },

    login: async (credentials: LoginCredentials): Promise<boolean> => {
      set({ isLoading: true, authError: null })
      try {
        const response = await authApi.login(credentials)
        get().setAuthSession(response)
        set({ isLoading: false })
        return true
      } catch (error: any) {
        const message = error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
        set({ isLoading: false, authError: message })
        return false
      }
    },

    register: async (data: RegisterData): Promise<boolean> => {
      set({ isLoading: true, authError: null })
      try {
        await authApi.register(data)
        // Auto-login after successful registration
        const loginSuccess = await get().login({
          identifier: data.username || data.email,
          password: data.password,
        })
        set({ isLoading: false })
        return loginSuccess
      } catch (error: any) {
        const message = error?.message || 'Đăng ký thất bại. Email hoặc username có thể đã tồn tại.'
        set({ isLoading: false, authError: message })
        return false
      }
    },

    logout: () => {
      saveStoredAuth(null)
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        isAuthenticated: false,
        isProfileModalOpen: false,
        authError: null,
      })
    },

    refreshAuthToken: async (): Promise<string | null> => {
      const { refreshToken } = get()
      if (!refreshToken) {
        get().logout()
        return null
      }

      if (refreshPromise) {
        return refreshPromise
      }

      refreshPromise = (async () => {
        try {
          const response = await authApi.refresh(refreshToken)
          get().setAuthSession(response)
          return response.access_token
        } catch (error) {
          console.error('Failed to refresh token, logging out:', error)
          get().logout()
          return null
        } finally {
          refreshPromise = null
        }
      })()

      return refreshPromise
    },

    updateUserProfile: async (data: UserUpdateRequest): Promise<boolean> => {
      const { user } = get()
      if (!user) return false

      set({ isLoading: true, authError: null })
      try {
        const updatedUser = await userApi.updateProfile(user.id, data)
        set((state) => {
          const newUser = { ...state.user, ...updatedUser }
          if (state.accessToken && state.refreshToken && state.expiresAt) {
            saveStoredAuth({
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
              expiresAt: state.expiresAt,
              user: newUser,
            })
          }
          return { user: newUser, isLoading: false }
        })
        return true
      } catch (error: any) {
        const message = error?.message || 'Không thể cập nhật hồ sơ người dùng.'
        set({ isLoading: false, authError: message })
        return false
      }
    },

    initAuth: async () => {
      const { accessToken, refreshToken, expiresAt } = get()
      if (!accessToken || !refreshToken) {
        return
      }

      // If token expired or expiring in next 60 seconds, refresh it
      if (expiresAt && expiresAt - Date.now() < 60 * 1000) {
        await get().refreshAuthToken()
        return
      }

      // Validate session with backend /me if online
      try {
        const currentUser = await authApi.getMe()
        if (currentUser) {
          set((state) => {
            const nextUser = { ...state.user, ...currentUser }
            if (state.accessToken && state.refreshToken && state.expiresAt) {
              saveStoredAuth({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                expiresAt: state.expiresAt,
                user: nextUser,
              })
            }
            return { user: nextUser, isAuthenticated: true }
          })
        }
      } catch (error) {
        console.warn('Silent token check failed, attempting refresh...', error)
        await get().refreshAuthToken()
      }
    },
  }
})
