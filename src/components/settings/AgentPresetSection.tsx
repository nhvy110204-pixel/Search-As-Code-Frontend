import { useState } from 'react'
import {
  IconBrowseOutline16,
  IconCopyOutline16,
  IconFolderOpenOutline16,
  IconPlusOutline16,
  IconTrashOutline16,
  Modal,
  Button,
} from '@/components/ui'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { AgentPreset } from '@/types/chat'
import css from './AgentPresetSection.module.css'

interface PresetRowItem {
  id: string
  name: string
  description: string
  trust: 'system' | 'user'
  isDefault: boolean
  composition?: string
}

const BUILT_IN_PRESETS: PresetRowItem[] = [
  {
    id: 'standard',
    name: 'Standard mode',
    description: 'Cấu hình tiêu chuẩn với bộ công cụ hoàn chỉnh, hỗ trợ tương tác đa tác vụ và phản hồi nhanh.',
    trust: 'system',
    isDefault: true,
    composition: `name: Standard mode
description: Default general-purpose agent harness profile
systemPrompt: |
  You are an expert AI assistant designed for pair programming, analysis, and execution.
tools:
  - bash
  - fs
  - lsp
  - web
  - memory`,
  },
  {
    id: 'plan',
    name: 'Plan mode',
    description: 'Chế độ lập kế hoạch: khảo sát kỹ lưỡng, xây dựng chiến lược chi tiết trước khi tiến hành thực thi.',
    trust: 'system',
    isDefault: false,
    composition: `name: Plan mode
description: Structured implementation planning before execution
systemPrompt: |
  You are in Planning Mode. Thoroughly analyze user requests and produce structured plans before modifying code.
tools:
  - fs
  - search
  - plan`,
  },
  {
    id: 'pair',
    name: 'Pair programmer',
    description: 'Trợ lý lập trình cặp đôi: tập trung hỗ trợ viết mã, gỡ lỗi, kiểm thử và tối ưu hóa kiến trúc.',
    trust: 'system',
    isDefault: false,
    composition: `name: Pair programmer
description: Interactive pair programming and codebase exploration
systemPrompt: |
  You are an expert software engineer collaborating in real-time. Follow strict coding hygiene and tests.
tools:
  - bash
  - fs
  - lsp
  - git`,
  },
  {
    id: 'cordis',
    name: 'Cordis self-modifier',
    description: 'Chế độ siêu hình: cho phép Agent tự động kiểm tra, nạp và điều chỉnh các plugin runtime của chính nó.',
    trust: 'system',
    isDefault: false,
    composition: `name: Cordis self-modifier
description: Agent inspects and modifies its own plugins
systemPrompt: |
  You have meta-access to the runtime configuration and cordis plugin graph.
tools:
  - self-modification
  - plugin-loader
  - cordis-eval`,
  },
]

