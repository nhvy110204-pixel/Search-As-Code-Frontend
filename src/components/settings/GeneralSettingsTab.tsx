import { Sun, Moon, Trash2, Download } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useChatStore } from '@/store/useChatStore'
import { Button, SelectDropdown } from '@/components/ui'
import css from './SettingsModal.module.css'

export function GeneralSettingsTab() {
  const { language, updateSettings } = useSettingsStore()
  const { isDark, toggleTheme } = useThemeStore()
  const { sessions, clearAllSessions } = useChatStore()

  const handleExportData = () => {
    const dataStr = JSON.stringify(sessions, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatbot-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử các cuộc trò chuyện?')) {
      clearAllSessions()
      alert('Đã xóa toàn bộ lịch sử cuộc trò chuyện.')
    }
  }

  return (
    <div className={css.content}>

      <div className={css.formGroup}>
        <label className={css.label}>Ngôn ngữ hiển thị (Language)</label>
        <SelectDropdown
          variant="form"
          placement="bottom"
          fullWidth
          value={language}
          options={[
            {
              value: 'vi',
              label: 'Tiếng Việt (Vietnamese)',
              description: 'Giao diện và phản hồi mặc định bằng Tiếng Việt',
            },
            {
              value: 'en',
              label: 'English (US)',
              description: 'English language interface and responses',
            },
            {
              value: 'zh',
              label: '简体中文 (Chinese)',
              description: '中文界面和回复',
            },
          ]}
          onChange={(val) => updateSettings({ language: val as any })}
        />
      </div>

      <div className={css.rowBetween}>
        <div>
          <div className={css.label}>Xuất dữ liệu lịch sử (Export Data)</div>
          <div className={css.description}>Tải về toàn bộ tin nhắn và các phiên trò chuyện dưới dạng file JSON</div>
        </div>
        <Button variant="secondary" onClick={handleExportData}>
          <Download size={15} style={{ marginRight: 6 }} />
          JSON
        </Button>
      </div>

      <div className={css.dangerZone}>
        <div className={css.label} style={{ color: 'var(--dsw-alias-state-error-primary)' }}>
          Vùng Nguy Hiểm (Danger Zone)
        </div>
        <div className={css.description}>
          Xóa toàn bộ các cuộc trò chuyện đã lưu trên trình duyệt này. Hành động này không thể hoàn tác.
        </div>
        <div>
          <Button variant="danger" onClick={handleClearHistory}>
            <Trash2 size={15} style={{ marginRight: 6 }} />
            Xóa toàn bộ lịch sử
          </Button>
        </div>
      </div>
    </div>
  )
}
