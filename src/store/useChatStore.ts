import { create } from 'zustand'
import type { ChatMessage, ChatSession, ModelOption, AttachmentFile, WorkspaceFolder } from '@/types/chat'
import { streamChatMessage } from '@/services/api'
import { useAuthStore } from './useAuthStore'

const DEFAULT_MODELS: ModelOption[] = [
  { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoner)', provider: 'DeepSeek', description: 'Tư duy suy nghĩ từng bước chuyên sâu (CoT Reasoning)', reasoningEnabled: true },
  { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat)', provider: 'DeepSeek', description: 'Mô hình trò chuyện tốc độ cao, xử lý đa tác vụ mạnh mẽ' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', description: 'Mô hình suy luận kết hợp tác vụ lập trình cao cấp', reasoningEnabled: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Mô hình đa phương tiện toàn năng' },
]

const DEFAULT_WORKSPACES: WorkspaceFolder[] = [
  { id: 'ws-default', name: 'Dự án Mặc định (Default)', path: '/workspace/default', createdAt: Date.now() },
  { id: 'ws-backend', name: 'Backend Services', path: '/workspace/backend', createdAt: Date.now() - 86400000 },
]

interface ChatStore {
  sessions: ChatSession[]
  workspaces: WorkspaceFolder[]
  activeSessionId: string
  activeWorkspaceId: string | null
  isStreaming: boolean
  availableModels: ModelOption[]
  selectedModelId: string
  selectedEffort: string
  isPlanMode: boolean
  abortController: AbortController | null

  // Actions
  sendMessage: (content: string, attachments?: AttachmentFile[]) => Promise<void>
  stopStreaming: () => void
  newSession: (workspaceId?: string | null) => string
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  forkSession: (sessionId: string) => string
  archiveSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  setMessageFeedback: (messageId: string, feedback: 'like' | 'dislike' | null) => void
  setSelectedModel: (modelId: string, effort?: string) => void
  togglePlanMode: () => void
  getActiveSession: () => ChatSession | undefined

  // Workspace Actions
  addWorkspace: (name: string, path: string) => WorkspaceFolder
  deleteWorkspace: (id: string) => void
  setActiveWorkspace: (id: string | null) => void
  clearAllSessions: () => void
}

const STORAGE_KEY = 'chatbot_sessions_data'
const WS_STORAGE_KEY = 'chatbot_workspaces_data'

function loadSavedWorkspaces(): WorkspaceFolder[] {
  try {
    const raw = localStorage.getItem(WS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { }
  return DEFAULT_WORKSPACES
}

function loadSavedSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { }

  const initialId = 'session-default'
  return [
    {
      id: initialId,
      title: 'Chào mừng bạn đến với Chatbot AI',
      workspaceId: 'ws-default',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: 'deepseek-reasoner',
      messages: [
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: 'Xin chào! Tôi là trợ lý AI thông minh. Tôi hỗ trợ tư duy suy nghĩ từng bước (**Thinking CoT**), hiển thị các bước **Tool Steps**, và định dạng **Markdown/Toán học (KaTeX)**. Hãy đặt câu hỏi bất kỳ cho tôi nhé!',
          reasoning: 'Hệ thống đã khởi động thành công. Sẵn sàng phục vụ người dùng với đầy đủ UI/UX cao cấp.',
          isThinking: false,
          timestamp: Date.now(),
          stats: { durationMs: 420, tokens: 68, tps: 160 },
        },
      ],
    },
  ]
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch { }
}

function saveWorkspaces(workspaces: WorkspaceFolder[]) {
  try {
    localStorage.setItem(WS_STORAGE_KEY, JSON.stringify(workspaces))
  } catch { }
}

