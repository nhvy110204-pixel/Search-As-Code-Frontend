import type { ChatMessage, ToolStep, ProducedFile } from '@/types/chat'
import type { UserProfile, TokenResponse, LoginCredentials, RegisterData, UserUpdateRequest } from '@/types/auth'
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
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
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
  /**
   * User Login (Email / Username + Password)
   */
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

  /**
   * User Registration
   */
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

  /**
   * Refresh JWT Tokens
   */
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

  /**
   * Get Current Authenticated User Profile
   */
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
  /**
   * Update User Profile
   */
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
// Chat Streaming API
// -------------------------------------------------------------

/**
 * Send chat message and handle streaming updates with Bearer Token
 */
export async function streamChatMessage(
  messages: ChatMessage[],
  modelId: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
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
    const response = await fetch(`${API_V1_URL}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session_id: '00000000-0000-0000-0000-000000000000',
        message: lastMessage,
        model: modelId,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      if (response.status === 401) {
        useAuthStore.getState().openLoginModal()
        throw new Error('Vui lòng đăng nhập để gửi tin nhắn')
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
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
            
            // DeepSeek format / OpenAI reasoning format
            if (data.choices?.[0]?.delta?.reasoning_content) {
              callbacks.onThinkingChunk?.(data.choices[0].delta.reasoning_content)
            } else if (data.choices?.[0]?.delta?.content) {
              const contentDelta: string = data.choices[0].delta.content
              
              // Handle <think> tags if model emits them in content
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
            }
          } catch {
            // plain text fallback
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
    expires_in_seconds: 604800, // 7 days
    refresh_expires_in_seconds: 2419200, // 28 days
    user: createMockUserProfile(identifier),
  }
}

/**
 * Realistic Mock Engine for demonstration and testing of Thinking + Markdown + Steps
 */
async function runMockStreamingEngine(
  messages: ChatMessage[],
  _modelId: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const lastUserMsg = messages[messages.length - 1]?.content || ''
  
  const thinkingSnippets = [
    `Analyzing user prompt: "${lastUserMsg.slice(0, 30)}..."\n`,
    "Deconstructing requirements into architectural components...\n",
    "Checking UI tokens and CSS Module bindings...\n",
    "Formulating reasoning chain for optimal code response...\n",
    "Validating TypeScript types and Markdown syntax highlight requirements...\n",
    "Synthesis complete. Ready to output structured response.",
  ]

  // 1. Stream Thinking
  for (const snippet of thinkingSnippets) {
    if (signal?.aborted) return
    for (const char of snippet) {
      if (signal?.aborted) return
      callbacks.onThinkingChunk?.(char)
      await new Promise(r => setTimeout(r, 12))
    }
    await new Promise(r => setTimeout(r, 80))
  }
  callbacks.onThinkingDone?.()

  // 2. Stream a Step demonstration
  const sampleStep: ToolStep = {
    id: 'step-1',
    title: 'Executing Terminal Command: pnpm list --depth 0',
    type: 'terminal',
    output: '✓ @deepseek-ai/dsh-client-web v1.0.0\n✓ react v18.3.1\n✓ vite v6.0.1\nDone in 0.12s.',
    status: 'ok',
  }
  callbacks.onStepUpdate?.(sampleStep)
  await new Promise(r => setTimeout(r, 200))

  // 3. Stream Content Markdown
  const markdownResponse = `Dưới đây là kết quả xử lý cho yêu cầu của bạn:

### 1. Phân tích Giải pháp
Giao diện đã tích hợp đầy đủ **Thinking/Reasoning CoT**, các bước **Tool Steps**, và bộ render **Markdown** cao cấp.

- **Tốc độ phản hồi:** 120 Tokens/s
- **Hỗ trợ công thức Toán học (KaTeX):**
  $$E = mc^2 \\quad \\text{và} \\quad \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$

### 2. Ví dụ Code Block
\`\`\`typescript
import { useChatStore } from '@/store/useChatStore'

export function ChatButton() {
  const sendMessage = useChatStore((s) => s.sendMessage)
  return (
    <button onClick={() => sendMessage('Hello DeepSeek!')}>
      Gửi tin nhắn
    </button>
  )
}
\`\`\`

### 3. Bảng dữ liệu (Table)
| Thành phần | Trạng thái | Đánh giá |
| :--- | :--- | :--- |
| **Thinking CoT** | Hoàn thành | 100% Mượt mà |
| **Markdown & Code** | Hoàn thành | Chuẩn Highlight |
| **KaTeX Math** | Hoàn thành | Sắc nét |

Bạn có thể cấu hình \`VITE_ENABLE_MOCK=false\` trong file \`.env\` để kết nối trực tiếp với Backend FastAPI chuẩn Production!`

  for (let i = 0; i < markdownResponse.length; i += 2) {
    if (signal?.aborted) return
    const chunk = markdownResponse.slice(i, i + 2)
    callbacks.onContentChunk?.(chunk)
    await new Promise(r => setTimeout(r, 15))
  }

  // 4. Produced files demo
  callbacks.onProducedFiles?.([
    { id: 'f-1', name: 'auth-integration.md', path: '/src/artifacts/auth-integration.md', size: '2.4 KB' }
  ])

  callbacks.onDone?.()
}
