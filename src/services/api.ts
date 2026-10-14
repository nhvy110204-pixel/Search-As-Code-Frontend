import type {
  ChatMessage,
  ToolStep,
  ProducedFile,
  BackendChatSession,
  BackendChatSessionListResponse,
  BackendChatMessage,
  CitationSource,
  MessageStats
} from '@/types/chat'
import type { UserProfile, TokenResponse, LoginCredentials, RegisterData, UserUpdateRequest } from '@/types/auth'
import type {
  ProjectResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectListResponse,
  DocumentResponse,
  DocumentListResponse,
  DocumentPreviewResponse,
  DocumentChunkListResponse,
  DocumentUploadResponse,
  BatchUploadResponse,
  IngestionTaskStatus,
  IngestionProgressEvent,
  BatchDeleteResponse,
  ReindexResponse,
  ProjectIngestionStats,
} from '@/types/project'

import { useAuthStore } from '@/store/useAuthStore'

export interface StreamCallbacks {
  onThinkingChunk?: (chunk: string) => void
  onThinkingDone?: () => void
  onContentChunk?: (chunk: string) => void
  onStepUpdate?: (step: ToolStep) => void
  onProducedFiles?: (files: ProducedFile[]) => void
  onDone?: (stats?: MessageStats, citations?: CitationSource[], finalContent?: string) => void
  onError?: (error: Error) => void
}

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '')
const API_V1_URL = `${API_BASE_URL}/api/v1`
const IS_MOCK = import.meta.env.VITE_ENABLE_MOCK === 'true'

/**
 * Extract human-readable error from FastAPI response (handles 422 array details, strings, etc.)
 */
function extractApiErrorMessage(errorData: any, fallbackMessage: string): string {
  if (!errorData) return fallbackMessage
  if (typeof errorData.detail === 'string') return errorData.detail
  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((item: any) => {
        const field = item.loc ? item.loc[item.loc.length - 1] : 'Trường'
        return `${field}: ${item.msg}`
      })
      .join(', ')
  }
  if (errorData.message) return String(errorData.message)
  return fallbackMessage
}

/**
 * Handle network error with clear actionable Vietnamese feedback
 */
function handleNetworkError(error: any): never {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new Error(
      `Không thể kết nối đến máy chủ Backend (${API_BASE_URL}). Vui lòng đảm bảo Backend đã khởi động`
    )
  }
  throw error
}

