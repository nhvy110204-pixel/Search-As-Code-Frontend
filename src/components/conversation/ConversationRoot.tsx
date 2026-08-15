import { useState } from 'react'
import clsx from 'clsx'
import { Download } from 'lucide-react'
import { Tooltip } from '@/components/ui'
import { useChatStore } from '@/store/useChatStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { EmptyHero } from './EmptyHero'
import { ChatView } from './ChatView'
import { InputBar } from './InputBar'
import { StatsLine } from './StatsLine'
import { AgentPresetLabel } from '@/components/agent-preset/AgentPresetLabel'
import { QuestionComposer } from '@/components/questions/QuestionComposer'
import { PlanReviewPanel } from '@/components/questions/PlanReviewPanel'
import { ApprovalPanel } from './ApprovalPanel'
import { ImageLightbox } from '@/components/attachment/ImageLightbox'
import { AddWorkspaceModal } from '@/components/layout/AddWorkspaceModal'
import css from './ConversationRoot.module.css'

export function ConversationRoot() {
  const {
    sessions,
    activeSessionId,
    isStreaming,
    sendMessage,
    stopStreaming,
    setMessageFeedback,
  } = useChatStore()

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [isAddWsOpen, setIsAddWsOpen] = useState(false)

  // Interactive takeover mock states
  const [pendingQuestions, setPendingQuestions] = useState<any[] | null>(null)
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState<{ reason: string; command?: string } | null>(null)

  const { getActivePreset } = useSettingsStore()
  const activePreset = getActivePreset()

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]
  const messages = activeSession?.messages || []
  const isHero = messages.length === 0

  const handleDownloadSessionLog = () => {
    if (!activeSession) return
    const blob = new Blob([JSON.stringify(activeSession, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${activeSession.id}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleQuestionSubmit = (answers: Record<string, string | string[]>) => {
    const formatted = Object.entries(answers)
      .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n')
    sendMessage(`Câu trả lời của tôi:\n${formatted}`)
    setPendingQuestions(null)
  }

  return (
    <div className={css.root} data-phase={isHero ? 'hero' : 'active'}>
      {/* 1. Official Header */}
      <header className={clsx(css.header, isHero && css.headerHidden)}>
        {!isHero && (
          <div className={css.titleRow}>
            <div className={css.titleCluster}>
              <nav className={css.crumbs} aria-label="Session title">
                <span className={css.crumbCurrent}>
                  {activeSession ? activeSession.title : 'Cuộc trò chuyện mới'}
                </span>
              </nav>

              <div className={css.headerActions}>
                <AgentPresetLabel presetName={activePreset?.name || 'Standard mode'} />
              </div>
            </div>

            <div className={css.headerUtilities}>
              <Tooltip label="Tải xuống toàn bộ nhật ký phiên (Session log)" delayMs={300}>
                <button
                  type="button"
                  className={css.sessionLogButton}
                  onClick={handleDownloadSessionLog}
                  aria-label="Tải xuống nhật ký phiên"
                >
                  <span>Session log</span>
                  <Download size={13} />
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </header>

      {/* 2. Scroll Body & Views */}
      <div className={css.scrollBody}>
        {isHero ? (
          <div className={css.composerHero}>
            <EmptyHero onOpenWorkspacePicker={() => setIsAddWsOpen(true)} />
            <InputBar
              hero
              isStreaming={isStreaming}
              onSendMessage={sendMessage}
              onStopStreaming={stopStreaming}
            />
          </div>
        ) : (
          <>
            <div className={css.viewArea}>
              <ChatView
                messages={messages}
                isStreaming={isStreaming}
                onFeedback={setMessageFeedback}
                onOpenImage={(url) => setLightboxUrl(url)}
              />
            </div>

            <div className={css.composerSeat}>
              {pendingQuestions ? (
                <QuestionComposer
                  questions={pendingQuestions}
                  onSubmit={handleQuestionSubmit}
                  onSkip={() => setPendingQuestions(null)}
                />
              ) : pendingPlan ? (
                <PlanReviewPanel
                  planContent={pendingPlan}
                  onApprove={() => {
                    sendMessage('Tôi đồng ý phê duyệt kế hoạch này. Hãy tiến hành thực hiện.')
                    setPendingPlan(null)
                  }}
                  onReject={() => {
                    sendMessage('Tôi từ chối kế hoạch này. Hãy điều chỉnh lại.')
                    setPendingPlan(null)
                  }}
                />
              ) : pendingApproval ? (
                <ApprovalPanel
                  reason={pendingApproval.reason}
                  command={pendingApproval.command}
                  onAllow={() => {
                    sendMessage('Đã cho phép thực thi lệnh.')
                    setPendingApproval(null)
                  }}
                  onReject={() => {
                    sendMessage('Đã từ chối thực thi lệnh.')
                    setPendingApproval(null)
                  }}
                />
              ) : (
                <>
                  <InputBar
                    isStreaming={isStreaming}
                    onSendMessage={sendMessage}
                    onStopStreaming={stopStreaming}
                  />
                  <StatsLine stats={activeSession?.stats} />
                </>
              )}
            </div>
          </>
        )}
      </div>

      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      <AddWorkspaceModal open={isAddWsOpen} onClose={() => setIsAddWsOpen(false)} />
    </div>
  )
}
