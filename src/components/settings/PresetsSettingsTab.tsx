import { useState } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Button } from '@/components/ui/Button'
import type { AgentPreset } from '@/types/chat'
import css from './SettingsModal.module.css'

export function PresetsSettingsTab() {
  const { presets, selectedPresetId, systemPrompt, updateSettings, setSelectedPreset, addPreset, deletePreset } = useSettingsStore()
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetDesc, setNewPresetDesc] = useState('')
  const [newPresetPrompt, setNewPresetPrompt] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleCreate = () => {
    if (!newPresetName.trim() || !newPresetPrompt.trim()) return
    const created: AgentPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || 'Custom user persona',
      systemPrompt: newPresetPrompt.trim(),
      icon: 'Sparkles',
    }
    addPreset(created)
    setSelectedPreset(created.id)
    setNewPresetName('')
    setNewPresetDesc('')
    setNewPresetPrompt('')
    setIsAdding(false)
  }

  return (
    <div className={css.content}>
      <div className={css.formGroup}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className={css.label}>Danh sách Vai trò AI (Agent Presets)</label>
          <Button variant="ghost" onClick={() => setIsAdding((v) => !v)}>
            <Plus size={14} style={{ marginRight: 4 }} />
            {isAdding ? 'Đóng form' : 'Tạo mới'}
          </Button>
        </div>

        {isAdding && (
          <div style={{ padding: 14, background: 'var(--dsw-alias-bg-layer-2)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <input
              type="text"
              className={css.input}
              placeholder="Tên vai trò (VD: Chuyên gia Marketing)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
            />
            <input
              type="text"
              className={css.input}
              placeholder="Mô tả ngắn gọn..."
              value={newPresetDesc}
              onChange={(e) => setNewPresetDesc(e.target.value)}
            />
            <textarea
              className={css.input}
              rows={3}
              placeholder="System Prompt (Lời nhắc hệ thống)..."
              value={newPresetPrompt}
              onChange={(e) => setNewPresetPrompt(e.target.value)}
            />
            <Button variant="primary" onClick={handleCreate}>
              Lưu vai trò mới
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {presets.map((preset) => {
            const isSelected = preset.id === selectedPresetId
            return (
              <div
                key={preset.id}
                className={css.rowBetween}
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--dsw-alias-brand-primary-new-colorprimary-new-color)' : undefined,
                  background: isSelected ? 'var(--dsw-alias-state-business-tertiary)' : undefined,
                }}
                onClick={() => setSelectedPreset(preset.id)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={css.label}>{preset.name}</span>
                    {isSelected && <Check size={14} style={{ color: 'var(--dsw-alias-brand-primary-new-colorprimary-new-color)' }} />}
                  </div>
                  <div className={css.description}>{preset.description}</div>
                </div>
                {preset.id.startsWith('preset-') && (
                  <button
                    type="button"
                    style={{ border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-tertiary)', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePreset(preset.id)
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={css.formGroup}>
        <label className={css.label}>Chỉ dẫn Hệ thống Hiện tại (Active System Prompt)</label>
        <textarea
          className={css.input}
          rows={5}
          value={systemPrompt}
          onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
        />
        <span className={css.description}>
          Chỉ dẫn này sẽ được gửi kèm trong mọi lượt trò chuyện để định hình phong cách phản hồi của mô hình.
        </span>
      </div>
    </div>
  )
}
