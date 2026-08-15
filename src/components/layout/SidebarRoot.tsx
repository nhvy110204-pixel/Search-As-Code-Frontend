import { useState } from 'react'
import {
  Plus, PanelLeft, Search, Trash2, Edit2, MessageSquare,
  Moon, Sun, Settings, FolderPlus, GitFork, Archive, Folder
} from 'lucide-react'
import { useChatStore } from '@/store/useChatStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { FishLogo } from '@/components/ui/FishLogo'
import { Tooltip } from '@/components/ui/Tooltip'
import { AddWorkspaceModal } from './AddWorkspaceModal'
import css from './SidebarRoot.module.css'

export interface SidebarRootProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function SidebarRoot({ collapsed, onToggleCollapse }: SidebarRootProps) {
  const {
    sessions,
    workspaces,
    activeSessionId,
    activeWorkspaceId,
    newSession,
    selectSession,
    deleteSession,
    forkSession,
    archiveSession,
    updateSessionTitle,
    setActiveWorkspace,
  } = useChatStore()

  const { isDark, toggleTheme } = useThemeStore()
  const { openSettings } = useSettingsStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitleText, setEditTitleText] = useState('')
  const [isAddWsOpen, setIsAddWsOpen] = useState(false)

  // Filter sessions by active workspace and search query
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesWs = activeWorkspaceId === null || s.workspaceId === activeWorkspaceId
    return matchesSearch && matchesWs && !s.isArchived
  })

  const archivedSessions = sessions.filter((s) => s.isArchived && s.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleStartRename = (s: { id: string; title: string }, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(s.id)
    setEditTitleText(s.title)
  }

  const handleSaveRename = (id: string) => {
    if (editTitleText.trim()) {
      updateSessionTitle(id, editTitleText.trim())
    }
    setEditingId(null)
  }

  if (collapsed) {
    return (
      <aside className={css.root} data-collapsed="true" style={{ width: 56 }}>
        <Tooltip label="Mở rộng Sidebar" delayMs={300}>
          <button type="button" className={css.toggleBtn} onClick={onToggleCollapse} aria-label="Mở sidebar">
            <PanelLeft size={18} />
          </button>
        </Tooltip>

        <Tooltip label="Cuộc trò chuyện mới" delayMs={300}>
          <button
            type="button"
            className={css.newChatBtnCollapsed}
            onClick={() => newSession(activeWorkspaceId)}
            aria-label="Cuộc trò chuyện mới"
          >
            <Plus size={18} />
          </button>
        </Tooltip>

        <Tooltip label="Thêm Workspace" delayMs={300}>
          <button
            type="button"
            className={css.toggleBtn}
            onClick={() => setIsAddWsOpen(true)}
            aria-label="Thêm Workspace"
          >
            <FolderPlus size={18} />
          </button>
        </Tooltip>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Tooltip label="Cài đặt hệ thống" delayMs={300}>
            <button type="button" className={css.toggleBtn} onClick={() => openSettings('general')} aria-label="Cài đặt">
              <Settings size={18} />
            </button>
          </Tooltip>

          <Tooltip label={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'} delayMs={300}>
            <button type="button" className={css.toggleBtn} onClick={toggleTheme} aria-label="Đổi theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </Tooltip>
        </div>

        <AddWorkspaceModal open={isAddWsOpen} onClose={() => setIsAddWsOpen(false)} />
      </aside>
    )
  }

  return (
    <aside className={css.root} style={{ width: 260 }}>
      {/* 1. Header (Logo & Collapse toggle) */}
      <div className={css.header}>
        <button type="button" className={css.brand} onClick={() => newSession()}>
          <FishLogo size={22} />
          <span>DeepSeek Chat</span>
        </button>
        <Tooltip label="Thu gọn Sidebar" delayMs={300}>
          <button type="button" className={css.toggleBtn} onClick={onToggleCollapse} aria-label="Thu gọn sidebar">
            <PanelLeft size={18} />
          </button>
        </Tooltip>
      </div>

      {/* 2. Action Buttons (New Chat + Add Workspace) */}
      <div className={css.actionRow}>
        <button type="button" className={css.newChatBtn} onClick={() => newSession(activeWorkspaceId)}>
          <Plus size={15} />
          <span>Cuộc trò chuyện mới</span>
        </button>

        <Tooltip label="Thêm Workspace mới" delayMs={300}>
          <button type="button" className={css.addWsBtn} onClick={() => setIsAddWsOpen(true)} aria-label="Thêm Workspace">
            <FolderPlus size={16} />
          </button>
        </Tooltip>
      </div>

      {/* 3. Workspace Filters */}
      {workspaces.length > 0 && (
        <div className={css.workspaceFilter}>
          <button
            type="button"
            className={css.wsChip}
            data-active={activeWorkspaceId === null}
            onClick={() => setActiveWorkspace(null)}
          >
            Tất cả ({sessions.filter((s) => !s.isArchived).length})
          </button>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              className={css.wsChip}
              data-active={activeWorkspaceId === ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
            >
              <Folder size={11} />
              <span>{ws.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Search Filter */}
      <div className={css.searchBox}>
        <Search size={14} />
        <input
          type="text"
          className={css.searchInput}
          placeholder="Tìm kiếm hội thoại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 5. Session List with Groups and Context Actions */}
      <div className={css.sessionList}>
        <div className={css.sectionHeader}>Gần đây</div>
        {filteredSessions.map((session) => {
          const isActive = session.id === activeSessionId
          const isEditing = editingId === session.id

          return (
            <div
              key={session.id}
              className={css.sessionItem}
              data-active={isActive}
              onClick={() => selectSession(session.id)}
            >
              <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.7, marginRight: 8 }} />

              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  className={css.searchInput}
                  value={editTitleText}
                  onChange={(e) => setEditTitleText(e.target.value)}
                  onBlur={() => handleSaveRename(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(session.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={css.sessionTitle}>{session.title}</span>
              )}

              <div className={css.sessionActions}>
                <Tooltip label="Đổi tên" delayMs={400}>
                  <button
                    type="button"
                    className={css.actionBtn}
                    onClick={(e) => handleStartRename(session, e)}
                    aria-label="Đổi tên"
                  >
                    <Edit2 size={12} />
                  </button>
                </Tooltip>
                <Tooltip label="Tạo nhánh trò chuyện (Fork)" delayMs={400}>
                  <button
                    type="button"
                    className={css.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      forkSession(session.id)
                    }}
                    aria-label="Fork"
                  >
                    <GitFork size={12} />
                  </button>
                </Tooltip>
                <Tooltip label="Lưu trữ" delayMs={400}>
                  <button
                    type="button"
                    className={css.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      archiveSession(session.id)
                    }}
                    aria-label="Lưu trữ"
                  >
                    <Archive size={12} />
                  </button>
                </Tooltip>
                <Tooltip label="Xóa" delayMs={400}>
                  <button
                    type="button"
                    className={`${css.actionBtn} ${css.actionBtnDanger}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.id)
                    }}
                    aria-label="Xóa"
                  >
                    <Trash2 size={12} />
                  </button>
                </Tooltip>
              </div>
            </div>
          )
        })}

        {/* Archived Section (if any) */}
        {archivedSessions.length > 0 && (
          <>
            <div className={css.sectionHeader}>Đã lưu trữ ({archivedSessions.length})</div>
            {archivedSessions.map((session) => (
              <div
                key={session.id}
                className={css.sessionItem}
                data-active={session.id === activeSessionId}
                onClick={() => selectSession(session.id)}
              >
                <Archive size={14} style={{ flexShrink: 0, opacity: 0.6, marginRight: 8 }} />
                <span className={css.sessionTitle}>{session.title}</span>
                <div className={css.sessionActions}>
                  <Tooltip label="Bỏ lưu trữ">
                    <button
                      type="button"
                      className={css.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        archiveSession(session.id)
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 6. Footer (Settings Modal trigger + Theme toggle) */}
      <div className={css.footer}>
        <button
          type="button"
          className={css.settingsTriggerBtn}
          onClick={() => openSettings('general')}
        >
          <Settings size={16} />
          <span>Cài đặt</span>
        </button>

        <Tooltip label={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'} delayMs={300}>
          <button type="button" className={css.toggleBtn} onClick={toggleTheme} aria-label="Đổi theme">
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </Tooltip>
      </div>

      <AddWorkspaceModal open={isAddWsOpen} onClose={() => setIsAddWsOpen(false)} />
    </aside>
  )
}
