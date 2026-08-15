import { create } from 'zustand'
import type { AppSettings, AgentPreset } from '@/types/chat'

export const OFFICIAL_PRESETS: AgentPreset[] = [
  {
    id: 'standard',
    name: 'Standard mode',
    description: 'Cấu hình tiêu chuẩn với bộ công cụ hoàn chỉnh, hỗ trợ tương tác đa tác vụ và phản hồi nhanh.',
    systemPrompt: 'You are an expert AI assistant designed for general-purpose pair programming, analysis, and execution.',
    icon: 'Send',
  },
  {
    id: 'plan',
    name: 'Plan mode',
    description: 'Chế độ lập kế hoạch: khảo sát kỹ lưỡng, xây dựng chiến lược chi tiết trước khi tiến hành thực thi.',
    systemPrompt: 'You are in Planning Mode. Thoroughly analyze user requests and produce structured plans before modifying code.',
    icon: 'Calendar',
  },
  {
    id: 'pair',
    name: 'Pair programmer',
    description: 'Trợ lý lập trình cặp đôi: tập trung hỗ trợ viết mã, gỡ lỗi, kiểm thử và tối ưu hóa kiến trúc.',
    systemPrompt: 'You are an expert software engineer collaborating in real-time. Follow strict coding standards and test coverage.',
    icon: 'Code2',
  },
  {
    id: 'cordis',
    name: 'Cordis self-modifier',
    description: 'Chế độ siêu hình: cho phép Agent tự động kiểm tra, nạp và điều chỉnh các plugin runtime của chính nó.',
    systemPrompt: 'You have meta-access to the runtime configuration and cordis plugin graph.',
    icon: 'Sparkles',
  },
]

interface SettingsStore extends AppSettings {
  isSettingsOpen: boolean
  activeSettingsTab: 'general' | 'models' | 'presets' | 'plugins'
  presets: AgentPreset[]
  selectedPresetId: string

  // Actions
  openSettings: (tab?: 'general' | 'models' | 'presets' | 'plugins') => void
  closeSettings: () => void
  setTab: (tab: 'general' | 'models' | 'presets' | 'plugins') => void
  updateSettings: (partial: Partial<AppSettings>) => void
  setSelectedPreset: (id: string) => void
  addPreset: (preset: AgentPreset) => void
  deletePreset: (id: string) => void
  resetToDefaults: () => void
  getActivePreset: () => AgentPreset
}

const SETTINGS_STORAGE_KEY = 'chatbot_app_settings'
const PRESET_STORAGE_KEY = 'chatbot_selected_preset_id'

const defaultSettings: AppSettings = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com/v1',
  defaultModel: 'deepseek-reasoner',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'Bạn là trợ lý AI thông minh, thân thiện và chính xác.',
  language: 'vi',
  enableWebSearch: true,
  enableCodeExecution: true,
  mcpServers: [
    { name: 'Filesystem Server', url: 'http://localhost:3001/mcp', enabled: true },
    { name: 'Web Fetch Server', url: 'http://localhost:3002/mcp', enabled: true },
  ],
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {}
  return defaultSettings
}

function loadSelectedPresetId(): string {
  try {
    const saved = localStorage.getItem(PRESET_STORAGE_KEY)
    if (saved) return saved
  } catch {}
  return 'standard'
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  const initial = loadSettings()
  const initialPresetId = loadSelectedPresetId()

  return {
    ...initial,
    isSettingsOpen: false,
    activeSettingsTab: 'general',
    presets: OFFICIAL_PRESETS,
    selectedPresetId: initialPresetId,

    getActivePreset: () => {
      const { presets, selectedPresetId } = get()
      return presets.find((p) => p.id === selectedPresetId) || OFFICIAL_PRESETS[0]
    },

    openSettings: (tab = 'general') => set({ isSettingsOpen: true, activeSettingsTab: tab }),
    closeSettings: () => set({ isSettingsOpen: false }),
    setTab: (tab) => set({ activeSettingsTab: tab }),

    updateSettings: (partial) => {
      set((state) => {
        const next = { ...state, ...partial }
        const toSave: AppSettings = {
          apiKey: next.apiKey,
          baseUrl: next.baseUrl,
          defaultModel: next.defaultModel,
          temperature: next.temperature,
          maxTokens: next.maxTokens,
          systemPrompt: next.systemPrompt,
          language: next.language,
          enableWebSearch: next.enableWebSearch,
          enableCodeExecution: next.enableCodeExecution,
          mcpServers: next.mcpServers,
        }
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toSave))
        } catch {}
        return next
      })
    },

    setSelectedPreset: (id: string) => {
      try {
        localStorage.setItem(PRESET_STORAGE_KEY, id)
      } catch {}
      set({ selectedPresetId: id })
    },

    addPreset: (preset) => {
      set((state) => {
        const next = [...state.presets, preset]
        return { presets: next }
      })
    },

    deletePreset: (id) => {
      set((state) => {
        const next = state.presets.filter((p) => p.id !== id)
        return {
          presets: next,
          selectedPresetId: state.selectedPresetId === id ? 'standard' : state.selectedPresetId,
        }
      })
    },

    resetToDefaults: () => {
      try {
        localStorage.removeItem(SETTINGS_STORAGE_KEY)
        localStorage.removeItem(PRESET_STORAGE_KEY)
      } catch {}
      set({ ...defaultSettings, presets: OFFICIAL_PRESETS, selectedPresetId: 'standard' })
    },
  }
})