/**
 * Fetch wrapper with automatic Bearer token injection and 401 Auto-Refresh Token Interceptor
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_V1_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle 401 Unauthorized: Attempt token refresh & retry once
    if (response.status === 401 && token) {
      const newToken = await useAuthStore.getState().refreshAuthToken()
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`
        response = await fetch(url, {
          ...options,
          headers,
        })
      } else {
        useAuthStore.getState().logout()
        useAuthStore.getState().openLoginModal()
      }
    }

    return response
  } catch (error) {
    return handleNetworkError(error)
  }
}

// -------------------------------------------------------------
// Authentication & User APIs
// -------------------------------------------------------------

export const authApi = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 600))
      if (credentials.password === 'wrong') {
        throw new Error('Tài khoản hoặc mật khẩu không chính xác')
      }
      return createMockTokenResponse(credentials.identifier)
    }

    try {
      const response = await fetch(`${API_V1_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(extractApiErrorMessage(errorData, `Đăng nhập thất bại (${response.status})`))
      }

      return response.json()
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  async register(data: RegisterData): Promise<UserProfile> {
    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 700))
      return {
        id: `user-${Date.now()}`,
        email: data.email,
        username: data.username,
        full_name: data.full_name || data.username,
        avatar_url: data.avatar_url || null,
        is_active: true,
        created_at: new Date().toISOString(),
      }
    }

    try {
      const response = await fetch(`${API_V1_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          full_name: data.full_name || null,
          avatar_url: data.avatar_url || null,
          password: data.password,
          is_active: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(extractApiErrorMessage(errorData, `Đăng ký thất bại (${response.status})`))
      }

      return response.json()
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 400))
      return createMockTokenResponse('demo_user')
    }

    try {
      const response = await fetch(`${API_V1_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(extractApiErrorMessage(errorData, 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'))
      }

      return response.json()
    } catch (error) {
      return handleNetworkError(error)
    }
  },

  async getMe(): Promise<UserProfile> {
    if (IS_MOCK) {
      const current = useAuthStore.getState().user
      if (current) return current
      return createMockUserProfile('demo_user')
    }

    const response = await fetchWithAuth('/auth/me')
    if (!response.ok) {
      throw new Error(`Không thể lấy thông tin người dùng (${response.status})`)
    }
    return response.json()
  },
}

export const userApi = {
  async updateProfile(userId: string, data: UserUpdateRequest): Promise<UserProfile> {
    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 500))
      const current = useAuthStore.getState().user
      return {
        ...current!,
        full_name: data.full_name !== undefined ? data.full_name : current?.full_name ?? null,
        avatar_url: data.avatar_url !== undefined ? data.avatar_url : current?.avatar_url ?? null,
        username: data.username || current?.username || 'user',
        email: data.email || current?.email || 'user@example.com',
        updated_at: new Date().toISOString(),
      }
    }

    const response = await fetchWithAuth(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(errorData, `Cập nhật hồ sơ thất bại (${response.status})`))
    }

    return response.json()
  },
}

// -------------------------------------------------------------
// Projects API
// -------------------------------------------------------------

export const projectApi = {
  async list(page = 1, pageSize = 50, name?: string): Promise<ProjectListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    })
    if (name) params.append('name', name)

    const response = await fetchWithAuth(`/projects/?${params.toString()}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể tải danh sách dự án'))
    }
    return response.json()
  },

  async get(id: string): Promise<ProjectResponse> {
    const response = await fetchWithAuth(`/projects/${id}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể tải thông tin dự án'))
    }
    return response.json()
  },

  async create(data: ProjectCreateRequest): Promise<ProjectResponse> {
    const response = await fetchWithAuth('/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Tạo dự án thất bại'))
    }
    return response.json()
  },

  async update(id: string, data: ProjectUpdateRequest): Promise<ProjectResponse> {
    const response = await fetchWithAuth(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Cập nhật dự án thất bại'))
    }
    return response.json()
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`/projects/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Xóa dự án thất bại'))
    }
  },
}

// -------------------------------------------------------------
// Documents & Ingestion API
// -------------------------------------------------------------

export const documentApi = {
  async list(projectId?: string, page = 1, pageSize = 50, fileName?: string): Promise<DocumentListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    })
    if (projectId) params.append('project_id', projectId)
    if (fileName) params.append('file_name', fileName)

    const response = await fetchWithAuth(`/documents/?${params.toString()}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể tải danh sách tài liệu'))
    }
    return response.json()
  },

  async get(id: string): Promise<DocumentResponse> {
    const response = await fetchWithAuth(`/documents/${id}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể lấy thông tin tài liệu'))
    }
    return response.json()
  },

  async getPreview(id: string): Promise<DocumentPreviewResponse> {
    const response = await fetchWithAuth(`/documents/${id}/preview`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể xem trước nội dung tài liệu'))
    }
    return response.json()
  },

  async checkFilename(filename: string, projectId?: string): Promise<{ exists: boolean }> {
    const params = new URLSearchParams({ filename })
    if (projectId) params.append('project_id', projectId)

    const response = await fetchWithAuth(`/documents/check-filename?${params.toString()}`)
    if (!response.ok) {
      return { exists: false }
    }
    return response.json()
  },

  async listChunks(documentId: string, page = 1, pageSize = 50): Promise<DocumentChunkListResponse> {
    const params = new URLSearchParams({
      document_id: documentId,
      page: String(page),
      page_size: String(pageSize),
    })
    const response = await fetchWithAuth(`/document-chunks/?${params.toString()}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể tải danh sách chunks'))
    }
    return response.json()
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`/documents/${id}`, {
      method: 'DELETE',
    })
    // 204 No Content or 404 (already deleted from DB) is considered successfully deleted
    if (!response.ok && response.status !== 204 && response.status !== 404) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Xóa tài liệu thất bại'))
    }
  },


  async batchDelete(documentIds: string[], hard = false): Promise<BatchDeleteResponse> {
    const response = await fetchWithAuth('/documents/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ document_ids: documentIds, hard }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Xóa hàng loạt thất bại'))
    }
    return response.json()
  },
}

export const ingestionApi = {
  async upload(projectId: string, file: File, description?: string): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('project_id', projectId)
    formData.append('file', file)
    if (description) formData.append('description', description)

    const response = await fetchWithAuth('/ingestion/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, `Upload file ${file.name} thất bại`))
    }

    const json = await response.json()
    return json.data
  },

  async uploadBatch(projectId: string, files: File[]): Promise<BatchUploadResponse> {
    const formData = new FormData()
    formData.append('project_id', projectId)
    for (const f of files) {
      formData.append('files', f)
    }

    const response = await fetchWithAuth('/ingestion/upload-batch', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Upload hàng loạt thất bại'))
    }

    return response.json()
  },

  async getStatus(taskId: string): Promise<IngestionTaskStatus> {
    const response = await fetchWithAuth(`/ingestion/status/${taskId}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể kiểm tra trạng thái ingestion'))
    }
    const json = await response.json()
    return json.data
  },

  async cancelTask(taskId: string): Promise<void> {
    await fetchWithAuth(`/ingestion/cancel/${taskId}`, {
      method: 'POST',
    })
  },

  async reindexDocument(documentId: string): Promise<ReindexResponse> {
    const response = await fetchWithAuth(`/ingestion/reindex/${documentId}`, {
      method: 'POST',
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Đồng bộ lại tài liệu thất bại'))
    }
    const json = await response.json()
    return json.data
  },

  async reindexProject(projectId: string): Promise<ReindexResponse> {
    const response = await fetchWithAuth(`/ingestion/reindex-project/${projectId}`, {
      method: 'POST',
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Đồng bộ lại toàn bộ dự án thất bại'))
    }
    const json = await response.json()
    return json.data
  },

  async getStats(projectId: string): Promise<ProjectIngestionStats> {
    const response = await fetchWithAuth(`/ingestion/stats/${projectId}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể lấy thống kê tri thức dự án'))
    }
    const json = await response.json()
    return json.data
  },

  subscribeToEvents(
    projectId: string,
    onEvent: (event: IngestionProgressEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const abortController = new AbortController()

    const connect = async () => {
      const token = useAuthStore.getState().accessToken
      if (!token) return

      try {
        const url = `${API_V1_URL}/ingestion/events?project_id=${projectId}`
        const headers: Record<string, string> = {
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}`,
        }

        const response = await fetch(url, {
          headers,
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`SSE connection failed (${response.status})`)
        }

        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let buffer = ''

        while (!abortController.signal.aborted) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith(':')) continue

            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6)
              try {
                const event: IngestionProgressEvent = JSON.parse(dataStr)
                onEvent(event)
              } catch {
                // Ignore parsing errors on non-json frames
              }
            }
          }
        }
      } catch (err: any) {
        if (abortController.signal.aborted) return
        onError?.(err instanceof Error ? err : new Error(String(err)))
      }
    }

    connect()

    return () => {
      abortController.abort()
    }
  },
}


// -------------------------------------------------------------
// Chat Sessions & Messages API
// -------------------------------------------------------------

export const chatSessionApi = {
  async list(projectId?: string, page = 1, pageSize = 50): Promise<BackendChatSessionListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    })
    if (projectId) params.append('project_id', projectId)

    const response = await fetchWithAuth(`/chat-sessions/?${params.toString()}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể tải danh sách phiên trò chuyện'))
    }
    return response.json()
  },

  async get(id: string): Promise<BackendChatSession> {
    const response = await fetchWithAuth(`/chat-sessions/${id}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể tải phiên trò chuyện'))
    }
    return response.json()
  },

  async create(projectId: string, title?: string): Promise<BackendChatSession> {
    const response = await fetchWithAuth('/chat-sessions/', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        title: title || 'Cuộc trò chuyện mới',
      }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Tạo phiên trò chuyện thất bại'))
    }
    return response.json()
  },

  async update(id: string, title: string): Promise<BackendChatSession> {
    const response = await fetchWithAuth(`/chat-sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Đổi tên phiên trò chuyện thất bại'))
    }
    return response.json()
  },

  async delete(id: string): Promise<void> {
    const response = await fetchWithAuth(`/chat-sessions/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Xóa phiên trò chuyện thất bại'))
    }
  },
}

export const chatMessageApi = {
  async list(sessionId: string, page = 1, pageSize = 100): Promise<{ items: BackendChatMessage[]; total: number }> {
    const params = new URLSearchParams({
      session_id: sessionId,
      page: String(page),
      page_size: String(pageSize),
    })
    const response = await fetchWithAuth(`/chat-messages/?${params.toString()}`)
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Không thể tải lịch sử tin nhắn'))
    }
    return response.json()
  },
}

// -------------------------------------------------------------
// Chat Streaming API
// -------------------------------------------------------------

/**
 * Send chat message and handle streaming updates with Bearer Token
 */
