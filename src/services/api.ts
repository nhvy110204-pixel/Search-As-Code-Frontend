import type { ChatMessage, ToolStep, ProducedFile, BackendChatSession, BackendChatSessionListResponse, BackendChatMessage } from '@/types/chat'
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
} from '@/types/project'
import { useAuthStore } from '@/store/useAuthStore'

export interface StreamCallbacks {
  onThinkingChunk?: (chunk: string) => void
  onThinkingDone?: () => void
  onContentChunk?: (chunk: string) => void
  onStepUpdate?: (step: ToolStep) => void
  onProducedFiles?: (files: ProducedFile[]) => void
  onDone?: () => void
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
      `Không thể kết nối đến máy chủ Backend (${API_BASE_URL}). Vui lòng đảm bảo Backend đã khởi động hoặc bật VITE_ENABLE_MOCK=true trong file .env.`
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
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}))
      throw new Error(extractApiErrorMessage(err, 'Xóa tài liệu thất bại'))
    }
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
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const lastMessage = messages[messages.length - 1]?.content || ''
    const targetSessionId = sessionId || '00000000-0000-0000-0000-000000000000'

    const response = await fetch(`${API_V1_URL}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: targetSessionId,
        message: lastMessage,
        client_request_id: `req-${Date.now()}`,
      }),
      signal,
    })

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

    while (true) {
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
          if (dataStr === '[DONE]') {
            callbacks.onDone?.()
            return
          }

          try {
            const data = JSON.parse(dataStr)
            
            // Server-Sent Events from SaC / LangGraph or OpenAI provider
            if (data.choices?.[0]?.delta?.reasoning_content) {
              callbacks.onThinkingChunk?.(data.choices[0].delta.reasoning_content)
            } else if (data.choices?.[0]?.delta?.content) {
              const contentDelta: string = data.choices[0].delta.content
              
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
            } else if (data.event === 'step' || data.type === 'step') {
              callbacks.onStepUpdate?.(data.data || data)
            } else if (data.event === 'thinking') {
              callbacks.onThinkingChunk?.(data.content || '')
            } else if (data.event === 'content' || data.content) {
              callbacks.onContentChunk?.(data.content)
            }
          } catch {
            callbacks.onContentChunk?.(dataStr)
          }
        }
      }
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
