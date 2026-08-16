export interface ToolStep {
  id: string
  title: string
  type: 'terminal' | 'diff' | 'read' | 'search' | 'web'
  output: string
  status?: 'running' | 'ok' | 'error'
}

export interface AttachmentFile {
  id: string
  name: string
  size: number
  url: string
  type: string
}

export interface ProducedFile {
  id: string
  name: string
  path: string
  size?: string
}

export interface MessageStats {
  durationMs?: number
  tokens?: number
  tps?: number
}

export interface SessionStats {
  turns: number
  steps: number
  llmMs: number
  toolMs: number
  ttftMs: number
  ttftSteps: number
  decodeMs: number
  decodeTokens: number
  cacheReadTokens?: number
  uncachedInputTokens?: number
  cacheWriteTokens?: number
  outputTokens?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  isThinking?: boolean
  steps?: ToolStep[]
  attachments?: AttachmentFile[]
  producedFiles?: ProducedFile[]
  feedback?: 'like' | 'dislike' | null
  timestamp: number
  stats?: MessageStats
}

export interface WorkspaceFolder {
  id: string
  name: string
  path: string
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  projectId?: string | null
  workspaceId?: string | null
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  modelId: string
  isPlanMode?: boolean
  isArchived?: boolean
  stats?: SessionStats
}

export interface BackendChatSession {
  id: string
  user_id: string
  project_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface BackendChatSessionListResponse {
  items: BackendChatSession[]
  total: number
  page: number
  page_size: number
}

export interface BackendChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string | null
  tokens?: number
  created_at: string
}

export interface ModelOption {
  id: string
  name: string
  provider: string
  description?: string
  reasoningEnabled?: boolean
}

export interface AgentPreset {
  id: string
  name: string
  description: string
  systemPrompt: string
  icon?: string
}

export interface AppSettings {
  apiKey: string
  baseUrl: string
  defaultModel: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  language: 'vi' | 'en' | 'zh'
  enableWebSearch: boolean
  enableCodeExecution: boolean
  mcpServers: Array<{ name: string; url: string; enabled: boolean }>
}
