import { Globe, Terminal, Server, Plus, Trash2 } from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Button, Switch } from '@/components/ui'
import css from './SettingsModal.module.css'

export function PluginsSettingsTab() {
  const { enableWebSearch, enableCodeExecution, mcpServers, updateSettings } = useSettingsStore()

  const toggleMcpServer = (index: number) => {
    const updated = mcpServers.map((s, idx) => (idx === index ? { ...s, enabled: !s.enabled } : s))
    updateSettings({ mcpServers: updated })
  }

  const deleteMcpServer = (index: number) => {
    const updated = mcpServers.filter((_, idx) => idx !== index)
    updateSettings({ mcpServers: updated })
  }

  const addMcpServer = () => {
    const name = prompt('Nhập tên MCP Server:')
    const url = prompt('Nhập URL MCP Server (VD: http://localhost:8080/sse):')
    if (name && url) {
      updateSettings({ mcpServers: [...mcpServers, { name, url, enabled: true }] })
    }
  }

  return (
    <div className={css.content}>
      <div className={css.formGroup}>
        <label className={css.label}>Công cụ Tích hợp Cốt lõi (Built-in Tools)</label>

        <div className={css.rowBetween}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className={css.label}>
              <Globe size={15} />
              <span>Tìm kiếm Web Trực tiếp (Web Search)</span>
            </div>
            <div className={css.description}>Cho phép mô hình tra cứu thông tin thời gian thực trên Internet</div>
          </div>
          <Switch
            checked={enableWebSearch}
            onChange={(checked) => updateSettings({ enableWebSearch: checked })}
          />
        </div>

        <div className={css.rowBetween}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className={css.label}>
              <Terminal size={15} />
              <span>Chạy Mã Sandbox / Terminal (Code Runner)</span>
            </div>
            <div className={css.description}>Cho phép thực thi lệnh bash và code Python/JavaScript trong môi trường cách ly</div>
          </div>
          <Switch
            checked={enableCodeExecution}
            onChange={(checked) => updateSettings({ enableCodeExecution: checked })}
          />
        </div>
      </div>

      <div className={css.formGroup}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className={css.label}>Máy chủ Model Context Protocol (MCP Servers)</label>
          <Button variant="ghost" onClick={addMcpServer}>
            <Plus size={14} style={{ marginRight: 4 }} />
            Thêm MCP Server
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          {mcpServers.map((server, idx) => (
            <div key={idx} className={css.rowBetween}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Server size={14} style={{ color: 'var(--dsw-alias-brand-primary-new-colorprimary-new-color)' }} />
                  <span className={css.label}>{server.name}</span>
                </div>
                <div className={css.description} style={{ fontFamily: 'var(--ds-font-family-code)' }}>{server.url}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Switch
                  checked={server.enabled}
                  onChange={() => toggleMcpServer(idx)}
                />
                <button
                  type="button"
                  style={{ border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-tertiary)', cursor: 'pointer', padding: 4 }}
                  onClick={() => deleteMcpServer(idx)}
                  title="Xóa máy chủ"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
