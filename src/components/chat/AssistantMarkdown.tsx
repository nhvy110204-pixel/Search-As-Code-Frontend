import { memo } from 'react'
import { MarkdownText } from '@/components/ui/markdown/MarkdownText'
import css from './AssistantMarkdown.module.css'

export interface AssistantMarkdownProps {
  content: string
  streaming?: boolean
  interrupted?: boolean
}

export const AssistantMarkdown = memo(function AssistantMarkdown({
  content,
  streaming = false,
  interrupted = false,
}: AssistantMarkdownProps) {
  if (!content && !streaming && !interrupted) return null

  return (
    <div className={css.root} data-streaming={streaming || undefined}>
      <div className={css.body}>
        <MarkdownText
          text={content || ''}
          streaming={streaming}
          codeLabels={{ copyLabel: 'Sao chép', copiedLabel: 'Đã sao chép' }}
        />
        {interrupted && <span className={css.stopped}>Đã dừng phản hồi</span>}
      </div>
    </div>
  )
})
