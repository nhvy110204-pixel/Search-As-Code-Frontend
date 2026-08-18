import { useState, useEffect } from 'react'
import clsx from 'clsx'
import {
  Button, Input, Switch, Tooltip, Modal,
  IconSettingsOutline16, IconCodeOutline16, IconSparkle16,
  IconTrashOutline16, IconCheckOutline16, IconRefreshOutline16
} from '@/components/ui'
import type { ProjectResponse } from '@/types/project'
import css from './ProjectSettingsView.module.css'

export interface ProjectSettingsViewProps {
  project: ProjectResponse
  onUpdate: (data: { name: string; description?: string | null; settings?: Record<string, any> }) => Promise<void>
  onDelete: () => void
}

type TabType = 'general' | 'sac' | 'directive' | 'danger'

interface TabItem {
  id: TabType
  label: string
  icon: any
  desc: string
  danger?: boolean
}

const TABS: TabItem[] = [
  { id: 'general', label: 'Thông tin chung', icon: IconSettingsOutline16, desc: 'Tên, mô tả và định danh không gian dự án' },
  { id: 'sac', label: 'Động cơ SaC', icon: IconCodeOutline16, desc: 'Vòng lặp sinh mã & Sandbox tìm kiếm' },
  { id: 'directive', label: 'Chỉ dẫn & Trích dẫn', icon: IconSparkle16, desc: 'Persona, Grounding & Memory' },
  { id: 'danger', label: 'Vùng nguy hiểm', icon: IconTrashOutline16, desc: 'Đồng bộ lại dữ liệu & Xóa dự án', danger: true },
]

