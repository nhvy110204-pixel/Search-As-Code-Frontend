import { useEffect, useRef, useState } from 'react'
import { Sparkles, ArrowDown, Code2, Cpu, FileQuestion, Lightbulb } from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { MessageItem } from './MessageItem'
import { ChatInput } from './ChatInput'
import { ImageLightbox } from '@/components/attachment/ImageLightbox'
import css from './ChatView.module.css'

const SUGGESTIONS = [
  {
    icon: Code2,
    title: 'Viết thuật toán & Code',
    desc: 'Tối ưu hóa hàm React & giải thích độ phức tạp thuật toán O(n)',
    prompt: 'Hãy viết một Custom Hook React useWebSocket có hỗ trợ auto reconnect và giải thích chi tiết.',
  },
  {
    icon: Cpu,
    title: 'Tư duy suy nghĩ sâu (CoT)',
    desc: 'Giải bài toán hóc búa với mô hình DeepSeek Reasoner',
    prompt: 'Giải bài toán: Một người có 3 giỏ táo, mỗi giỏ chứa số lượng táo khác nhau... Hãy suy nghĩ từng bước.',
  },
  {
    icon: Lightbulb,
    title: 'Lập kế hoạch kiến trúc',
    desc: 'Thiết kế hệ thống Microservices quy mô lớn',
    prompt: 'Hãy lập kế hoạch thiết kế hệ thống Chatbot phân tán với hàng triệu người dùng trực tuyến.',
  },
  {
    icon: FileQuestion,
    title: 'Giải đáp & Phân tích',
    desc: 'Phân tích tài liệu và trả lời câu hỏi phức tạp',
    prompt: 'So sánh chi tiết sự khác biệt giữa Server-Sent Events (SSE) và WebSocket.',
  },
]

export function ChatView() {
  const {
    sessions,
    activeSessionId,
    isStreaming,
    isPlanMode,
    sendMessage,
    stopStreaming,
    setMessageFeedback,
  } = useChatStore()

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]
  const messages = activeSession?.messages || []

  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Auto scroll to bottom on new content or streaming
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      })
    }
  }

  useEffect(() => {
    scrollToBottom(isStreaming ? 'auto' : 'smooth')
  }, [messages.length, isStreaming])

  // Also auto scroll when the last message's content/reasoning updates
  const lastMsg = messages[messages.length - 1]
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom('auto')
    }
  }, [lastMsg?.content, lastMsg?.reasoning, isStreaming])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    setShowScrollBottom(distanceToBottom > 120)
  }

  return (
    <div className={css.root}>
      <div ref={scrollRef} className={css.scrollArea} onScroll={handleScroll}>
        {messages.length === 0 ? (
          <div className={css.emptyState}>
            <div className={css.welcomeIcon}>
              <Sparkles size={28} />
            </div>
            <h2 className={css.welcomeTitle}>Tôi có thể giúp gì cho bạn hôm nay?</h2>
            <p className={css.welcomeSubtitle}>
              Hệ thống AI đa năng hỗ trợ tư duy suy nghĩ từng bước (**Thinking CoT**), thực thi các bước, và định dạng văn bản Markdown chuẩn đẹp.
            </p>

            <div className={css.suggestionsGrid}>
              {SUGGESTIONS.map((item, idx) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={idx}
                    type="button"
                    className={css.suggestionCard}
                    onClick={() => sendMessage(item.prompt)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconComponent size={16} style={{ color: 'var(--dsw-alias-brand-primary-new-colorprimary-new-color)' }} />
                      <span className={css.suggestionTitle}>{item.title}</span>
                    </div>
                    <span className={css.suggestionDesc}>{item.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className={css.messagesList}>
            {messages.map((msg, idx) => {
              const isLast = idx === messages.length - 1
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isStreamingTail={isLast && isStreaming}
                  onFeedback={(val) => setMessageFeedback(msg.id, val)}
                  onOpenImage={(url) => setLightboxUrl(url)}
                />
              )
            })}
          </div>
        )}
      </div>

      {showScrollBottom && (
        <button
          type="button"
          className={css.scrollBottomBtn}
          onClick={() => scrollToBottom('smooth')}
          aria-label="Cuộn xuống dưới cùng"
        >
          <ArrowDown size={16} />
        </button>
      )}

      <div className={css.composerContainer}>
        <ChatInput
          isStreaming={isStreaming}
          isPlanMode={isPlanMode}
          onSendMessage={sendMessage}
          onStopStreaming={stopStreaming}
        />
      </div>

      <ImageLightbox
        url={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  )
}
