import { useSettingsStore } from '@/store/useSettingsStore'
import { useChatStore } from '@/store/useChatStore'
import {
  SelectDropdown, Slider,
  IconApiOutline14, IconGlobeOutline14, IconPersonalizationOutline16
} from '@/components/ui'
import css from './SettingsModal.module.css'

export function ModelSettingsTab() {
  const { apiKey, baseUrl, defaultModel, temperature, maxTokens, updateSettings } = useSettingsStore()
  const { availableModels, setSelectedModel } = useChatStore()

  const modelOptions = availableModels.map((m) => ({
    value: m.id,
    label: m.name,
    description: `${m.provider.toUpperCase()} ${m.description ? `· ${m.description}` : ''}`,
  }))

  return (
    <div className={css.content}>
      <div className={css.formGroup}>
        <label className={css.label}>
          <IconApiOutline14 size={14} style={{ display: 'inline', marginRight: 6 }} />
          API Key (DeepSeek / OpenAI / Custom Provider)
        </label>
        <input
          type="password"
          className={css.input}
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => updateSettings({ apiKey: e.target.value })}
        />
        <span className={css.description}>
          Khóa API được lưu an toàn trong LocalStorage trên trình duyệt của bạn và gửi thẳng tới API Backend.
        </span>
      </div>

      <div className={css.formGroup}>
        <label className={css.label}>
          <IconGlobeOutline14 size={14} style={{ display: 'inline', marginRight: 6 }} />
          Base URL (API Endpoint)
        </label>
        <input
          type="text"
          className={css.input}
          placeholder="https://api.deepseek.com/v1"
          value={baseUrl}
          onChange={(e) => updateSettings({ baseUrl: e.target.value })}
        />
        <span className={css.description}>
          Đổi sang URL máy chủ cục bộ hoặc Proxy của bạn (ví dụ: http://localhost:8000/v1).
        </span>
      </div>

      <div className={css.formGroup}>
        <label className={css.label}>Mô hình Mặc định (Default Model)</label>
        <SelectDropdown
          variant="form"
          placement="bottom"
          fullWidth
          value={defaultModel}
          options={modelOptions}
          onChange={(val) => {
            updateSettings({ defaultModel: val })
            setSelectedModel(val)
          }}
        />
      </div>

      <div className={css.formGroup}>
        <div className={css.sliderRow}>
          <label className={css.label} style={{ margin: 0 }}>
            <IconPersonalizationOutline16 size={14} style={{ display: 'inline', marginRight: 6 }} />
            Độ sáng tạo (Temperature):
          </label>
          <span className={css.sliderValue}>{temperature}</span>
        </div>
        <Slider
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={(val) => updateSettings({ temperature: val })}
        />
        <span className={css.description}>
          Giá trị thấp (0.0 - 0.3) phù hợp cho Lập trình và Toán học; giá trị cao (0.7 - 1.2) cho viết lách sáng tạo.
        </span>
      </div>

      <div className={css.formGroup}>
        <div className={css.sliderRow}>
          <label className={css.label} style={{ margin: 0 }}>Số Token Tối Đa (Max Output Tokens):</label>
          <span className={css.sliderValue}>{maxTokens}</span>
        </div>
        <Slider
          min={512}
          max={32768}
          step={512}
          value={maxTokens}
          onChange={(val) => updateSettings({ maxTokens: val })}
        />
      </div>
    </div>
  )
}
