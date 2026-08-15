import { useState } from 'react'
import { Terminal } from 'lucide-react'
import type { ChatMessage, ToolStep } from '@/types/chat'
import { ReasoningRow } from './ReasoningRow'
import { AssistantMarkdown } from '@/components/chat/AssistantMarkdown'
import {
  TerminalBlock, DiffBlock, ReadBlock, SearchBlock, WebBlock, DisclosureRow,
} from '@/components/ui'
import { MessageFeedbackActions } from '@/components/feedback/MessageFeedbackActions'
import { ProducedFiles } from '@/components/deliverables/ProducedFiles'
import { MessageImage } from '@/components/attachment/MessageImage'
import { MessageIconActions } from '@/components/chat/MessageIconActions'
import { StatsLine } from '@/components/chat/StatsLine'
import css from './MessageItem.module.css'

export interface MessageItemProps {
  message: ChatMessage
  isStreamingTail?: boolean
  onFeedback?: (val: 'like' | 'dislike' | null) => void
  onOpenImage?: (url: string) => void
}

function renderStepBlock(step: ToolStep) {
  switch (step.type) {
    case 'terminal':
      return (
        <TerminalBlock
          key={step.id}
          command={step.title}
          output={step.output}
          running={step.status === 'running'}
          exitCode={step.status === 'error' ? 1 : 0}
        />
      )
    case 'diff':
      return (
        <DiffBlock
          key={step.id}
          diffs={[{ path: step.title, oldText: null, newText: step.output }]}
        />
      )
    case 'search':
      return (
        <SearchBlock
          key={step.id}
          kind="matches"
          truncated={false}
          total={1}
          files={[{ path: step.title || 'search-result', matches: [{ lineNumber: 1, line: step.output }] }]}
        />
      )
    case 'web':
      return (
        <WebBlock
          key={step.id}
          kind="fetch"
          url={step.title}
          statusCode={step.status === 'error' ? 500 : 200}
          truncated={false}
        />
      )
    case 'read':
      return (
        <ReadBlock
          key={step.id}
          label={step.title}
          lines={step.output.split('\n').map((text, idx) => ({ number: idx + 1, text }))}
          totalLines={step.output.split('\n').length}
        />
      )
    default:
      return (
        <DisclosureRow
          key={step.id}
          icon={<Terminal size={14} />}
          title={step.title}
          open={false}
          expandable
          onToggle={() => {}}
        >
          <pre style={{ padding: 8, fontSize: 12 }}>{step.output}</pre>
        </DisclosureRow>
      )
  }
}

export function MessageItem({
  message,
  isStreamingTail = false,
  onFeedback,
  onOpenImage,
}: MessageItemProps) {
  const isUser = message.role === 'user'
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(message.feedback || null)

  const handleFeedback = (val: 'like' | 'dislike' | null) => {
    setFeedback(val)
    onFeedback?.(val)
  }

  if (isUser) {
    return (
      <div className={css.userRow}>
        <div className={css.userStack}>
          {message.attachments && message.attachments.length > 0 && (
            <MessageImage
              attachments={message.attachments}
              onOpenLightbox={onOpenImage}
            />
          )}

          {message.content && (
            <div className={css.bubble}>
              {message.content}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {/* 1. Reasoning CoT disclosure row */}
      {(message.reasoning || (isStreamingTail && message.isThinking)) && (
        <ReasoningRow
          text={message.reasoning || ''}
          running={isStreamingTail && !!message.isThinking}
        />
      )}

      {/* 2. Tool Execution Steps */}
      {message.steps && message.steps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {message.steps.map(renderStepBlock)}
        </div>
      )}

      {/* 3. Assistant Markdown Content */}
      {message.content && (
        <AssistantMarkdown content={message.content} />
      )}

      {/* 4. Produced Artifacts / Files */}
      {message.producedFiles && message.producedFiles.length > 0 && (
        <ProducedFiles files={message.producedFiles} />
      )}

      {/* 5. Message Action Bar (Copy, Stats, Thumbs Up/Down) */}
      {!isStreamingTail && message.content && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <MessageIconActions text={message.content} time={message.timestamp} />
          <MessageFeedbackActions feedback={feedback} onFeedback={handleFeedback} />
        </div>
      )}

      {message.stats && !isStreamingTail && (
        <StatsLine stats={message.stats} />
      )}
    </div>
  )
}
