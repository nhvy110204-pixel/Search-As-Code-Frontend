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

export interface ConversationRootProps {
  onOpenMobileSidebar?: () => void
  isMobile?: boolean
}

export function ConversationRoot({ onOpenMobileSidebar, isMobile = false }: ConversationRootProps) {
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
      <header className={clsx(css.header, isHero && !isMobile && css.headerHidden)}>
        {(!isHero || isMobile) && (
          <div className={css.titleRow}>
            <div className={css.titleCluster}>
              {isMobile && onOpenMobileSidebar && (
                <button
                  type="button"
                  className={css.mobileMenuButton}
                  onClick={onOpenMobileSidebar}
                  aria-label="Mở danh sách phiên"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              )}
              <nav className={css.crumbs} aria-label="Session title">
                <span className={css.crumbCurrent}>
                  {activeSession && !isHero ? activeSession.title : 'Cuộc trò chuyện mới'}
                </span>
              </nav>

              {!isHero && (
                <div className={css.headerActions}>
                  <AgentPresetLabel presetName={activePreset?.name || 'Standard mode'} />
                </div>
              )}
            </div>

            {!isHero && (
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
            )}
          </div>
        )}
      </header>

      {/* 2. Scroll Body & Views */}
      <div className={css.scrollBody}>
        {isHero ? (
          isMobile ? (
            /* Mobile Hero Layout: EmptyHero centered in middle, InputBar fixed at bottom */
            <>
              <div className={css.heroView}>
                <EmptyHero onOpenWorkspacePicker={() => setIsAddWsOpen(true)} />
              </div>
              <div className={css.composerSeat}>
                <InputBar
                  hero
                  isStreaming={isStreaming}
                  onSendMessage={sendMessage}
                  onStopStreaming={stopStreaming}
                />
              </div>
            </>
          ) : (
            /* Desktop Hero Layout: Original stacked hero (Headline + Chips + InputBar together) */
            <div className={css.composerHero}>
              <EmptyHero onOpenWorkspacePicker={() => setIsAddWsOpen(true)} />
              <InputBar
                hero
                isStreaming={isStreaming}
                onSendMessage={sendMessage}
                onStopStreaming={stopStreaming}
              />
            </div>
          )
        ) : (
          /* Active Chat Layout (Desktop & Mobile): ChatView on top, InputBar at bottom */
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
