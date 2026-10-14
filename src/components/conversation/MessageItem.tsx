import { useState } from 'react'
import type { ChatMessage, ToolStep, CitationSource } from '@/types/chat'
import { ReasoningRow } from './ReasoningRow'
import { AssistantMarkdown } from '@/components/chat/AssistantMarkdown'
import {
  TerminalBlock, DiffBlock, ReadBlock, SearchBlock, WebBlock, DisclosureRow,
  IconCodeOutline16, IconBrowseOutline16, Tooltip
} from '@/components/ui'
import { MessageFeedbackActions } from '@/components/feedback/MessageFeedbackActions'
import { ProducedFiles } from '@/components/deliverables/ProducedFiles'
import { MessageImage } from '@/components/attachment/MessageImage'
import { MessageIconActions } from '@/components/chat/MessageIconActions'
import { StatsLine } from '@/components/chat/StatsLine'
import { DocumentPreviewModal } from '@/components/projects/DocumentPreviewModal'
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

export function MessageItem({
  message,
  isStreamingTail = false,
  onFeedback,
  onOpenImage,
}: MessageItemProps) {
  const isUser = message.role === 'user'
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(message.feedback || null)
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)

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
            <div className={css.bubble} data-role="user-bubble">
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

      {/* 4. Interactive Citations Strip */}
      {message.citations && message.citations.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--dsw-alias-label-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Nguồn trích dẫn đối soát ({message.citations.length})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {message.citations.map((c) => (
              <Tooltip
                key={c.index}
                label={c.snippet ? `"${c.snippet.slice(0, 180)}${c.snippet.length > 180 ? '...' : ''}"` : 'Xem chi tiết tài liệu'}
                delayMs={200}
              >
                <button
                  type="button"
                  onClick={() => c.documentId && setPreviewDocId(c.documentId)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--dsw-alias-border-subtle)',
                    background: 'var(--dsw-alias-surface-subtle)',
                    color: 'var(--dsw-alias-label-primary)',
                    fontSize: 12,
                    cursor: c.documentId ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--dsw-alias-brand-primary)'
                    e.currentTarget.style.background = 'var(--dsw-alias-surface-overlay)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--dsw-alias-border-subtle)'
                    e.currentTarget.style.background = 'var(--dsw-alias-surface-subtle)'
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: 'var(--dsw-alias-brand-subtle)',
                    color: 'var(--dsw-alias-brand-primary)',
                    fontSize: 10,
                    fontWeight: 700
                  }}>
                    {c.index}
                  </span>
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {c.fileName}
                  </span>
                  {c.pageNumber && (
                    <span style={{ color: 'var(--dsw-alias-label-tertiary)', fontSize: 11 }}>
                      Tr.{c.pageNumber}
                    </span>
                  )}
                  {c.score !== undefined && (
                    <span style={{ color: 'var(--dsw-alias-state-success-primary)', fontSize: 11, fontWeight: 600 }}>
                      {Math.round(c.score * 100)}%
                    </span>
                  )}
                  {c.documentId && (
                    <IconBrowseOutline16 size={12} style={{ color: 'var(--dsw-alias-label-tertiary)', marginLeft: 2 }} />
                  )}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* 5. Produced Artifacts / Files */}
      {message.producedFiles && message.producedFiles.length > 0 && (
        <ProducedFiles files={message.producedFiles} />
      )}

      {/* 6. Message Action Bar (Copy, Stats, Thumbs Up/Down) */}
      {!isStreamingTail && message.content && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <MessageIconActions text={message.content} time={message.timestamp} />
          <MessageFeedbackActions feedback={feedback} onFeedback={handleFeedback} />
        </div>
      )}

      {message.stats && !isStreamingTail && (
        <StatsLine stats={message.stats} />
      )}

      {/* Document Preview Modal on citation click */}
      <DocumentPreviewModal
        documentId={previewDocId}
        onClose={() => setPreviewDocId(null)}
      />
    </div>
  )
}
