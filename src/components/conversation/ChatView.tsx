import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import clsx from 'clsx'
import { IconChevronDownOutline14, Tooltip } from '@/components/ui'
import type { ChatMessage } from '@/types/chat'
import { MessageItem } from './MessageItem'
import css from './ChatView.module.css'

const FOLLOW_THRESHOLD = 48

export interface ChatViewProps {
  messages: ChatMessage[]
  isStreaming: boolean
  onFeedback: (messageId: string, val: 'like' | 'dislike' | null) => void
  onOpenImage?: (url: string) => void
}

export function ChatView({
  messages,
  isStreaming,
  onFeedback,
  onOpenImage,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const columnRef = useRef<HTMLDivElement | null>(null)
  const userScrolledUpRef = useRef(false)
  const [showToBottom, setShowToBottom] = useState(false)
  const lastMsgCountRef = useRef(0)

  // Scroll to absolute bottom function
  const toBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    })
    userScrolledUpRef.current = false
    setShowToBottom(false)
  }, [])

  // Smooth scroll to position the latest user message right against the top edge of the chat viewport
  const scrollToUserMessage = useCallback(() => {
    userScrolledUpRef.current = false
    setShowToBottom(false)

    setTimeout(() => {
      const scroller = scrollRef.current
      const column = columnRef.current
      if (!scroller || !column) return

      const userElements = column.querySelectorAll(`[data-role="user"]`)
      const lastUserEl = userElements[userElements.length - 1] as HTMLElement | undefined
      if (lastUserEl) {
        const scrollerRect = scroller.getBoundingClientRect()
        const userRect = lastUserEl.getBoundingClientRect()
        // Position user message right against the top edge of the chat view
        const targetTop = scroller.scrollTop + (userRect.top - scrollerRect.top) - 12
        scroller.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'smooth',
        })
      }
    }, 30)
  }, [])

  // Handle user manual mouse wheel interaction
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < -2) {
      // User scrolled UP -> pause auto-follow
      userScrolledUpRef.current = true
      setShowToBottom(true)
    } else if (e.deltaY > 2) {
      // User scrolled DOWN -> check if returned to bottom
      const el = scrollRef.current
      if (el) {
        const dist = el.scrollHeight - el.clientHeight - (el.scrollTop + e.deltaY)
        if (dist <= FOLLOW_THRESHOLD) {
          userScrolledUpRef.current = false
          setShowToBottom(false)
        }
      }
    }
  }, [])

  // Handle scroll event (tracks if user reached bottom)
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const dist = el.scrollHeight - el.clientHeight - el.scrollTop
    const isAtBottom = dist <= FOLLOW_THRESHOLD

    if (isAtBottom) {
      userScrolledUpRef.current = false
      setShowToBottom(false)
    } else if (userScrolledUpRef.current) {
      setShowToBottom(true)
    }
  }, [])

  // Auto-scroll follow logic during streaming (ONLY triggers when output extends past bottom)
  const autoScrollFollow = useCallback(() => {
    const scroller = scrollRef.current
    const column = columnRef.current
    if (!scroller || !column || userScrolledUpRef.current) return

    const lastAssistantTurn = column.querySelector(`.${css.activeAssistantTurn}`) as HTMLElement | null
    const assistantContent = lastAssistantTurn?.firstElementChild as HTMLElement | null || lastAssistantTurn

    if (assistantContent) {
      const contentRect = assistantContent.getBoundingClientRect()
      const scrollerRect = scroller.getBoundingClientRect()

      // Only scroll when the assistant text has grown to/past the bottom of the viewport
      if (contentRect.bottom > scrollerRect.bottom - 24) {
        scroller.scrollTo({
          top: scroller.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
  }, [])

  // ResizeObserver to continuously track DOM growth during streaming
  useEffect(() => {
    const column = columnRef.current
    if (!column || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      if (isStreaming) {
        autoScrollFollow()
      }
    })

    observer.observe(column)
    return () => observer.disconnect()
  }, [isStreaming, autoScrollFollow])

  // Trigger scroll when new message turn arrives
  useLayoutEffect(() => {
    const count = messages.length
    if (count === 0) return

    const isNewTurn = count !== lastMsgCountRef.current
    lastMsgCountRef.current = count

    if (isNewTurn) {
      if (isStreaming) {
        scrollToUserMessage()
      } else if (!userScrolledUpRef.current) {
        toBottom('auto')
      }
    }
  }, [messages.length, scrollToUserMessage, toBottom, isStreaming])

  // Continuous auto-scroll follow while streaming state updates
  const lastMsg = messages[messages.length - 1]
  useEffect(() => {
    if (isStreaming) {
      autoScrollFollow()
    }
  }, [lastMsg?.content, lastMsg?.reasoning, lastMsg?.steps, isStreaming, autoScrollFollow])

  // When streaming completes, smoothly seat the output at the natural bottom
  const prevStreamingRef = useRef(isStreaming)
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      if (!userScrolledUpRef.current) {
        toBottom('smooth')
      }
    }
    prevStreamingRef.current = isStreaming
  }, [isStreaming, toBottom])

  // Initial scroll on mount
  useEffect(() => {
    if (messages.length > 0) {
      if (isStreaming) {
        scrollToUserMessage()
      } else {
        toBottom('auto')
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={css.root}>
      <div
        ref={scrollRef}
        className={css.scroll}
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        <div ref={columnRef} className={css.column}>
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1
            const isLastAssistant = isLast && msg.role === 'assistant'
            return (
              <div
                key={msg.id}
                className={clsx(css.flowItem, isLastAssistant && isStreaming && css.activeAssistantTurn)}
                data-role={msg.role}
              >
                <MessageItem
                  message={msg}
                  isStreamingTail={isLast && isStreaming}
                  onFeedback={(val) => onFeedback(msg.id, val)}
                  onOpenImage={onOpenImage}
                />
              </div>
            )
          })}

          {isStreaming && (
            <div className={css.turnStatus}>
            
            </div>
          )}
        </div>
      </div>

      {showToBottom && (
        <div className={css.toBottomSlot}>
          <Tooltip label="Cuộn xuống cuối (Back to bottom)" side="top" delayMs={200}>
            <button
              type="button"
              className={css.toBottom}
              onClick={() => toBottom('smooth')}
              aria-label="Cuộn xuống cuối"
            >
              <IconChevronDownOutline14 size={14} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
