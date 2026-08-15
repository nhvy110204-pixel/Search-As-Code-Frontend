import { useState, useRef } from 'react'
import clsx from 'clsx'
import { FolderPlus } from 'lucide-react'
import {
  Button, IconCloseOutline16, IconSearchOutline16, Modal, Tooltip
} from '@/components/ui'
import { useChatStore } from '@/store/useChatStore'
import { ProjectRow, SessionRow } from './Rows'
import type { WorkspaceFolder, ChatSession } from '@/types/chat'
import css from './WorkspaceBrowser.module.css'

export interface WorkspaceBrowserProps {
  wide?: boolean
  onOpenAddWorkspace: () => void
}

export function WorkspaceBrowser({ wide = true, onOpenAddWorkspace }: WorkspaceBrowserProps) {
  const {
    sessions,
    workspaces,
    activeSessionId,
    activeWorkspaceId,
    selectSession,
    newSession,
    deleteSession,
    forkSession,
    archiveSession,
    updateSessionTitle,
    deleteWorkspace,
  } = useChatStore()

  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Record<string, boolean>>({})

  // Dialog targets
  const [deleteWsTarget, setDeleteWsTarget] = useState<WorkspaceFolder | null>(null)
  const [renameWsTarget, setRenameWsTarget] = useState<WorkspaceFolder | null>(null)
  const [renameWsDraft, setRenameWsDraft] = useState('')

  const [renameSessionTarget, setRenameSessionTarget] = useState<ChatSession | null>(null)
  const [renameSessionDraft, setRenameSessionDraft] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)

  const toggleWorkspace = (id: string) => {
    setCollapsedWorkspaces((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleStartSearch = () => {
    setSearchExpanded(true)
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchExpanded(false)
  }

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

            <Tooltip label="Thêm thư mục làm việc" delayMs={500}>
              <button
                type="button"
                className={css.iconButton}
                onClick={onOpenAddWorkspace}
                aria-label="Thêm thư mục"
              >
                <FolderPlus size={18} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={css.root}>
      {/* 1. Section Header: Title + Expandable Search + Add Workspace Action */}
      <div className={css.sectionHeader}>
        <span className={clsx(css.sectionLabel, searchExpanded && css.sectionLabelHidden)}>
          Hội thoại
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

        <div className={clsx(css.headerActions, searchExpanded && css.headerActionsHidden)}>
          <Tooltip label="Thêm thư mục làm việc..." delayMs={500}>
            <button
              type="button"
              className={css.iconButton}
              onClick={onOpenAddWorkspace}
              aria-label="Thêm thư mục"
            >
              <FolderPlus size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 2. Scrolling Tree / List Area */}
      <div className={css.treeBody}>
        <div className={css.list}>
          {searchQuery.trim() ? (
            <div className={css.flatList}>
              <div className={css.searchStatus}>
                Kết quả tìm kiếm cho "{searchQuery}" ({filteredSessions.length})
              </div>
              {filteredSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  selected={session.id === activeSessionId}
                  isEditing={editingSessionId === session.id}
                  onSelect={() => selectSession(session.id)}
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
            <div className={css.groupSection}>
              {/* Workspace Folders */}
              {workspaces.map((ws) => {
                const wsSessions = sessions.filter((s) => s.workspaceId === ws.id && !s.isArchived)
                const isOpen = !collapsedWorkspaces[ws.id]
                const isFolderActive = wsSessions.some((s) => s.id === activeSessionId) || activeWorkspaceId === ws.id

                return (
                  <div key={ws.id} style={{ marginBottom: 4 }}>
                    <ProjectRow
                      workspace={ws}
                      sessionCount={wsSessions.length}
                      open={isOpen}
                      active={isFolderActive}
                      onToggle={() => toggleWorkspace(ws.id)}
                      onSelect={() => {}}
                      onNewSession={() => newSession(ws.id)}
                      onDelete={() => setDeleteWsTarget(ws)}
                    />

                    {isOpen && (
                      <div style={{ paddingLeft: 14 }}>
                        {wsSessions.map((session) => (
                          <SessionRow
                            key={session.id}
                            session={session}
                            selected={session.id === activeSessionId}
                            isEditing={editingSessionId === session.id}
                            onSelect={() => selectSession(session.id)}
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
                    )}
                  </div>
                )
              })}

              {/* Ungrouped Sessions */}
              {sessions
                .filter((s) => !s.workspaceId && !s.isArchived)
                .map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    selected={session.id === activeSessionId}
                    isEditing={editingSessionId === session.id}
                    onSelect={() => selectSession(session.id)}
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

              {sessions.length === 0 && (
                <div className={css.empty}>Chưa có cuộc trò chuyện nào</div>
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

      {/* Delete Workspace Modal */}
      <Modal
        open={deleteWsTarget !== null}
        onClose={() => setDeleteWsTarget(null)}
        closeLabel="Đóng"
        title="Xóa thư mục làm việc"
        description={deleteWsTarget ? `Bạn có chắc chắn muốn xóa thư mục "${deleteWsTarget.name}" và toàn bộ phiên liên kết?` : undefined}
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeleteWsTarget(null)}>Hủy</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteWsTarget) {
                  deleteWorkspace(deleteWsTarget.id)
                  setDeleteWsTarget(null)
                }
              }}
            >
              Xóa thư mục
            </Button>
          </>
        )}
      >
        <div style={{ fontSize: 13, color: 'var(--dsw-alias-label-tertiary)' }}>
          Hành động này sẽ xóa cấu hình thư mục làm việc khỏi danh sách thanh bên.
        </div>
      </Modal>
    </div>
  )
}
