import type { ChatMessage, ToolStep, ProducedFile } from '@/types/chat'

export interface StreamCallbacks {
  onThinkingChunk?: (chunk: string) => void
  onThinkingDone?: () => void
  onContentChunk?: (chunk: string) => void
  onStepUpdate?: (step: ToolStep) => void
  onProducedFiles?: (files: ProducedFile[]) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const IS_MOCK = import.meta.env.VITE_ENABLE_MOCK !== 'false'

/**
 * Send chat message and handle streaming updates
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
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: modelId,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
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

Bạn có thể chỉnh sửa nội dung trong file \`src/services/api.ts\` để chuyển sang kết nối trực tiếp với Backend thật của mình bất cứ lúc nào!`

  for (let i = 0; i < markdownResponse.length; i += 2) {
    if (signal?.aborted) return
    const chunk = markdownResponse.slice(i, i + 2)
    callbacks.onContentChunk?.(chunk)
    await new Promise(r => setTimeout(r, 15))
  }

  // 4. Produced files demo
  callbacks.onProducedFiles?.([
    { id: 'f-1', name: 'chat-response.md', path: '/src/artifacts/chat-response.md', size: '1.4 KB' }
  ])

  callbacks.onDone?.()
}