export function ProjectSettingsView({ project, onUpdate, onDelete }: ProjectSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [name, setName] = useState(project.name || '')
  const [description, setDescription] = useState(project.description || '')

  // SaC Settings state
  const projectSettings = project.settings || {}
  const [maxIterations, setMaxIterations] = useState<number>(projectSettings.max_iterations ?? 5)
  const [executionTimeout, setExecutionTimeout] = useState<number>(projectSettings.execution_timeout ?? 20)
  const [deepReasoning, setDeepReasoning] = useState<boolean>(projectSettings.deep_reasoning ?? true)
  const [strictRefusal, setStrictRefusal] = useState<boolean>(projectSettings.strict_refusal ?? true)

  // Directive & Memory state
  const [systemDirective, setSystemDirective] = useState<string>(projectSettings.system_directive ?? '')
  const [strictCitations, setStrictCitations] = useState<boolean>(projectSettings.strict_citations ?? true)
  const [enableMemory, setEnableMemory] = useState<boolean>(projectSettings.enable_memory ?? true)

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Sync state when project prop changes
  useEffect(() => {
    setName(project.name || '')
    setDescription(project.description || '')
    const s = project.settings || {}
    setMaxIterations(s.max_iterations ?? 5)
    setExecutionTimeout(s.execution_timeout ?? 20)
    setDeepReasoning(s.deep_reasoning ?? true)
    setStrictRefusal(s.strict_refusal ?? true)
    setSystemDirective(s.system_directive ?? '')
    setStrictCitations(s.strict_citations ?? true)
    setEnableMemory(s.enable_memory ?? true)
  }, [project])

  const handleSave = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await onUpdate({
        name: name.trim(),
        description: description.trim() || null,
        settings: {
          ...projectSettings,
          max_iterations: maxIterations,
          execution_timeout: executionTimeout,
          deep_reasoning: deepReasoning,
          strict_refusal: strictRefusal,
          system_directive: systemDirective.trim(),
          strict_citations: strictCitations,
          enable_memory: enableMemory,
        },
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSyncData = async () => {
    setIsSyncing(true)
    setSyncSuccess(false)
    await new Promise((r) => setTimeout(r, 1200))
    setIsSyncing(false)
    setSyncSuccess(true)
    setTimeout(() => setSyncSuccess(false), 3000)
  }

  return (
    <div className={css.container}>
      {/* 1. Left Nav Rail */}
      <nav className={css.nav}>
        <div className={css.navTitle}>Cài đặt Dự án</div>
        <div className={css.navList}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                className={clsx(
                  css.navCell,
                  isActive && css.active,
                  tab.danger && css.dangerNav
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} className={css.navIcon} />
                <div className={css.navTextWrap}>
                  <span className={css.navLabel}>{tab.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 2. Main Content Area */}
      <div className={css.content}>
        {/* Fixed rhythm header row */}
        <div className={css.contentHeader}>
          <div className={css.titleCluster}>
            <h2 className={css.tabTitle}>
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className={css.tabSubtitle}>
              {TABS.find((t) => t.id === activeTab)?.desc}
            </p>
          </div>

          <div className={css.headerActions}>
            {saveSuccess && (
              <div className={css.saveToast}>
                <IconCheckOutline16 size={14} style={{ color: 'var(--dsw-static-green-500)' }} />
                <span>Đã lưu thành công</span>
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              disabled={!name.trim() || isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>

        {/* Tab 1: Thông tin chung */}
        {activeTab === 'general' && (
          <div className={css.formSection}>
            <div className={css.fieldGroup}>
              <label className={css.fieldLabel}>
                Tên không gian dự án <span className={css.required}>*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên dự án..."
                className={css.inputField}
              />
            </div>

            <div className={css.fieldGroup}>
              <label className={css.fieldLabel}>Mô tả mục tiêu dự án</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả phạm vi tài liệu và mục đích của không gian tri thức này..."
                rows={3}
                className={css.textarea}
              />
            </div>

            <div className={css.metaCard}>
              <div className={css.metaCardTitle}>Thông tin Định danh & Phạm vi</div>
              <div className={css.metaGrid}>
                <div className={css.metaItem}>
                  <span className={css.metaKey}>Project ID</span>
                  <span className={css.metaVal}>{project.id}</span>
                </div>
                <div className={css.metaItem}>
                  <span className={css.metaKey}>Tổng số tài liệu</span>
                  <span className={css.metaVal}>{project.document_count || 0} files</span>
                </div>
                <div className={css.metaItem}>
                  <span className={css.metaKey}>Số phiên trò chuyện</span>
                  <span className={css.metaVal}>{project.session_count || 0} sessions</span>
                </div>
                <div className={css.metaItem}>
                  <span className={css.metaKey}>Ngày khởi tạo</span>
                  <span className={css.metaVal}>
                    {new Date(project.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Động cơ Search-as-Code (SaC) */}
        {activeTab === 'sac' && (
          <div className={css.formSection}>
            {/* Max iterations */}
            <div className={css.fieldGroup}>
              <div className={css.fieldHeaderRow}>
                <label className={css.fieldLabel}>
                  Số vòng lặp tối đa của Agent (Max SaC Iterations)
                </label>
                <span className={css.badgeValue}>{maxIterations} vòng</span>
              </div>
              <div className={css.fieldHelper}>
                Giới hạn số lần Agent được phép sinh mã Python và thực thi tìm kiếm lặp lại cho một câu hỏi.
              </div>
              <div className={css.sliderWrap}>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(Number(e.target.value))}
                  className={css.slider}
                />
                <div className={css.sliderLabels}>
                  <span>1 (Nhanh, tiết kiệm)</span>
                  <span>5 (Khuyên dùng)</span>
                  <span>10 (Nghiên cứu sâu)</span>
                </div>
              </div>
            </div>

            {/* Execution timeout */}
            <div className={css.fieldGroup}>
              <div className={css.fieldHeaderRow}>
                <label className={css.fieldLabel}>
                  Thời gian Timeout thực thi Sandbox (Execution Timeout)
                </label>
                <span className={css.badgeValue}>{executionTimeout}s</span>
              </div>
              <div className={css.fieldHelper}>
                Giới hạn thời gian tối đa mỗi đoạn mã Python tìm kiếm được chạy trong môi trường sandbox an toàn.
              </div>
              <div className={css.sliderWrap}>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={executionTimeout}
                  onChange={(e) => setExecutionTimeout(Number(e.target.value))}
                  className={css.slider}
                />
                <div className={css.sliderLabels}>
                  <span>5s</span>
                  <span>20s (Mặc định)</span>
                  <span>60s</span>
                </div>
              </div>
            </div>

            {/* Switches Block */}
            <div className={css.fieldGroup}>
              <div className={css.switchCard}>
                <div className={css.switchRow}>
                  <div>
                    <div className={css.switchLabel}>Chế độ Phân tích Sâu Đa bước (Deep Multi-hop Reasoning)</div>
                    <div className={css.switchDesc}>
                      Cho phép Agent tự động chia nhỏ câu hỏi phức tạp thành các bài toán con và lập trình pipeline tìm kiếm song song.
                    </div>
                  </div>
                  <Switch checked={deepReasoning} onChange={setDeepReasoning} />
                </div>

                <div className={css.switchRow}>
                  <div>
                    <div className={css.switchLabel}>Chính sách Từ chối khi Thiếu Bằng chứng (Strict Refusal Policy)</div>
                    <div className={css.switchDesc}>
                      Khi mã tìm kiếm không thu thập đủ bằng chứng trong tài liệu dự án, Agent sẽ thẳng thắn thông báo thay vì tự suy đoán.
                    </div>
                  </div>
                  <Switch checked={strictRefusal} onChange={setStrictRefusal} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Chỉ dẫn & Trích dẫn */}
        {activeTab === 'directive' && (
          <div className={css.formSection}>
            <div className={css.fieldGroup}>
              <label className={css.fieldLabel}>
                Chỉ dẫn Ngữ cảnh Riêng cho Dự án (Project Context Directive)
              </label>
              <div className={css.fieldHelper}>
                Tùy biến trọng tâm phân tích, vai trò chuyên gia hoặc quy tắc đối chiếu đặc thù cho không gian làm việc này.
              </div>
              <textarea
                value={systemDirective}
                onChange={(e) => setSystemDirective(e.target.value)}
                placeholder="Ví dụ: Bạn là chuyên gia phân tích hợp đồng. Hãy tập trung so sánh các điều khoản bồi thường và thời hạn thanh toán giữa các văn bản..."
                rows={5}
                className={css.textarea}
              />
            </div>

            <div className={css.fieldGroup}>
              <div className={css.switchCard}>
                <div className={css.switchRow}>
                  <div>
                    <div className={css.switchLabel}>Bắt buộc Trích dẫn Nguồn Nghiêm ngặt (Strict Citations)</div>
                    <div className={css.switchDesc}>
                      Mọi phát biểu luận điểm bắt buộc phải đi kèm trích dẫn số trang, vị trí đoạn và tên file gốc chuẩn NotebookLM.
                    </div>
                  </div>
                  <Switch checked={strictCitations} onChange={setStrictCitations} />
                </div>

                <div className={css.switchRow}>
                  <div>
                    <div className={css.switchLabel}>Bộ nhớ Dài hạn Đa phiên (Cross-session Memory)</div>
                    <div className={css.switchDesc}>
                      Ghi nhớ thói quen, định dạng báo cáo ưa thích và ngữ cảnh ổn định của bạn qua các phiên chat trong dự án này.
                    </div>
                  </div>
                  <Switch checked={enableMemory} onChange={setEnableMemory} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Vùng nguy hiểm */}
        {activeTab === 'danger' && (
          <div className={css.formSection}>
            {/* Sync Data Card */}
            <div className={css.dangerCard}>
              <div className={css.dangerText}>
                <div className={css.dangerTitle}>Đồng bộ lại Dữ liệu & Vectors</div>
                <div className={css.dangerDesc}>
                  Quét lại toàn bộ tài liệu trong dự án và tái đồng bộ với Qdrant Vector Collection để đảm bảo dữ liệu tìm kiếm luôn mới nhất.
                </div>
              </div>
              <Tooltip label="Đồng bộ hóa lại chỉ mục tri thức" delayMs={300}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSyncing}
                  onClick={handleSyncData}
                >
                  <IconRefreshOutline16
                    size={16}
                    className={isSyncing ? 'spin' : undefined}
                    style={{ marginRight: 6 }}
                  />
                  {isSyncing ? 'Đang đồng bộ...' : syncSuccess ? '✓ Đã đồng bộ' : ''}
                </Button>
              </Tooltip>
            </div>

            {/* Delete Project Card */}
            <div className={clsx(css.dangerCard, css.dangerCardCritical)}>
              <div className={css.dangerText}>
                <div className={css.dangerTitle} style={{ color: 'var(--dsw-alias-state-error-primary)' }}>
                  Xóa Vĩnh viễn Không gian Dự án Này
                </div>
                <div className={css.dangerDesc}>
                  Hành động này sẽ xóa vĩnh viễn toàn bộ tài liệu, văn bản bóc tách Markdown, vector chunks trong Qdrant và lịch sử trò chuyện.
                </div>
              </div>
              <Tooltip label="Xóa dự án vĩnh viễn" delayMs={300}>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <IconTrashOutline16 size={16} />
                </Button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        closeLabel="Hủy"
        title="Xác nhận Xóa Vĩnh viễn Dự án"
        description={`Bạn có chắc chắn muốn xóa không gian dự án "${project.name}"? Mọi dữ liệu tài liệu và lịch sử trò chuyện liên quan sẽ bị xóa hoàn toàn khỏi hệ thống.`}
        footer={(
          <>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteModalOpen(false)
                onDelete()
              }}
            >
              Xác nhận Xóa Dự án
            </Button>
          </>
        )}
      >
        <div style={{ fontSize: 13, color: 'var(--dsw-alias-label-secondary)' }}>
          Hành động này mang tính phá hủy dữ liệu và không thể hoàn tác.
        </div>
      </Modal>
    </div>
  )
}
