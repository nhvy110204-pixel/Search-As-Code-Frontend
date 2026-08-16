import { create } from 'zustand'
import type { ChatMessage, ChatSession, ModelOption, AttachmentFile, WorkspaceFolder } from '@/types/chat'
import { streamChatMessage, chatSessionApi, chatMessageApi } from '@/services/api'
import { useAuthStore } from './useAuthStore'
import { useProjectStore } from './useProjectStore'

const DEFAULT_MODELS: ModelOption[] = [
  { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoner)', provider: 'DeepSeek', description: 'Tư duy suy nghĩ từng bước chuyên sâu (CoT Reasoning)', reasoningEnabled: true },
  { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat)', provider: 'DeepSeek', description: 'Mô hình trò chuyện tốc độ cao, xử lý đa tác vụ mạnh mẽ' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', description: 'Mô hình suy luận kết hợp tác vụ lập trình cao cấp', reasoningEnabled: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Mô hình đa phương tiện toàn năng' },
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
  fetchSessionsForProject: (projectId: string) => Promise<void>
  sendMessage: (content: string, attachments?: AttachmentFile[]) => Promise<void>
  stopStreaming: () => void
  newSession: (projectId?: string | null) => Promise<string>
  selectSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  forkSession: (sessionId: string) => string
  archiveSession: (sessionId: string) => void
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>
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
      title: 'Chào mừng bạn đến với RAGFlash AI',
      projectId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: 'deepseek-reasoner',
      messages: [
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: 'Xin chào! Tôi là trợ lý AI RAGFlash. Tôi hỗ trợ truy vấn thông minh từ các tài liệu bạn nạp vào Dự án, tư duy suy nghĩ từng bước (**Thinking CoT**), hiển thị trích dẫn nguồn (**Citations**) và định dạng **Markdown/Toán học (KaTeX)**. Hãy chọn một Dự án và đặt câu hỏi cho tôi nhé!',
          reasoning: 'Hệ thống RAGFlash đã sẵn sàng. Sẵn sàng phục vụ người dùng với đầy đủ UI/UX cao cấp.',
          isThinking: false,
          timestamp: Date.now(),
          stats: { durationMs: 380, tokens: 55, tps: 145 },
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

export const useChatStore = create<ChatStore>((set, get) => {
  const initialSessions = loadSavedSessions()

  return {
    sessions: initialSessions,
    workspaces: [],
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

    fetchSessionsForProject: async (projectId: string) => {
      if (!projectId) return
      const { isAuthenticated } = useAuthStore.getState()
      if (!isAuthenticated) return

      try {
        const res = await chatSessionApi.list(projectId, 1, 50)
        const backendItems = res.items || []

        const mapped: ChatSession[] = backendItems.map((b) => {
          const existing = get().sessions.find((s) => s.id === b.id)
          return {
            id: b.id,
            title: b.title || 'Cuộc trò chuyện mới',
            projectId: b.project_id,
            createdAt: new Date(b.created_at).getTime(),
            updatedAt: new Date(b.updated_at).getTime(),
            modelId: existing?.modelId || get().selectedModelId,
            messages: existing?.messages || [],
          }
        })

        // Merge with existing sessions outside this project
        const otherSessions = get().sessions.filter((s) => s.projectId !== projectId)
        const combined = [...mapped, ...otherSessions]
        set({ sessions: combined })

        // Auto active first session if activeSession is not in this project
        const activeSess = combined.find((s) => s.id === get().activeSessionId)
        if (!activeSess || activeSess.projectId !== projectId) {
          if (mapped.length > 0) {
            set({ activeSessionId: mapped[0].id })
          }
        }
      } catch {
        // Fallback to local sessions
      }
    },

    newSession: async (projectId = null) => {
      const targetProjectId = projectId || useProjectStore.getState().activeProjectId
      const { isAuthenticated } = useAuthStore.getState()

      let newId = `session-${Date.now()}`

      if (isAuthenticated && targetProjectId) {
        try {
          const created = await chatSessionApi.create(targetProjectId, 'Cuộc trò chuyện mới')
          newId = created.id
        } catch { }
      }

      const newSession: ChatSession = {
        id: newId,
        title: 'Cuộc trò chuyện mới',
        projectId: targetProjectId,
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

    selectSession: async (sessionId: string) => {
      set({ activeSessionId: sessionId })

      const active = get().sessions.find((s) => s.id === sessionId)
      if (active && active.messages.length === 0 && useAuthStore.getState().isAuthenticated) {
        try {
          const res = await chatMessageApi.list(sessionId, 1, 100)
          if (res.items && res.items.length > 0) {
            const mappedMsgs: ChatMessage[] = res.items.map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              reasoning: m.reasoning || undefined,
              timestamp: new Date(m.created_at).getTime(),
            }))

            set((state) => ({
              sessions: state.sessions.map((s) =>
                s.id === sessionId ? { ...s, messages: mappedMsgs } : s
              ),
            }))
          }
        } catch { }
      }
    },

    deleteSession: async (sessionId: string) => {
      const { isAuthenticated } = useAuthStore.getState()
      if (isAuthenticated) {
        try {
          await chatSessionApi.delete(sessionId)
        } catch { }
      }

      set((state) => {
        const nextSessions = state.sessions.filter((s) => s.id !== sessionId)
        const fallbackSessions = nextSessions.length > 0 ? nextSessions : loadSavedSessions()
        saveSessions(fallbackSessions)
        return {
          sessions: fallbackSessions,
          activeSessionId: fallbackSessions[0]?.id || 'session-default',
        }
      })
    },

    forkSession: (sessionId: string) => {
      const source = get().sessions.find((s) => s.id === sessionId)
      if (!source) return get().newSession() as any

      const newId = `session-fork-${Date.now()}`
      const forkedSession: ChatSession = {
        id: newId,
        title: `Nhánh: ${source.title}`,
        projectId: source.projectId,
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

    updateSessionTitle: async (sessionId: string, title: string) => {
      const { isAuthenticated } = useAuthStore.getState()
      if (isAuthenticated) {
        try {
          await chatSessionApi.update(sessionId, title)
        } catch { }
      }

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
      set((state) => ({ workspaces: [...state.workspaces, newWs] }))
      return newWs
    },

    deleteWorkspace: (id: string) => {
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
      }))
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
        controller.signal,
        activeSession.id
      )
    },
  }
})
