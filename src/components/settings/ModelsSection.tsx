import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import {
  IconPlusOutline16,
  IconTrashOutline16,
  Button,
  Modal,
  Tooltip,
} from '@/components/ui'
import { useSettingsStore } from '@/store/useSettingsStore'
import css from './ModelsSection.module.css'

interface ProviderItem {
  id: string
  displayName: string
  tag?: string
  isOfficial?: boolean
  baseUrl: string
  apiKey: string
  models: string[]
  configured: boolean
}

export function ModelsSection() {
  const { apiKey, baseUrl, updateSettings } = useSettingsStore()

  const [providers, setProviders] = useState<ProviderItem[]>([
    {
      id: 'deepseek',
      displayName: 'DeepSeek AI',
      tag: 'Official',
      isOfficial: true,
      baseUrl: baseUrl || 'https://api.deepseek.com/v1',
      apiKey: apiKey || '',
      models: ['deepseek-reasoner (R1)', 'deepseek-chat (V3)'],
      configured: Boolean(apiKey),
    },
    {
      id: 'anthropic',
      displayName: 'Anthropic',
      tag: 'Claude',
      isOfficial: false,
      baseUrl: 'https://api.anthropic.com/v1',
      apiKey: '',
      models: ['claude-3-7-sonnet', 'claude-3-5-sonnet'],
      configured: false,
    },
    {
      id: 'openai',
      displayName: 'OpenAI / Compatible Endpoint',
      tag: 'Custom',
      isOfficial: false,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
      configured: false,
    },
  ])

  const [expandedProviderId, setExpandedProviderId] = useState<string | null>('deepseek')
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({})

  // Add provider modal
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newProviderName, setNewProviderName] = useState('')
  const [newBaseUrl, setNewBaseUrl] = useState('')
  const [newApiKey, setNewApiKey] = useState('')
  const [newModels, setNewModels] = useState('')

  const toggleShowKey = (id: string) => {
    setShowKeyMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleUpdateProvider = (id: string, updates: Partial<ProviderItem>) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = { ...p, ...updates }
          next.configured = Boolean(next.apiKey.trim())
          if (id === 'deepseek') {
            if (updates.apiKey !== undefined) updateSettings({ apiKey: updates.apiKey })
            if (updates.baseUrl !== undefined) updateSettings({ baseUrl: updates.baseUrl })
          }
          return next
        }
        return p
      })
    )
  }

  const handleAddProvider = () => {
    if (!newProviderName.trim() || !newBaseUrl.trim()) return
    const id = `provider-${Date.now().toString().slice(-4)}`
    const parsedModels = newModels.split(',').map((m) => m.trim()).filter(Boolean)
    const newProv: ProviderItem = {
      id,
      displayName: newProviderName.trim(),
      tag: 'Custom',
      baseUrl: newBaseUrl.trim(),
      apiKey: newApiKey.trim(),
      models: parsedModels.length > 0 ? parsedModels : ['custom-model-v1'],
      configured: Boolean(newApiKey.trim()),
    }
    setProviders((prev) => [...prev, newProv])
    setIsAddOpen(false)
    setNewProviderName('')
    setNewBaseUrl('')
    setNewApiKey('')
    setNewModels('')
  }

  const handleDeleteProvider = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id))
    if (expandedProviderId === id) setExpandedProviderId(null)
  }

  return (
    <div className={css.section}>
      <h2 className={css.title}>Models & Providers (Mô hình & Nhà cung cấp)</h2>
      <p className={css.intro}>
        Quản lý các nhà cung cấp mô hình AI, cấu hình endpoint và khóa API để phục vụ cho các phiên làm việc và subagent.
      </p>

      {/* Provider list */}
      <ul className={css.rows}>
        {providers.map((p) => {
          const isExpanded = expandedProviderId === p.id
          const isKeyVisible = showKeyMap[p.id] || false

          return (
            <li key={p.id} className={css.rowCard}>
              {/* Row Header */}
              <div className={css.rowHead}>
                <div className={css.rowIdentity}>
                  <Tooltip label={p.configured ? 'Đã cấu hình API key hợp lệ' : 'Chưa có API key'} delayMs={300}>
                    <span
                      className={
                        p.configured
                          ? `${css.credentialDot} ${css.credentialDotConfigured}`
                          : `${css.credentialDot} ${css.credentialDotMissing}`
                      }
                    />
                  </Tooltip>
                  <span className={css.rowName}>{p.displayName}</span>
                  {p.tag && <span className={css.rowTag}>{p.tag}</span>}
                </div>

                <div className={css.rowActions}>
                  <button
                    type="button"
                    className={css.editButton}
                    onClick={() => setExpandedProviderId(isExpanded ? null : p.id)}
                  >
                    {isExpanded ? 'Thu gọn' : 'Chỉnh sửa'}
                  </button>

                  {!p.isOfficial && (
                    <Tooltip label="Xóa nhà cung cấp" delayMs={300}>
                      <button
                        type="button"
                        className={css.editButton}
                        style={{ color: 'var(--dsw-alias-state-error-primary)', borderColor: 'transparent' }}
                        aria-label="Xóa nhà cung cấp"
                        onClick={() => handleDeleteProvider(p.id)}
                      >
                        <IconTrashOutline16 size={14} style={{ color: 'var(--dsw-alias-state-error-primary)' }} />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Model Badges */}
              <div className={css.modelBadges}>
                {p.models.map((m) => (
                  <span key={m} className={css.modelBadge}>
                    {m}
                  </span>
                ))}
              </div>

              {/* Expanded Edit Form */}
              {isExpanded && (
                <div className={css.editorCard}>
                  <div className={css.formField}>
                    <label className={css.fieldLabel}>API Key</label>
                    <div className={css.fieldInputRow}>
                      <input
                        type={isKeyVisible ? 'text' : 'password'}
                        className={css.input}
                        placeholder={p.isOfficial ? 'sk-...' : 'Nhập API key...'}
                        value={p.id === 'deepseek' ? apiKey : p.apiKey}
                        onChange={(e) => handleUpdateProvider(p.id, { apiKey: e.target.value })}
                      />
                      <button
                        type="button"
                        className={css.editButton}
                        onClick={() => toggleShowKey(p.id)}
                        aria-label="Ẩn hiện key"
                      >
                        {isKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <span className={css.fieldHint}>
                      Khóa API được lưu trữ an toàn trong máy khách và gửi thẳng tới API endpoint.
                    </span>
                  </div>

                  <div className={css.formField}>
                    <label className={css.fieldLabel}>API Endpoint (Base URL)</label>
                    <input
                      type="text"
                      className={css.input}
                      value={p.id === 'deepseek' ? baseUrl : p.baseUrl}
                      onChange={(e) => handleUpdateProvider(p.id, { baseUrl: e.target.value })}
                    />
                    <span className={css.fieldHint}>
                      Đường dẫn endpoint REST API (ví dụ: https://api.deepseek.com/v1 hoặc proxy cục bộ).
                    </span>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Add Provider Button */}
      <button
        type="button"
        className={css.addButton}
        onClick={() => setIsAddOpen(true)}
      >
        <IconPlusOutline16 size={14} />
        <span>Thêm nhà cung cấp tùy chỉnh (+ Add Provider)</span>
      </button>

      {/* Add Provider Modal */}
      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Thêm Nhà Cung Cấp Mô Hình AI"
        closeLabel="Hủy"
        description="Đăng ký thêm nhà cung cấp tương thích giao thức OpenAI hoặc Custom Endpoint."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleAddProvider}>
              Thêm nhà cung cấp
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '10px 0' }}>
          <div className={css.formField}>
            <label className={css.fieldLabel}>Tên nhà cung cấp</label>
            <input
              type="text"
              className={css.input}
              placeholder="VD: Ollama Local / Groq / OpenRouter"
              value={newProviderName}
              onChange={(e) => setNewProviderName(e.target.value)}
            />
          </div>

          <div className={css.formField}>
            <label className={css.fieldLabel}>Base URL (Endpoint)</label>
            <input
              type="text"
              className={css.input}
              placeholder="https://api.groq.com/openai/v1 hoặc http://localhost:11434/v1"
              value={newBaseUrl}
              onChange={(e) => setNewBaseUrl(e.target.value)}
            />
          </div>

          <div className={css.formField}>
            <label className={css.fieldLabel}>API Key (Tùy chọn)</label>
            <input
              type="password"
              className={css.input}
              placeholder="sk-..."
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
            />
          </div>

          <div className={css.formField}>
            <label className={css.fieldLabel}>Danh sách mô hình (Phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              className={css.input}
              placeholder="llama-3.3-70b, deepseek-r1-distill"
              value={newModels}
              onChange={(e) => setNewModels(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