export async function streamChatMessage(
  messages: ChatMessage[],
  modelId: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  sessionId?: string
): Promise<void> {
  if (IS_MOCK) {
    return runMockStreamingEngine(messages, modelId, callbacks, signal)
  }

  try {
    const token = useAuthStore.getState().accessToken
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() ||
      messages[messages.length - 1]?.content?.trim() ||
      ''

    if (!lastUserMessage) {
      throw new Error('Nội dung tin nhắn không được để trống')
    }

    const targetSessionId = sessionId || '00000000-0000-0000-0000-000000000000'

    const response = await fetch(`${API_V1_URL}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: targetSessionId,
        message: lastUserMessage,
        client_request_id: `req-${Date.now()}`,
      }),
      signal,
    }).catch(handleNetworkError)

    if (!response.ok) {
      if (response.status === 401) {
        useAuthStore.getState().openLoginModal()
        throw new Error('Vui lòng đăng nhập để gửi tin nhắn')
      }
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, `Lỗi gửi tin nhắn (${response.status})`))
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let inThinkTag = false
    let currentEventName = ''
    let currentDataStr = ''

    const processSseFrame = (eventName: string, dataStr: string) => {
      if (!dataStr) return
      if (dataStr === '[DONE]') {
        callbacks.onDone?.()
        return
      }

      try {
        const data = JSON.parse(dataStr)

        // 1. Error Event
        if (eventName === 'error' || data.event === 'error' || data.code === 'agent_failure' || data.code === 'cancelled') {
          callbacks.onError?.(new Error(data.message || data.code || 'Lỗi xử lý từ hệ thống'))
          return
        }

        // 2. Planning & CoT Reasoning Events
        if (eventName === 'agent.plan' || eventName === 'agent.thinking' || data.event === 'thinking') {
          if (data.status === 'started') {
            callbacks.onThinkingChunk?.('Đang phân tích câu hỏi và lập kế hoạch truy vấn...\n')
          } else if (data.plan) {
            callbacks.onThinkingChunk?.(data.plan + '\n')
            callbacks.onThinkingDone?.()
          } else if (data.content) {
            callbacks.onThinkingChunk?.(data.content)
          }
          return
        }

        // 3. Vector Retrieval / Search Visualizer Event
        if (eventName === 'agent.retrieval' || eventName === 'agent.search') {
          const hitTitle = data.title || data.file_name || 'Tra cứu Qdrant'
          const pageInfo = data.page_number ? ` (Trang ${data.page_number})` : ''
          const scoreInfo = data.score !== undefined ? ` [Score: ${(Number(data.score) * 100).toFixed(0)}%]` : ''
          const fullTitle = `🔍 ${hitTitle}${pageInfo}${scoreInfo}`
          const outputSnippet = data.snippet || data.content || data.output || 'Đã đối soát khớp đoạn trích liên quan.'

          callbacks.onStepUpdate?.({
            id: `step-retrieval-${data.id || Date.now()}`,
            title: fullTitle,
            type: 'search',
            output: outputSnippet,
            status: 'ok',
          })
          return
        }

        // 4. Code Generation / Reasoner Event
        if (eventName === 'agent.code') {
          const isDone = data.status === 'completed'
          callbacks.onStepUpdate?.({
            id: `step-code-${data.message_id || 'code'}`,
            title: 'Search-as-Code (Python Script)',
            type: 'terminal',
            output: data.code ? `\`\`\`python\n${data.code}\n\`\`\`` : 'Đang khởi tạo mã lệnh truy vấn...',
            status: isDone ? 'ok' : 'running',
          })
          return
        }

        // 5. Sandbox Execution Output Event
        if (eventName === 'agent.sandbox_output' || eventName === 'agent.executing') {
          const stdoutText = data.stdout ? `STDOUT:\n${data.stdout}` : ''
          const stderrText = data.stderr ? `STDERR:\n${data.stderr}` : ''
          const combinedOutput = [stdoutText, stderrText].filter(Boolean).join('\n\n') || 'Thực thi thành công (Exit Code 0)'
          const exitCode = data.exit_code ?? 0
          const dur = data.duration_ms ? ` (${data.duration_ms}ms)` : ''

          callbacks.onStepUpdate?.({
            id: `step-exec-${data.message_id || 'exec'}`,
            title: `Thực thi Sandbox${dur}`,
            type: 'terminal',
            output: combinedOutput,
            status: exitCode === 0 ? 'ok' : 'error',
          })
          return
        }

        // 6. Debugging / Self-Correction Event
        if (eventName === 'agent.debugging' || eventName === 'agent.validating_citations') {
          const retryCount = data.retry_count || 1
          const errMsg = data.error || 'Đối soát trích dẫn...'
          callbacks.onThinkingChunk?.(`\n[Đối soát chất lượng #${retryCount}]: ${errMsg}\n`)
          return
        }

        // 7. Produced Files Event
        if (eventName === 'agent.produced_files' || data.produced_files) {
          const files = data.files || data.produced_files || []
          callbacks.onProducedFiles?.(files)
          return
        }

        // 8. Token Streaming: message.delta or delta
        if (eventName === 'message.delta' || eventName === 'delta' || (!eventName && data.content && !data.citations)) {
          const contentDelta: string = data.content ?? data.choices?.[0]?.delta?.content ?? ''

          if (contentDelta) {
            if (contentDelta.includes('<think>')) {
              inThinkTag = true
              const parts = contentDelta.split('<think>')
              if (parts[0]) callbacks.onContentChunk?.(parts[0])
              if (parts[1]) callbacks.onThinkingChunk?.(parts[1])
            } else if (contentDelta.includes('</think>')) {
              inThinkTag = false
              const parts = contentDelta.split('</think>')
              if (parts[0]) callbacks.onThinkingChunk?.(parts[0])
              callbacks.onThinkingDone?.()
              if (parts[1]) callbacks.onContentChunk?.(parts[1])
            } else if (inThinkTag) {
              callbacks.onThinkingChunk?.(contentDelta)
            } else {
              callbacks.onContentChunk?.(contentDelta)
            }
          } else if (data.choices?.[0]?.delta?.reasoning_content) {
            callbacks.onThinkingChunk?.(data.choices[0].delta.reasoning_content)
          }
          return
        }

        // 9. Completion Event: message.done
        if (eventName === 'message.done' || data.event === 'message.done' || (data.content && data.citations !== undefined)) {
          callbacks.onThinkingDone?.()
          
          const stats: MessageStats = {
            durationMs: data.duration_ms,
            tokens: data.prompt_tokens && data.completion_tokens
              ? data.prompt_tokens + data.completion_tokens
              : data.total_tokens || 0,
            tps: data.tps,
          }

          const rawCitations = data.citations || []
          const mappedCitations: CitationSource[] = rawCitations.map((c: any, idx: number) => ({
            index: idx + 1,
            documentId: c.document_id || c.id || '',
            fileName: c.title || c.file_name || `Nguồn [${idx + 1}]`,
            pageNumber: c.page_number || c.metadata?.page_number,
            score: c.score,
            snippet: c.content || c.snippet || '',
          }))

          callbacks.onDone?.(stats, mappedCitations, data.content)
          return
        }

        // Fallback for OpenAI direct stream
        if (data.choices?.[0]?.delta?.content) {
          callbacks.onContentChunk?.(data.choices[0].delta.content)
        } else if (data.content) {
          callbacks.onContentChunk?.(data.content)
        }
      } catch {
        // If string is raw text
        callbacks.onContentChunk?.(dataStr)
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) {
          if (currentDataStr) {
            processSseFrame(currentEventName, currentDataStr)
          }
          currentEventName = ''
          currentDataStr = ''
          continue
        }

        if (trimmed.startsWith(':')) continue

        if (trimmed.startsWith('event:')) {
          currentEventName = trimmed.slice(6).trim()
        } else if (trimmed.startsWith('data:')) {
          const d = trimmed.slice(5).trim()
          currentDataStr = currentDataStr ? `${currentDataStr}\n${d}` : d
        }
      }
    }

    if (currentDataStr) {
      processSseFrame(currentEventName, currentDataStr)
    }

    callbacks.onDone?.()
  } catch (error: any) {
    if (signal?.aborted) return
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}

