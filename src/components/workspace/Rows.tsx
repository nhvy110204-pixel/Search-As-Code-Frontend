import { useState, useRef } from 'react'
import clsx from 'clsx'
import {
  HoverCard, IconArchiveOutline20, IconBranchOutline16, IconEditOutline16,
  IconEllipsisOutline16, IconFolderClose16, IconFolderOpen16, IconPlusOutline16,
  IconTrashOutline16, IconTriangleRightFill14, Menu, Tooltip,
} from '@/components/ui'
import type { ChatSession, WorkspaceFolder } from '@/types/chat'
import css from './Rows.module.css'

export interface ProjectRowProps {
  workspace: WorkspaceFolder
  sessionCount: number
  open: boolean
  active: boolean
  onToggle: () => void
  onSelect: () => void
  onNewSession: () => void
  onDelete: () => void
}

export function ProjectRow({
  workspace,
  open,
  active,
  onToggle,
  onSelect,
  onNewSession,
  onDelete,
}: ProjectRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuAnchor = useRef<HTMLButtonElement>(null)

  const handleSelect = (id: string) => {
    setMenuOpen(false)
    if (id === 'new') onNewSession()
    if (id === 'delete') onDelete()
  }

  return (
    <div
      className={clsx(css.projectRow, menuOpen && css.menuOpen)}
      onClick={onToggle}
      role="treeitem"
      aria-expanded={open}
    >
      <span className={clsx(css.slot, css.chevron)}>
        <IconTriangleRightFill14
          className={clsx(css.arrow, open && css.arrowOpen)}
          size={10}
        />
      </span>

      <span className={clsx(css.slot, css.folder, active && css.folderActive)}>
        {open ? <IconFolderOpen16 size={16} /> : <IconFolderClose16 size={16} />}
      </span>

      <div className={css.projectText}>
        <Tooltip label={workspace.path} delayMs={300}>
          <span className={css.title}>
            {workspace.name}
          </span>
        </Tooltip>
      </div>

      <div className={css.rowActions} onClick={(e) => e.stopPropagation()}>
        <Tooltip label="Tạo phiên chat mới" delayMs={300}>
          <button
            type="button"
            className={css.iconButton}
            onClick={onNewSession}
            aria-label="Tạo phiên chat mới trong thư mục này"
          >
            <IconPlusOutline16 size={16} />
          </button>
        </Tooltip>

        <Menu
          open={menuOpen}
          portal={true}
          side="right"
          align="start"
          anchor={
            <Tooltip label="Tùy chọn thư mục" delayMs={300}>
              <button
                ref={menuAnchor}
                type="button"
                className={css.iconButton}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Tùy chọn thư mục"
              >
                <IconEllipsisOutline16 size={16} />
              </button>
            </Tooltip>
          }
          onClose={() => setMenuOpen(false)}
          onSelect={handleSelect}
          items={[
            {
              id: 'new',
              label: 'Phiên chat mới',
              icon: <IconPlusOutline16 size={14} />,
            },
            {
              id: 'delete',
              label: 'Xóa thư mục',
              icon: <IconTrashOutline16 size={14} style={{ color: 'var(--dsw-alias-state-error-primary)' }} />,
              danger: true,
            },
          ]}
        />
      </div>
    </div>
  )
}

export interface SessionRowProps {
  session: ChatSession
  selected: boolean
  isEditing?: boolean
  onSelect: () => void
  onRename: () => void
  onFork: () => void
  onArchive: () => void
  onDelete: () => void
  onSaveRename?: (title: string) => void
  onCancelRename?: () => void
}

export function SessionRow({
  session,
  selected,
  isEditing = false,
  onSelect,
  onRename,
  onFork,
  onArchive,
  onDelete,
  onSaveRename,
  onCancelRename,
}: SessionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuAnchor = useRef<HTMLButtonElement>(null)
  const [draftTitle, setDraftTitle] = useState(session.title)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSaveRename?.(draftTitle)
    if (e.key === 'Escape') onCancelRename?.()
  }

  const handleSelect = (id: string) => {
    setMenuOpen(false)
    if (id === 'rename') onRename()
    else if (id === 'fork') onFork()
    else if (id === 'archive') onArchive()
    else if (id === 'delete') onDelete()
  }

  return (
    <div
      className={clsx(css.sessionRow, selected && css.selected, menuOpen && css.menuOpen)}
      onClick={onSelect}
      role="treeitem"
    >
      {isEditing ? (
        <input
          type="text"
          autoFocus
          className={css.renameInput}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={() => onSaveRename?.(draftTitle)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={css.title}>{session.title}</span>
      )}

      <div className={css.rowActions} onClick={(e) => e.stopPropagation()}>
        <Menu
          open={menuOpen}
          portal={true}
          side="right"
          align="start"
          anchor={
            <Tooltip label="Tùy chọn cuộc trò chuyện" delayMs={300}>
              <button
                ref={menuAnchor}
                type="button"
                className={css.iconButton}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Tùy chọn cuộc trò chuyện"
              >
                <IconEllipsisOutline16 size={16} />
              </button>
            </Tooltip>
          }
          onClose={() => setMenuOpen(false)}
          onSelect={handleSelect}
          items={[
            {
              id: 'rename',
              label: 'Đổi tên',
              icon: <IconEditOutline16 size={14} />,
            },
            {
              id: 'fork',
              label: 'Tạo nhánh (Fork)',
              icon: <IconBranchOutline16 size={14} />,
            },
            {
              id: 'archive',
              label: session.isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ',
              icon: <IconArchiveOutline20 size={14} />,
            },
            {
              id: 'delete',
              label: 'Xóa hội thoại',
              icon: <IconTrashOutline16 size={14} style={{ color: 'var(--dsw-alias-state-error-primary)' }} />,
              danger: true,
            },
          ]}
        />
      </div>
    </div>
  )
}