export const useChatStore = create<ChatStore>((set, get) => {
  const initialSessions = loadSavedSessions()
  const initialWorkspaces = loadSavedWorkspaces()

  return {
    sessions: initialSessions,
    workspaces: initialWorkspaces,
    activeSessionId: initialSessions[0]?.id || 'session-default',
    activeWorkspaceId: null,
    isStreaming: false,
    availableModels: DEFAULT_MODELS,
    selectedModelId: 'deepseek-reasoner',
    selectedEffort: 'high',
    isPlanMode: false,
    abortController: null,

    getActiveSession: () => {
      const { sessions, activeSessionId } = get()
      return sessions.find((s) => s.id === activeSessionId) || sessions[0]
    },

    newSession: (workspaceId = null) => {
      const newId = `session-${Date.now()}`
      const wsId = workspaceId !== undefined ? workspaceId : get().activeWorkspaceId
      const newSession: ChatSession = {
        id: newId,
        title: 'Cuộc trò chuyện mới',
        workspaceId: wsId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: get().selectedModelId,
        isPlanMode: get().isPlanMode,
        messages: [],
      }

      set((state) => {
        const nextSessions = [newSession, ...state.sessions]
        saveSessions(nextSessions)
        return {
          sessions: nextSessions,
          activeSessionId: newId,
        }
      })
      return newId
    },

    selectSession: (sessionId: string) => {
      set({ activeSessionId: sessionId })
    },

    deleteSession: (sessionId: string) => {
      set((state) => {
        const nextSessions = state.sessions.filter((s) => s.id !== sessionId)
        const fallbackSessions = nextSessions.length > 0 ? nextSessions : loadSavedSessions()
        saveSessions(fallbackSessions)
        return {
          sessions: fallbackSessions,
          activeSessionId: fallbackSessions[0].id,
        }
      })
    },

    forkSession: (sessionId: string) => {
      const source = get().sessions.find((s) => s.id === sessionId)
      if (!source) return get().newSession()

      const newId = `session-fork-${Date.now()}`
      const forkedSession: ChatSession = {
        id: newId,
        title: `Nhánh: ${source.title}`,
        workspaceId: source.workspaceId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: source.modelId,
        isPlanMode: source.isPlanMode,
        messages: [...source.messages],
      }

      set((state) => {
        const nextSessions = [forkedSession, ...state.sessions]
        saveSessions(nextSessions)
        return {
          sessions: nextSessions,
          activeSessionId: newId,
        }
      })
      return newId
    },

    archiveSession: (sessionId: string) => {
      set((state) => {
        const nextSessions = state.sessions.map((s) =>
          s.id === sessionId ? { ...s, isArchived: !s.isArchived, updatedAt: Date.now() } : s
        )
        saveSessions(nextSessions)
        return { sessions: nextSessions }
      })
    },

    updateSessionTitle: (sessionId: string, title: string) => {
      set((state) => {
        const nextSessions = state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
        )
        saveSessions(nextSessions)
        return { sessions: nextSessions }
      })
    },

    setMessageFeedback: (messageId: string, feedback: 'like' | 'dislike' | null) => {
      set((state) => {
        const nextSessions = state.sessions.map((s) => {
          if (s.id !== state.activeSessionId) return s
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === messageId ? { ...m, feedback } : m
            ),
          }
        })
        saveSessions(nextSessions)
        return { sessions: nextSessions }
      })
    },

    setSelectedModel: (modelId: string, effort?: string) => {
      set((state) => {
        const nextSessions = state.sessions.map((s) =>
          s.id === state.activeSessionId ? { ...s, modelId } : s
        )
        saveSessions(nextSessions)
        return {
          selectedModelId: modelId,
          selectedEffort: effort || state.selectedEffort,
          sessions: nextSessions,
        }
      })
    },

    togglePlanMode: () => {
      set((state) => ({ isPlanMode: !state.isPlanMode }))
    },

    addWorkspace: (name: string, path: string) => {
      const newWs: WorkspaceFolder = {
        id: `ws-${Date.now()}`,
        name,
        path,
        createdAt: Date.now(),
      }
      set((state) => {
        const next = [...state.workspaces, newWs]
        saveWorkspaces(next)
        return { workspaces: next }
      })
      return newWs
    },

    deleteWorkspace: (id: string) => {
      set((state) => {
        const next = state.workspaces.filter((w) => w.id !== id)
        saveWorkspaces(next)
        return {
          workspaces: next,
          activeWorkspaceId: state.activeWorkspaceId === id ? null : state.activeWorkspaceId,
        }
      })
    },

    setActiveWorkspace: (id: string | null) => {
      set({ activeWorkspaceId: id })
    },

    clearAllSessions: () => {
      const fresh = loadSavedSessions()
      saveSessions(fresh)
      set({ sessions: fresh, activeSessionId: fresh[0].id })
    },

    stopStreaming: () => {
      const { abortController } = get()
      if (abortController) {
        abortController.abort()
      }
      set({ isStreaming: false, abortController: null })
    },

    sendMessage: async (content: string, attachments?: AttachmentFile[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return
      if (get().isStreaming) return

      // Auth Guard Check: require authentication before sending message
      const authState = useAuthStore.getState()
      if (!authState.isAuthenticated) {
        authState.openLoginModal('login')
        return
      }

      const activeSession = get().getActiveSession()
      if (!activeSession) return

      const userMsgId = `msg-user-${Date.now()}`
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content,
        attachments,
        timestamp: Date.now(),
      }

      const assistantMsgId = `msg-assistant-${Date.now() + 1}`
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        reasoning: '',
        isThinking: true,
        steps: [],
        producedFiles: [],
        timestamp: Date.now(),
      }

      const currentTitle = activeSession.title
      const newTitle =
        activeSession.messages.length === 0 || currentTitle === 'Cuộc trò chuyện mới'
          ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
          : currentTitle

      const updatedMessages = [...activeSession.messages, userMessage, assistantMessage]

      set((state) => {
        const nextSessions = state.sessions.map((s) =>
          s.id === activeSession.id
            ? { ...s, title: newTitle, updatedAt: Date.now(), messages: updatedMessages }
            : s
        )
        saveSessions(nextSessions)
        return { sessions: nextSessions, isStreaming: true }
      })

      const controller = new AbortController()
      set({ abortController: controller })

      const startTime = performance.now()

      await streamChatMessage(
        updatedMessages,
        get().selectedModelId,
        {
          onThinkingChunk: (chunk) => {
            set((state) => {
              const nextSessions = state.sessions.map((s) => {
                if (s.id !== activeSession.id) return s
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, reasoning: (m.reasoning || '') + chunk, isThinking: true }
                      : m
                  ),
                }
              })
              return { sessions: nextSessions }
            })
          },
          onThinkingDone: () => {
            set((state) => {
              const nextSessions = state.sessions.map((s) => {
                if (s.id !== activeSession.id) return s
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, isThinking: false } : m
                  ),
                }
              })
              return { sessions: nextSessions }
            })
          },
          onContentChunk: (chunk) => {
            set((state) => {
              const nextSessions = state.sessions.map((s) => {
                if (s.id !== activeSession.id) return s
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + chunk, isThinking: false }
                      : m
                  ),
                }
              })
              return { sessions: nextSessions }
            })
          },
          onStepUpdate: (step) => {
            set((state) => {
              const nextSessions = state.sessions.map((s) => {
                if (s.id !== activeSession.id) return s
                return {
                  ...s,
                  messages: s.messages.map((m) => {
                    if (m.id !== assistantMsgId) return m
                    const existing = m.steps || []
                    const filtered = existing.filter((st) => st.id !== step.id)
                    return { ...m, steps: [...filtered, step] }
                  }),
                }
              })
              return { sessions: nextSessions }
            })
          },
          onProducedFiles: (files) => {
            set((state) => {
              const nextSessions = state.sessions.map((s) => {
                if (s.id !== activeSession.id) return s
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, producedFiles: files } : m
                  ),
                }
              })
              return { sessions: nextSessions }
            })
          },
          onDone: () => {
            const elapsedSec = (performance.now() - startTime) / 1000
            set((state) => {
              const currentActive = state.sessions.find((s) => s.id === activeSession.id)
              const finalMsg = currentActive?.messages.find((m) => m.id === assistantMsgId)
              const approxTokens = Math.ceil(((finalMsg?.content || '').length + (finalMsg?.reasoning || '').length) / 3.5)

              const nextSessions = state.sessions.map((s) => {
                if (s.id !== activeSession.id) return s
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                        ...m,
                        isThinking: false,
                        stats: {
                          durationMs: Math.round(elapsedSec * 1000),
                          tokens: approxTokens,
                          tps: Math.round(approxTokens / (elapsedSec || 1)),
                        },
                      }
                      : m
                  ),
                }
              })
              saveSessions(nextSessions)
              return { sessions: nextSessions, isStreaming: false, abortController: null }
            })
          },
          onError: (err) => {
            set((state) => {
              const nextSessions = state.sessions.map((s) => {
                if (s.id !== activeSession.id) return s
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                        ...m,
                        isThinking: false,
                        content: (m.content || '') + `\n\n> Lỗi kết nối: ${err.message}`,
                      }
                      : m
                  ),
                }
              })
              saveSessions(nextSessions)
              return { sessions: nextSessions, isStreaming: false, abortController: null }
            })
          },
        },
        controller.signal
      )
    },
  }
})