// -------------------------------------------------------------
// Mock Helpers
// -------------------------------------------------------------

function createMockUserProfile(identifier: string): UserProfile {
  const username = identifier.includes('@') ? identifier.split('@')[0] : identifier
  return {
    id: 'usr-9a8b7c6d-5e4f-3a2b-1c0d-e1f2a3b4c5d6',
    email: identifier.includes('@') ? identifier : `${identifier}@deepseek.chat`,
    username,
    full_name: username.charAt(0).toUpperCase() + username.slice(1),
    avatar_url: null,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    metadata_: { role: 'developer', tier: 'pro' },
  }
}

function createMockTokenResponse(identifier: string): TokenResponse {
  return {
    access_token: `mock_jwt_access_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    refresh_token: `mock_jwt_refresh_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    token_type: 'bearer',
    expires_in_seconds: 604800,
    refresh_expires_in_seconds: 2419200,
    user: createMockUserProfile(identifier),
  }
}

async function runMockStreamingEngine(
  messages: ChatMessage[],
  _modelId: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const lastUserMsg = messages[messages.length - 1]?.content || ''

  const thinkingSnippets = [
    `Phân tích câu hỏi: "${lastUserMsg.slice(0, 30)}..."\n`,
    "Truy vấn tài liệu nguồn trong dự án Qdrant...\n",
    "Trích xuất văn bản và bảng biểu tương thích...\n",
    "Xây dựng câu trả lời kèm trích dẫn chính xác (Citations)...\n",
  ]

  for (const snippet of thinkingSnippets) {
    if (signal?.aborted) return
    for (const char of snippet) {
      if (signal?.aborted) return
      callbacks.onThinkingChunk?.(char)
      await new Promise(r => setTimeout(r, 10))
    }
    await new Promise(r => setTimeout(r, 60))
  }
  callbacks.onThinkingDone?.()

  const sampleStep: ToolStep = {
    id: 'step-rag',
    title: 'Vector Retrieval: Tìm thấy 3 đoạn văn bản liên quan trong Project',
    type: 'search',
    output: '✓ Document: Ke_hoach_kinh_doanh.pdf (Chunk #12, Score 0.94)\n✓ Document: Bao_cao_Q3.pdf (Chunk #4, Score 0.88)',
    status: 'ok',
  }
  callbacks.onStepUpdate?.(sampleStep)
  await new Promise(r => setTimeout(r, 150))

  const markdownResponse = `Dưới đây là câu trả lời được trích xuất từ tài liệu dự án của bạn:

### 1. Phân Tích Thông Tin
Dựa trên tài liệu bạn đã nạp vào **Dự án RAGFlash**, hệ thống đã tổng hợp được các thông tin quan trọng sau:

- **Nguồn tài liệu:** Đã đối soát chính xác với các chunks trong vector database.
- **Tốc độ xử lý:** 140 Tokens/s
- **Công thức tính toán liên quan:**
  $$RAG_{accuracy} = \\frac{\\text{Evidence Hits}}{\\text{Total Queries}} \\times 100\\%$$

### 2. Trích dẫn (Citations)
> [1] *Bao_cao_Q3.pdf - Trang 14, Đoạn 2:* Kế hoạch tăng trưởng đạt 125% so với cùng kỳ.

Bạn có thể tiếp tục hỏi thêm về các tài liệu khác trong dự án này!`

  for (let i = 0; i < markdownResponse.length; i += 2) {
    if (signal?.aborted) return
    const chunk = markdownResponse.slice(i, i + 2)
    callbacks.onContentChunk?.(chunk)
    await new Promise(r => setTimeout(r, 12))
  }

  callbacks.onDone?.()
}
