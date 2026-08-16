import { memo } from 'react'
import {
  IconSparkle16, IconCodeOutline16,
  DisclosureRow, TerminalBlock, DiffBlock, SearchBlock, WebBlock, ReadBlock
} from '@/components/ui'
import type { ChatMessage, ToolStep } from '@/types/chat'
import { ReasoningRow } from './ReasoningRow'
import { AssistantMarkdown } from './AssistantMarkdown'
import { MessageIconActions } from './MessageIconActions'
import { MessageFeedbackActions } from '@/components/feedback/MessageFeedbackActions'
import { ProducedFiles } from '@/components/deliverables/ProducedFiles'
import { MessageImage } from '@/components/attachment/MessageImage'
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
          icon={<IconCodeOutline16 size={14} />}
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

export const MessageItem = memo(function MessageItem({
  message,
  isStreamingTail = false,
  onFeedback,
  onOpenImage,
}: MessageItemProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className={css.root}>
        <div className={css.userRow}>
          <div className={css.userStack}>
            <MessageImage attachments={message.attachments} onOpenLightbox={onOpenImage} />
            {message.content && <div className={css.userBubble}>{message.content}</div>}
            <MessageIconActions text={message.content} time={message.timestamp} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={css.root}>
      <div className={css.assistantRow}>
        <div className={css.assistantHeader}>
          <div className={css.assistantAvatar}>
            <IconSparkle16 size={16} />
          </div>
          <span className={css.assistantName}>Trợ lý AI</span>
        </div>

        <div className={css.assistantBody}>
          {/* 1. CoT Thinking / Reasoning Collapsible */}
          {message.reasoning && (
            <ReasoningRow
              text={message.reasoning}
              running={isStreamingTail && message.isThinking}
            />
          )}

          {/* 2. Tool Execution Steps */}
          {message.steps && message.steps.length > 0 && (
            <div className={css.stepsContainer}>
              {message.steps.map((st) => renderStepBlock(st))}
            </div>
          )}

          {/* 3. Main Content Markdown */}
          <AssistantMarkdown
            content={message.content}
            streaming={isStreamingTail && !message.isThinking}
          />

          {/* 4. Produced Deliverables / Artifacts */}
          {message.producedFiles && message.producedFiles.length > 0 && (
            <ProducedFiles files={message.producedFiles} />
          )}

          {/* 5. Footer Actions (Copy, Stats, Feedback) */}
          {!isStreamingTail && message.content && (
            <div className={css.footerActions}>
              <MessageIconActions
                text={message.content}
                time={message.timestamp}
                stats={message.stats}
                extraActions={
                  onFeedback && (
                    <MessageFeedbackActions
                      feedback={message.feedback}
                      onFeedback={onFeedback}
                    />
                  )
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
