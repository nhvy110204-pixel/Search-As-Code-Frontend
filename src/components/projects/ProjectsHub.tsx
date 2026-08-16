import { useState, useMemo } from 'react'
import {
  Button, Modal, Menu, Pill, Input, Tooltip,
  IconPlusOutline16, IconSearchOutline16, IconEllipsisOutline16,
  IconBrowseOutline16, IconEditOutline16, IconTrashOutline16, IconQueueOutline14
} from '@/components/ui'
import { useProjectStore } from '@/store/useProjectStore'
import { useChatStore } from '@/store/useChatStore'
import { useViewStore } from '@/store/useViewStore'
import { CreateProjectModal } from './CreateProjectModal'
import type { ProjectResponse } from '@/types/project'
import css from './ProjectsHub.module.css'

export function ProjectsHub() {
  const { projects, setActiveProject, updateProject, deleteProject } = useProjectStore()
  const { newSession } = useChatStore()
  const { navigateToChat, navigateToProjectDetail } = useViewStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  // Edit / Delete states
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const [deletingProject, setDeletingProject] = useState<ProjectResponse | null>(null)

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [projects, searchQuery])

  const handleOpenChat = (project: ProjectResponse) => {
    setActiveProject(project.id)
    newSession(project.id)
    navigateToChat()
  }

  const handleOpenSources = (project: ProjectResponse) => {
    setActiveProject(project.id)
    navigateToProjectDetail(project.id, 'documents')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject || !editName.trim()) return
    await updateProject(editingProject.id, editName.trim(), editDesc.trim() || undefined)
    setEditingProject(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingProject) return
    await deleteProject(deletingProject.id)
    setDeletingProject(null)
  }

  return (
    <div className={css.root}>
      <div className={css.container}>
        {/* 1. Header Bar: "Dự án" left, "Tìm dự án" right */}
        <div className={css.headerBar}>
          <h2 className={css.pageHeading}>Dự án</h2>

          <div className={css.searchWrapper}>
            <IconSearchOutline16 size={15} className={css.searchIcon} />
            <input
              type="text"
              placeholder="Tìm dự án..."
              className={css.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Projects Grid */}
        <div className={css.grid}>
          {/* Create New Card (Dashed) */}
          <div className={css.createCard} onClick={() => setIsCreateOpen(true)}>
            <div className={css.createCardIcon}>
              <IconPlusOutline16 size={22} />
            </div>
            <div className={css.createCardTitle}>Tạo dự án mới</div>
            <div className={css.createCardDesc}>
              Khởi tạo không gian tài liệu mới để nạp PDF, Word và bắt đầu hỏi đáp
            </div>
          </div>

          {/* Project Cards */}
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={css.card}
              onClick={() => handleOpenSources(project)}
            >
              <div className={css.cardHeader}>
                <Tooltip label={project.name} delayMs={300}>
                  <h3 className={css.cardTitle}>{project.name}</h3>
                </Tooltip>
                <Menu
                  open={menuOpenId === project.id}
                  onClose={() => setMenuOpenId(null)}
                  portal={true}
                  side="bottom"
                  align="end"
                  anchor={
                    <Tooltip label="Tùy chọn dự án" delayMs={300}>
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ padding: 4 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(menuOpenId === project.id ? null : project.id)
                        }}
                        aria-label="Tùy chọn dự án"
                      >
                        <IconEllipsisOutline16 size={16} />
                      </Button>
                    </Tooltip>
                  }
                  items={[
                    {
                      id: 'detail',
                      label: 'Chi tiết & Nguồn tài liệu',
                      icon: <IconBrowseOutline16 size={14} />,
                    },
                    {
                      id: 'edit',
                      label: 'Đổi tên & Mô tả',
                      icon: <IconEditOutline16 size={14} />,
                    },
                    {
                      id: 'delete',
                      label: 'Xóa dự án',
                      icon: <IconTrashOutline16 size={14} style={{ color: 'var(--dsw-alias-state-error-primary)' }} />,
                      danger: true,
                    },
                  ]}
                  onSelect={(id) => {
                    setMenuOpenId(null)
                    if (id === 'detail') {
                      handleOpenSources(project)
                    } else if (id === 'edit') {
                      setEditingProject(project)
                      setEditName(project.name)
                      setEditDesc(project.description || '')
                    } else if (id === 'delete') {
                      setDeletingProject(project)
                    }
                  }}
                />
              </div>

              <p className={css.cardDescription}>
                {project.description || 'Chưa có mô tả cho dự án này.'}
              </p>

              <div className={css.cardBadges}>
                <Pill>
                  <IconBrowseOutline16 size={12} style={{ marginRight: 4 }} />
                  {project.document_count || 0} tài liệu
                </Pill>
                <Pill>
                  <IconQueueOutline14 size={12} style={{ marginRight: 4 }} />
                  {project.session_count || 0} cuộc trò chuyện
                </Pill>
              </div>

              <div className={css.cardFooter}>
                <span className={css.cardDate}>
                  {new Date(project.updated_at || project.created_at).toLocaleDateString('vi-VN')}
                </span>
                <div className={css.cardActions}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenChat(project)
                    }}
                  >
                    Chat
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => navigateToProjectDetail(id, 'documents')}
      />

      {/* Edit Project Modal */}
      <Modal
        open={editingProject !== null}
        onClose={() => setEditingProject(null)}
        closeLabel="Hủy"
        title="Chỉnh sửa Dự án"
        footer={(
          <>
            <Button variant="outline" onClick={() => setEditingProject(null)}>Hủy</Button>
            <Button variant="primary" disabled={!editName.trim()} onClick={handleSaveEdit}>
              Lưu thay đổi
            </Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 550, marginBottom: 6 }}>
              Tên dự án
            </label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 550, marginBottom: 6 }}>
              Mô tả dự án
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--dsw-alias-border-l2)',
                background: 'var(--dsw-alias-bg-module-platform)',
                color: 'var(--dsw-alias-label-primary)',
                fontFamily: 'var(--dsw-font-family)',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Project Modal */}
      <Modal
        open={deletingProject !== null}
        onClose={() => setDeletingProject(null)}
        closeLabel="Hủy"
        title="Xác nhận Xóa Dự án"
        description={
          deletingProject
            ? `Bạn có chắc chắn muốn xóa dự án "${deletingProject.name}"? Toàn bộ tài liệu, vector chunks và lịch sử chat trong dự án này sẽ bị xóa.`
            : undefined
        }
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeletingProject(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleConfirmDelete}>Xóa Dự án</Button>
          </>
        )}
      >
        <div style={{ fontSize: 13, color: 'var(--dsw-alias-label-secondary)' }}>
          Hành động này không thể hoàn tác.
        </div>
      </Modal>
    </div>
  )
}
