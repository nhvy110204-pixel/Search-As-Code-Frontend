import { useState } from 'react'
import {
  IconSearchOutline16,
  IconGlobeOutline14,
  IconCodeOutline16,
  IconDataOutline16,
  IconFolderOpen16,
  SlidingSegmentedControl,
} from '@/components/ui'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useThemeStore } from '@/store/useThemeStore'

const FEATURED = [
  {
    id: 'web-search',
    name: 'Tìm kiếm Web',
    desc: 'Thu thập thông tin mới nhất và trích xuất nguồn URL theo thời gian thực.',
    color: '#0878F9',
    icon: <IconGlobeOutline14 size={22} />,
  },
  {
    id: 'code-runner',
    name: 'Sandbox Mã',
    desc: 'Chạy và kiểm thử mã nguồn Python/Node trong môi trường an toàn.',
    color: '#16a34a',
    icon: <IconCodeOutline16 size={22} />,
  },
  {
    id: 'qdrant',
    name: 'Qdrant RAG',
    desc: 'Bộ nhớ ngữ nghĩa RAG cho tài liệu dự án, tìm kiếm vector semantics.',
    color: '#ea580c',
    icon: <IconDataOutline16 size={22} />,
  },
]

type FilterTab = 'available' | 'connected'

export function ToolsTab() {
  const {
    enableWebSearch,
    enableCodeExecution,
    mcpServers,
    updateSettings,
  } = useSettingsStore()

  const { isDark } = useThemeStore()

  const [filterTab, setFilterTab] = useState<FilterTab>('available')
  const [query, setQuery] = useState('')

  const cardBg = isDark ? 'var(--dsw-alias-bg-layer-1, #232324)' : '#FFFFFF'
  const cardBorder = isDark ? '1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))' : '1px solid #ECECEC'
  const iconTileBg = isDark ? 'var(--dsw-alias-bg-layer-2, #2c2c2e)' : '#F5F5F5'
  const divider = isDark ? 'var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08))' : '#EEEEEE'
  const trackBg = isDark ? 'var(--dsw-alias-bg-layer-2, #2c2c2e)' : '#EEEEEE'
  const pillActiveBg = isDark ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF'
  const shadow = isDark ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.08)'

  const productivityItems = [
    {
      key: 'web',
      icon: <IconGlobeOutline14 size={16} />,
      color: '#0878F9',
      name: 'Tìm kiếm Web',
      desc: 'Realtime search & URL citations',
      enabled: enableWebSearch,
      onToggle: () => updateSettings({ enableWebSearch: !enableWebSearch }),
    },
    {
      key: 'code',
      icon: <IconCodeOutline16 size={16} />,
      color: '#16a34a',
      name: 'Code Runner',
      desc: 'Python / Node sandbox execution',
      enabled: enableCodeExecution,
      onToggle: () => updateSettings({ enableCodeExecution: !enableCodeExecution }),
    },
    {
      key: 'qdrant',
      icon: <IconDataOutline16 size={16} />,
      color: '#ea580c',
      name: 'Qdrant Vector DB',
      desc: 'Semantic RAG collection storage',
      enabled: true,
      onToggle: null as null,
    },
  ]

  const filteredFeatured = FEATURED.filter((item) => {
    const matchesSearch = query
      ? item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase())
      : true
    if (filterTab === 'connected') {
      const isConn =
        item.id === 'web-search' ? enableWebSearch :
        item.id === 'code-runner' ? enableCodeExecution :
        true
      return matchesSearch && isConn
    }
    return matchesSearch
  })

  const filteredProductivity = productivityItems.filter((item) => {
    const matchesSearch = query
      ? item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase())
      : true
    if (filterTab === 'connected') {
      return matchesSearch && item.enabled
    }
    return matchesSearch
  })

  const filteredMcp = mcpServers.filter((server) => {
    const matchesSearch = query
      ? server.name.toLowerCase().includes(query.toLowerCase()) ||
        server.url.toLowerCase().includes(query.toLowerCase())
      : true
    if (filterTab === 'connected') {
      return matchesSearch && server.enabled
    }
    return matchesSearch
  })

  const sectionLabel: React.CSSProperties = {
    margin: '0 0 8px',
    fontSize: 14,
    fontWeight: 600,
    color: isDark ? 'var(--dsw-alias-label-secondary, #999999)' : '#555555',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 1. Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 38,
          padding: '0 14px',
          background: cardBg,
          borderRadius: 999,
          marginBottom: 12,
          border: cardBorder,
          boxSizing: 'border-box',
        }}
      >
        <IconSearchOutline16 size={16} style={{ color: isDark ? '#888888' : '#777777', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm công cụ hoặc dịch vụ..."
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 14,
            color: 'var(--dsw-alias-label-primary, #181818)',
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              border: 'none',
              background: 'transparent',
              color: isDark ? '#aaaaaa' : '#888888',
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Available / Connected Sliding Segmented Control */}
      <div style={{ marginBottom: 20 }}>
        <SlidingSegmentedControl<FilterTab>
          options={[
            { id: 'available', label: 'Có sẵn (Available)' },
            { id: 'connected', label: 'Đã kết nối (Connected)' },
          ]}
          value={filterTab}
          onChange={(val) => setFilterTab(val)}
        />
      </div>

      {/* 3. Featured Section */}
      {filteredFeatured.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={sectionLabel}>Featured</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {filteredFeatured.map((card) => {
              const isEnabled =
                card.id === 'web-search' ? enableWebSearch :
                card.id === 'code-runner' ? enableCodeExecution :
                true

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    if (card.id === 'web-search') updateSettings({ enableWebSearch: !enableWebSearch })
                    else if (card.id === 'code-runner') updateSettings({ enableCodeExecution: !enableCodeExecution })
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px 18px',
                    borderRadius: 18,
                    minHeight: 168,
                    background: cardBg,
                    border: cardBorder,
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = isDark
                      ? '0 8px 24px rgba(0, 0, 0, 0.35)'
                      : '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(0.985)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1)'
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: iconTileBg,
                      display: 'grid',
                      placeItems: 'center',
                      color: card.color,
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--dsw-alias-label-primary, #181818)',
                      marginTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{card.name}</span>
                    {isEnabled && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: '#0878F9',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: isDark ? '#aaaaaa' : '#666666', lineHeight: 1.45, marginTop: 4 }}>
                    {card.desc}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Productivity Section */}
      {filteredProductivity.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h4 style={sectionLabel}>Productivity</h4>
            <span style={{ fontSize: 13, color: isDark ? '#aaaaaa' : '#555555', cursor: 'pointer' }}>
              See all &gt;
            </span>
          </div>

          <div
            style={{
              borderRadius: 18,
              background: cardBg,
              border: cardBorder,
              padding: '4px 16px',
            }}
          >
            {filteredProductivity.map((item, idx) => {
              const isLast = idx === filteredProductivity.length - 1
              return (
                <div key={item.key}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 54,
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: iconTileBg,
                          display: 'grid',
                          placeItems: 'center',
                          color: item.color,
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: isDark ? '#888888' : '#777777', marginTop: 1 }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    {item.onToggle ? (
                      <button
                        type="button"
                        onClick={item.onToggle}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#0878F9',
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {item.enabled ? 'Ngắt kết nối' : 'Connect'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#0878F9' }}>
                        Connect
                      </span>
                    )}
                  </div>
                  {!isLast && <div style={{ height: 1, background: divider, marginLeft: 44 }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. MCP Servers Section */}
      {filteredMcp.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <h4 style={sectionLabel}>MCP Servers</h4>
          <div
            style={{
              borderRadius: 18,
              background: cardBg,
              border: cardBorder,
              padding: '4px 16px',
            }}
          >
            {filteredMcp.map((server, idx) => {
              const isLast = idx === filteredMcp.length - 1
              return (
                <div key={idx}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: 54,
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: iconTileBg,
                          display: 'grid',
                          placeItems: 'center',
                          color: '#0878F9',
                          flexShrink: 0,
                        }}
                      >
                        <IconFolderOpen16 size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
                          {server.name}
                        </div>
                        <div style={{ fontSize: 12, color: isDark ? '#888888' : '#777777', marginTop: 1 }}>
                          {server.url}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = mcpServers.map((s, i) =>
                          i === idx ? { ...s, enabled: !s.enabled } : s
                        )
                        updateSettings({ mcpServers: updated })
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#0878F9',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {server.enabled ? 'Ngắt kết nối' : 'Connect'}
                    </button>
                  </div>
                  {!isLast && <div style={{ height: 1, background: divider, marginLeft: 44 }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