export function AgentPresetSection() {
  const { selectedPresetId, setSelectedPreset } = useSettingsStore()
  const [customPresets, setCustomPresets] = useState<PresetRowItem[]>([
    {
      id: 'custom-reviewer',
      name: 'Code Reviewer Pro',
      description: 'Chuyên gia rà soát mã nguồn, kiểm tra tiêu chuẩn kiến trúc và bảo mật dự án.',
      trust: 'user',
      isDefault: false,
      composition: `name: Code Reviewer Pro
description: Specialized architectural and security review persona
systemPrompt: |
  Perform rigorous static analysis and security auditing.`,
    },
  ])

  // Copy modal state
  const [copySource, setCopySource] = useState<PresetRowItem | null>(null)
  const [copyId, setCopyId] = useState('')
  const [copyName, setCopyName] = useState('')

  // View composition modal state
  const [viewingPreset, setViewingPreset] = useState<PresetRowItem | null>(null)

  const handleMakeDefault = (id: string) => {
    setSelectedPreset(id)
  }

  const handleBeginCopy = (source: PresetRowItem) => {
    setCopySource(source)
    setCopyId(`${source.id}-copy`)
    setCopyName(`${source.name} (Bản sao)`)
  }

  const handleConfirmCopy = () => {
    if (!copySource || !copyId.trim() || !copyName.trim()) return
    const newCustom: PresetRowItem = {
      id: copyId.trim(),
      name: copyName.trim(),
      description: copySource.description,
      trust: 'user',
      isDefault: false,
      composition: copySource.composition,
    }
    setCustomPresets((prev) => [...prev, newCustom])
    setCopySource(null)
  }

  const handleDeleteCustom = (id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id))
    if (selectedPresetId === id) {
      setSelectedPreset('standard')
    }
  }

  return (
    <div className={css.section}>
      <h2 className={css.title}>Agent Presets (Cấu hình Agent)</h2>
      <p className={css.intro}>
        Tùy chỉnh thành phần và chỉ dẫn hành vi cho từng phiên làm việc của Agent. Chọn preset để đặt làm mặc định khi tạo phiên mới.
      </p>

      {/* 1. Built-in Group */}
      <section className={css.group}>
        <h3 className={css.groupHead}>Được tích hợp sẵn (Built-in)</h3>
        <ul className={css.cards}>
          {BUILT_IN_PRESETS.map((row) => {
            const isSelected = selectedPresetId === row.id || (selectedPresetId === '' && row.id === 'standard')
            return (
              <li
                key={row.id}
                className={isSelected ? `${css.card} ${css.cardActive}` : css.card}
              >
                <button
                  type="button"
                  className={css.cardMain}
                  onClick={() => handleMakeDefault(row.id)}
                >
                  <span className={css.cardHead}>
                    <span className={css.cardName}>{row.name}</span>
                    <span className={css.badge}>Tích hợp</span>
                    {isSelected && <span className={css.inUse}>Đang dùng</span>}
                  </span>
                  <span className={css.cardDesc}>{row.description}</span>
                  <code className={css.cardId}>{row.id}</code>
                </button>

                <div className={css.cardFoot}>
                  <button
                    type="button"
                    className={css.iconButton}
                    title="Xem cấu hình chi tiết (Composition)"
                    onClick={() => setViewingPreset(row)}
                  >
                    <IconBrowseOutline16 size={15} />
                  </button>
                  <button
                    type="button"
                    className={css.iconButton}
                    title="Tạo bản sao mới (Copy as custom preset)"
                    onClick={() => handleBeginCopy(row)}
                  >
                    <IconCopyOutline16 size={15} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* 2. Custom Group */}
      <section className={css.group}>
        <h3 className={css.groupHead}>Tùy chỉnh bởi người dùng (Custom)</h3>
        <button
          type="button"
          className={css.creatorButton}
          onClick={() => {
            const fresh: PresetRowItem = {
              id: `custom-agent-${Date.now().toString().slice(-4)}`,
              name: 'Custom Agent Preset',
              description: 'Cấu hình tùy biến cá nhân hóa cho quy trình công việc riêng.',
              trust: 'user',
              isDefault: false,
              composition: `name: Custom Agent Preset\ndescription: Custom persona\nsystemPrompt: |\n  Enter your instructions here...`,
            }
            setCustomPresets((prev) => [...prev, fresh])
          }}
        >
          <IconPlusOutline16 size={14} />
          <span>Tạo cấu hình Agent mới</span>
        </button>

        {customPresets.length > 0 && (
          <ul className={css.cards}>
            {customPresets.map((row) => {
              const isSelected = selectedPresetId === row.id
              return (
                <li
                  key={row.id}
                  className={isSelected ? `${css.card} ${css.cardActive}` : css.card}
                >
                  <button
                    type="button"
                    className={css.cardMain}
                    onClick={() => handleMakeDefault(row.id)}
                  >
                    <span className={css.cardHead}>
                      <span className={css.cardName}>{row.name}</span>
                      <span className={css.badge}>Tùy chỉnh</span>
                      {isSelected && <span className={css.inUse}>Đang dùng</span>}
                    </span>
                    <span className={css.cardDesc}>{row.description}</span>
                    <code className={css.cardId}>{row.id}</code>
                  </button>

                  <div className={css.cardFoot}>
                    <button
                      type="button"
                      className={css.iconButton}
                      title="Xem cấu hình chi tiết"
                      onClick={() => setViewingPreset(row)}
                    >
                      <IconBrowseOutline16 size={15} />
                    </button>
                    <button
                      type="button"
                      className={css.iconButton}
                      title="Mở thư mục lưu trữ"
                      onClick={() => alert(`Cấu hình được lưu tại: ~/.dsh/presets/${row.id}.yml`)}
                    >
                      <IconFolderOpenOutline16 size={15} />
                    </button>
                    <button
                      type="button"
                      className={css.iconButton}
                      title="Tạo bản sao"
                      onClick={() => handleBeginCopy(row)}
                    >
                      <IconCopyOutline16 size={15} />
                    </button>
                    <button
                      type="button"
                      className={css.iconButton}
                      title="Xóa preset này"
                      style={{ marginLeft: 'auto', color: 'var(--dsw-alias-state-error-primary)' }}
                      onClick={() => handleDeleteCustom(row.id)}
                    >
                      <IconTrashOutline16 size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Copy Modal Dialog */}
      <Modal
        open={copySource !== null}
        onClose={() => setCopySource(null)}
        title={copySource ? `Tạo bản sao · ${copySource.name}` : 'Tạo bản sao Preset'}
        closeLabel="Đóng"
        description="Tạo một bản sao cấu hình mới có thể chỉnh sửa trong thư mục ~/.dsh/presets/."
        footer={
          <>
            <Button variant="outline" onClick={() => setCopySource(null)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConfirmCopy}>
              Tạo bản sao
            </Button>
          </>
        }
      >
        <div className={css.dialogFields}>
          <label className={css.field}>
            <span className={css.fieldLabel}>Mã định danh (Preset ID)</span>
            <input
              className={css.input}
              value={copyId}
              spellCheck={false}
              onChange={(e) => setCopyId(e.target.value)}
              placeholder="VD: custom-pair-engineer"
            />
          </label>
          <label className={css.field}>
            <span className={css.fieldLabel}>Tên hiển thị (Display Name)</span>
            <input
              className={css.input}
              value={copyName}
              spellCheck={false}
              onChange={(e) => setCopyName(e.target.value)}
              placeholder="VD: Kỹ sư Lập trình Cấp cao"
            />
          </label>
        </div>
      </Modal>

      {/* View Composition Modal */}
      <Modal
        open={viewingPreset !== null}
        onClose={() => setViewingPreset(null)}
        title={`Cấu hình chi tiết · ${viewingPreset?.name}`}
        closeLabel="Đóng"
        description={`Định dạng cordis.yml nguyên bản cho preset "${viewingPreset?.id}".`}
        footer={
          <Button variant="primary" onClick={() => setViewingPreset(null)}>
            Đóng
          </Button>
        }
      >
        <div style={{ padding: '8px 0' }}>
          <pre
            style={{
              margin: 0,
              padding: 14,
              borderRadius: 8,
              background: 'var(--dsw-alias-bg-layer-2)',
              border: '1px solid var(--dsw-alias-border-l1)',
              fontFamily: 'var(--ds-font-family-code)',
              fontSize: 12,
              lineHeight: '18px',
              color: 'var(--dsw-alias-label-primary)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {viewingPreset?.composition || 'No composition file.'}
          </pre>
        </div>
      </Modal>
    </div>
  )
}
