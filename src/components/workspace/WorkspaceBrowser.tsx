import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import {
  Button, IconCloseOutline16, IconSearchOutline16, Modal, Tooltip
} from '@/components/ui'
import { useChatStore } from '@/store/useChatStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useViewStore } from '@/store/useViewStore'
import { SessionRow } from './Rows'
import type { ChatSession } from '@/types/chat'
import css from './WorkspaceBrowser.module.css'

export interface WorkspaceBrowserProps {
  wide?: boolean
  onOpenAddWorkspace?: () => void
}

export function WorkspaceBrowser({ wide = true }: WorkspaceBrowserProps) {
  const {
    sessions,
    activeSessionId,
    selectSession,
    newSession,
    deleteSession,
    forkSession,
    archiveSession,
    updateSessionTitle,
    fetchSessionsForProject,
  } = useChatStore()

  const { activeProjectId } = useProjectStore()
  const { navigateToChat } = useViewStore()

  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)

  // Dialog targets
  const [renameSessionTarget, setRenameSessionTarget] = useState<ChatSession | null>(null)
  const [renameSessionDraft, setRenameSessionDraft] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeProjectId) {
      fetchSessionsForProject(activeProjectId)
    }
  }, [activeProjectId, fetchSessionsForProject])

  const handleStartSearch = () => {
    setSearchExpanded(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchExpanded(false)
  }

  // Filter sessions: only show sessions of active project (or unassigned if no active project)
  const projectSessions = activeProjectId
    ? sessions.filter((s) => s.projectId === activeProjectId && !s.isArchived)
    : sessions.filter((s) => !s.isArchived)

  const filteredSessions = projectSessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId)
    navigateToChat()
  }

  if (!wide) {
    return (
      <div className={clsx(css.root, css.rail)}>
        <div className={css.sectionHeader}>
          <div className={css.headerActions}>
            <Tooltip label="Tìm kiếm hội thoại" delayMs={500}>
              <button
                type="button"
                className={css.iconButton}
                onClick={handleStartSearch}
                aria-label="Tìm kiếm"
              >
                <IconSearchOutline16 size={18} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={css.root}>
      {/* 1. Section Header: Title "Gần đây" + Expandable Search */}
      <div className={css.sectionHeader}>
        <span className={clsx(css.sectionLabel, searchExpanded && css.sectionLabelHidden)}>
          Gần đây
        </span>

        <div className={clsx(css.searchSlot, searchExpanded && css.searchSlotExpanded)}>
          <div className={clsx(css.search, searchExpanded && css.searchExpanded)}>
            <button
              type="button"
              className={css.searchButton}
              onClick={searchExpanded ? undefined : handleStartSearch}
              aria-label="Tìm kiếm hội thoại"
            >
              <IconSearchOutline16 size={16} />
            </button>

            <input
              ref={searchInputRef}
              type="text"
              className={css.searchInput}
              placeholder="Tìm kiếm hội thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleClearSearch()
              }}
            />

            {searchExpanded && (
              <button
                type="button"
                className={css.clearButton}
                onClick={handleClearSearch}
                aria-label="Xóa tìm kiếm"
              >
                <IconCloseOutline16 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Scrolling Tree / List Area */}
      <div className={css.treeBody}>
        <div className={css.list}>
          {searchQuery.trim() ? (
            <div className={css.flatList}>
              <div className={css.searchStatus}>
                Kết quả ({filteredSessions.length})
              </div>
              {filteredSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  selected={session.id === activeSessionId}
                  isEditing={editingSessionId === session.id}
                  onSelect={() => handleSelectSession(session.id)}
                  onRename={() => {
                    setRenameSessionTarget(session)
                    setRenameSessionDraft(session.title)
                  }}
                  onFork={() => forkSession(session.id)}
                  onArchive={() => archiveSession(session.id)}
                  onDelete={() => deleteSession(session.id)}
                  onSaveRename={(title) => {
                    updateSessionTitle(session.id, title)
                    setEditingSessionId(null)
                  }}
                  onCancelRename={() => setEditingSessionId(null)}
                />
              ))}
            </div>
          ) : (
            <div className={css.flatList}>
              {filteredSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  selected={session.id === activeSessionId}
                  isEditing={editingSessionId === session.id}
                  onSelect={() => handleSelectSession(session.id)}
                  onRename={() => {
                    setRenameSessionTarget(session)
                    setRenameSessionDraft(session.title)
                  }}
                  onFork={() => forkSession(session.id)}
                  onArchive={() => archiveSession(session.id)}
                  onDelete={() => deleteSession(session.id)}
                  onSaveRename={(title) => {
                    updateSessionTitle(session.id, title)
                    setEditingSessionId(null)
                  }}
                  onCancelRename={() => setEditingSessionId(null)}
                />
              ))}

              {filteredSessions.length === 0 && (
                <div className={css.empty}>
                  <p style={{ margin: '8px 0 12px', fontSize: 13, color: 'var(--dsw-alias-label-tertiary)' }}>
                    Chưa có cuộc trò chuyện nào trong dự án này
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Fade Gradient */}
        <div className={css.fade} />
      </div>

      {/* Rename Session Modal */}
      <Modal
        open={renameSessionTarget !== null}
        onClose={() => setRenameSessionTarget(null)}
        closeLabel="Đóng"
        title="Đổi tên phiên trò chuyện"
        footer={(
          <>
            <Button variant="outline" onClick={() => setRenameSessionTarget(null)}>Hủy</Button>
            <Button
              variant="primary"
              disabled={!renameSessionDraft.trim()}
              onClick={() => {
                if (renameSessionTarget && renameSessionDraft.trim()) {
                  updateSessionTitle(renameSessionTarget.id, renameSessionDraft.trim())
                  setRenameSessionTarget(null)
                }
              }}
            >
              Lưu thay đổi
            </Button>
          </>
        )}
      >
        <input
          className={css.renameInput}
          value={renameSessionDraft}
          autoFocus
          onFocus={(e) => e.target.select()}
          onChange={(e) => setRenameSessionDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && renameSessionDraft.trim() && renameSessionTarget) {
              e.preventDefault()
              updateSessionTitle(renameSessionTarget.id, renameSessionDraft.trim())
              setRenameSessionTarget(null)
            }
          }}
        />
      </Modal>
    </div>
  )
}
