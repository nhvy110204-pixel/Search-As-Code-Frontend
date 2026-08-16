import { useState, useMemo } from 'react'
import clsx from 'clsx'
import {
  Button, Input, Tooltip, Menu,
  IconDataOutline16, IconCodeOutline16, IconSparkle16,
  IconRefreshOutline16, IconBrowseOutline16, IconCheckOutline16,
  IconDownloadOutline16, IconChevronDownOutline14, IconInspectOutline12,
  IconEllipsisOutline16
} from '@/components/ui'
import { useChatStore } from '@/store/useChatStore'
import { useViewStore } from '@/store/useViewStore'
import { AiAnalyticsModal, type AiAuditReport } from './AiAnalyticsModal'
import { SessionTraceModal } from './SessionTraceModal'
import {
  exportTelemetryToCsv,
  exportTelemetryToJson,
  exportTelemetryToMarkdown,
} from './exportTelemetry'
import type { ProjectResponse, DocumentResponse } from '@/types/project'
import css from './ProjectAnalyticsView.module.css'

export interface ProjectAnalyticsViewProps {
  project: ProjectResponse
  documents: DocumentResponse[]
}

type TabType = 'overview' | 'pipeline' | 'documents' | 'sessions'
type TimeRange = '24h' | '7d' | '30d' | 'all'

interface TabItem {
  id: TabType
  label: string
  icon: any
  desc: string
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Tổng quan & KPIs', icon: IconDataOutline16, desc: 'Hiệu suất, tốc độ và lượng token tiêu thụ' },
  { id: 'pipeline', label: 'Chuỗi thực thi SaC', icon: IconCodeOutline16, desc: 'Phân bổ độ trễ Sandbox, LLM và Vector search' },
  { id: 'documents', label: 'Tài liệu & Trích dẫn', icon: IconBrowseOutline16, desc: 'Tần suất tra cứu tài liệu và độ phủ tri thức' },
  { id: 'sessions', label: 'Chi tiết Phiên chat', icon: IconSparkle16, desc: 'Chỉ số đo lường chi tiết từng lượt hội thoại' },
]

interface SessionMetricItem {
  id: string
  title: string
  date: string
  turns: number
  steps: number
  llmTime: string
  toolTime: string
  ttft: string
  tokPerSec: number
  cacheHit: number
  inputTokens: string
  outputTokens: string
  citations: number
  verifiedPct: number
  strategy: 'Multi-hop Parallel' | 'Single-hop Search' | 'Direct Q&A'
}

export function ProjectAnalyticsView({ project, documents }: ProjectAnalyticsViewProps) {
  const { sessions } = useChatStore()
  const { navigateToChat } = useViewStore()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [selectedTraceSession, setSelectedTraceSession] = useState<SessionMetricItem | null>(null)
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null)
  const [cachedReports, setCachedReports] = useState<Partial<Record<TabType, AiAuditReport>>>({})

  const handleSaveReport = (tab: TabType, report: AiAuditReport) => {
    setCachedReports((prev) => ({ ...prev, [tab]: report }))
  }

  const handleExportSelect = (id: string) => {
    setIsExportMenuOpen(false)
    if (id === 'export-csv') {
      exportTelemetryToCsv(project, sessionMetrics, timeRange)
    } else if (id === 'export-json') {
      exportTelemetryToJson(project, sessionMetrics, documents, timeRange)
    } else if (id === 'export-markdown') {
      exportTelemetryToMarkdown(project, sessionMetrics, documents, timeRange)
    }
  }

  // Filter project-specific sessions or generate realistic metrics
  const projectSessions = useMemo(() => {
    return sessions.filter((s) => s.projectId === project.id)
  }, [sessions, project.id])

  const sessionMetrics: SessionMetricItem[] = useMemo(() => {
    const defaultData: SessionMetricItem[] = [
      {
        id: 'sess-1',
        title: 'Phân tích đối chiếu điều khoản bồi thường hợp đồng Q3',
        date: 'Hôm nay, 14:25',
        turns: 3,
        steps: 25,
        llmTime: '1m 45s',
        toolTime: '4.3s',
        ttft: '3.4s',
        tokPerSec: 429,
        cacheHit: 89,
        inputTokens: '499.2K',
        outputTokens: '8.8K',
        citations: 6,
        verifiedPct: 100,
        strategy: 'Multi-hop Parallel',
      },
      {
        id: 'sess-2',
        title: 'So sánh chỉ số biên lợi nhuận ròng giữa các báo cáo tài chính',
        date: 'Hôm qua, 09:12',
        turns: 4,
        steps: 32,
        llmTime: '2m 10s',
        toolTime: '6.1s',
        ttft: '2.9s',
        tokPerSec: 450,
        cacheHit: 92,
        inputTokens: '612.0K',
        outputTokens: '11.4K',
        citations: 8,
        verifiedPct: 100,
        strategy: 'Multi-hop Parallel',
      },
      {
        id: 'sess-3',
        title: 'Tổng hợp các quy định bảo mật dữ liệu khách hàng theo GDPR',
        date: '14/08/2026',
        turns: 2,
        steps: 14,
        llmTime: '48s',
        toolTime: '2.8s',
        ttft: '3.1s',
        tokPerSec: 412,
        cacheHit: 85,
        inputTokens: '280.5K',
        outputTokens: '5.2K',
        citations: 4,
        verifiedPct: 95,
        strategy: 'Single-hop Search',
      },
      {
        id: 'sess-4',
        title: 'Tra cứu thông số kỹ thuật tiêu chuẩn API Gateway và Rate Limit',
        date: '12/08/2026',
        turns: 2,
        steps: 12,
        llmTime: '35s',
        toolTime: '1.9s',
        ttft: '2.4s',
        tokPerSec: 468,
        cacheHit: 94,
        inputTokens: '195.0K',
        outputTokens: '4.1K',
        citations: 3,
        verifiedPct: 100,
        strategy: 'Single-hop Search',
      },
    ]

    if (projectSessions.length > 0) {
      return projectSessions.map((s, idx) => {
        const mock = defaultData[idx % defaultData.length]
        return {
          ...mock,
          id: s.id,
          title: s.title || `Phiên trò chuyện #${idx + 1}`,
          date: new Date(s.updatedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        }
      })
    }

    return defaultData
  }, [projectSessions])

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessionMetrics
    const q = searchQuery.toLowerCase()
    return sessionMetrics.filter((s) => s.title.toLowerCase().includes(q))
  }, [sessionMetrics, searchQuery])

  // Top cited documents in project
  const topDocuments = useMemo(() => {
    if (documents.length > 0) {
      return documents.map((doc, idx) => ({
        id: doc.id,
        name: doc.file_name,
        citations: Math.max(8, 48 - idx * 10),
        chunksQueried: Math.max(16, 86 - idx * 15),
        relevanceAvg: Math.max(0.85, 0.96 - idx * 0.03).toFixed(2),
        verifiedPct: 100,
      }))
    }
    return [
      { id: '1', name: 'Bao_cao_tai_chinh_nam_2025.pdf', citations: 48, chunksQueried: 86, relevanceAvg: '0.96', verifiedPct: 100 },
      { id: '2', name: 'Kien_truc_he_thong_Search_as_Code.md', citations: 36, chunksQueried: 64, relevanceAvg: '0.94', verifiedPct: 100 },
      { id: '3', name: 'Quy_trinh_bao_mat_du_lieu_2026.docx', citations: 24, chunksQueried: 42, relevanceAvg: '0.91', verifiedPct: 96 },
      { id: '4', name: 'Thong_so_ky_thuat_API_Gateway.txt', citations: 18, chunksQueried: 30, relevanceAvg: '0.89', verifiedPct: 100 },
    ]
  }, [documents])

  return (
    <div className={css.container}>
      {/* 1. Left Nav Rail */}
      <nav className={css.nav}>
        <div className={css.navTitle}>Chỉ số & Giám sát</div>
        <div className={css.navList}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                className={clsx(css.navCell, isActive && css.active)}
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
        {/* Fixed Header Row with Title + AI Button on top, Time Filter underneath */}
        <div className={css.contentHeader}>
          <div className={css.headerTopRow}>
            <div className={css.titleCluster}>
              <h2 className={css.tabTitle}>
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className={css.tabSubtitle}>
                {TABS.find((t) => t.id === activeTab)?.desc}
              </p>
            </div>

            <div className={css.headerActionsGroup}>
              <Tooltip label={`Mở trợ lý AI kiểm toán dữ liệu và khuyến nghị cho ${TABS.find((t) => t.id === activeTab)?.label}`} delayMs={250}>
                <Button
                  variant="outline"
                  size="sm"
                  className={css.aiAuditBtn}
                  onClick={() => setIsAiModalOpen(true)}
                >
                  <IconSparkle16 size={14} className={css.sparkleIcon} />
                  <span>AI Phân tích</span>
                </Button>
              </Tooltip>

              <Menu
                open={isExportMenuOpen}
                onClose={() => setIsExportMenuOpen(false)}
                portal={true}
                align="end"
                side="bottom"
                items={[
                  {
                    id: 'export-csv',
                    label: 'Xuất dữ liệu CSV (Excel)',
                    icon: <IconDataOutline16 size={15} />,
                  },
                  {
                    id: 'export-json',
                    label: 'Xuất Telemetry JSON (Raw)',
                    icon: <IconCodeOutline16 size={15} />,
                  },
                  {
                    id: 'export-markdown',
                    label: 'Xuất Báo cáo Markdown',
                    icon: <IconBrowseOutline16 size={15} />,
                  },
                ]}
                onSelect={handleExportSelect}
                anchor={
                  <Tooltip label="Tải báo cáo hiệu năng và token ra tệp CSV / JSON / Markdown" delayMs={250}>
                    <Button
                      variant="outline"
                      size="sm"
                      className={css.exportBtn}
                      onClick={() => setIsExportMenuOpen((prev) => !prev)}
                    >
                      <IconDownloadOutline16 size={14} style={{ marginRight: 6 }} />
                      <span>Xuất báo cáo</span>
                    </Button>
                  </Tooltip>
                }
              />
            </div>
          </div>

          <div className={css.headerSubRow}>
            <div className={css.timeFilterGroup}>
              {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={clsx(css.filterBtn, timeRange === t && css.filterBtnActive)}
                  onClick={() => setTimeRange(t)}
                >
                  {t === '24h' ? '24h' : t === '7d' ? '7 ngày' : t === '30d' ? '30 ngày' : 'Tất cả'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab 1: Tổng quan & KPIs */}
        {activeTab === 'overview' && (
          <div className={css.tabBody}>
            <div className={css.kpiGrid}>
              {/* Card 1 */}
              <div className={css.kpiCard}>
                <div className={css.kpiHeader}>
                  <span className={css.kpiTitle}>Vòng lặp & Bước SaC</span>
                </div>
                <div className={css.kpiValueRow}>
                  <span className={css.kpiBigVal}>3</span>
                  <span className={css.kpiUnit}>turns</span>
                  <span className={css.kpiDivider}>·</span>
                  <span className={css.kpiBigVal}>25</span>
                  <span className={css.kpiUnit}>steps</span>
                </div>
                <div className={css.kpiSubtext}>
                  Trung bình 3 lượt sinh mã & 25 bước sandbox cho mỗi câu hỏi
                </div>
              </div>

              {/* Card 2 */}
              <div className={css.kpiCard}>
                <div className={css.kpiHeader}>
                  <span className={css.kpiTitle}>Phân bổ Độ trễ (Latency)</span>
                </div>
                <div className={css.kpiValueRow}>
                  <span className={css.kpiBigVal}>1m 45s</span>
                  <span className={css.kpiUnit}>LLM</span>
                  <span className={css.kpiDivider}>·</span>
                  <span className={css.kpiBigVal}>4.3s</span>
                  <span className={css.kpiUnit}>Tool call</span>
                </div>
                <div className={css.kpiSubtext}>
                  88% thời gian suy luận LLM · 12% thực thi Sandbox Python
                </div>
              </div>

              {/* Card 3 */}
              <div className={css.kpiCard}>
                <div className={css.kpiHeader}>
                  <span className={css.kpiTitle}>Tốc độ & TTFT trung bình</span>
                </div>
                <div className={css.kpiValueRow}>
                  <span className={css.kpiBigVal}>3.4s</span>
                  <span className={css.kpiUnit}>TTFT</span>
                  <span className={css.kpiDivider}>·</span>
                  <span className={css.kpiBigVal}>429</span>
                  <span className={css.kpiUnit}>tok/s</span>
                </div>
                <div className={css.kpiSubtext}>
                  Độ trễ token đầu tiên 3.4s · Băng thông phản hồi 429 token/giây
                </div>
              </div>

              {/* Card 4 */}
              <div className={css.kpiCard}>
                <div className={css.kpiHeader}>
                  <span className={css.kpiTitle}>Tỷ lệ Trúng Cache (Cache Hit)</span>
                </div>
                <div className={css.kpiValueRow}>
                  <span className={clsx(css.kpiBigVal, css.greenHighlight)}>89.4%</span>
                  <span className={css.kpiUnit}>Hit Rate</span>
                </div>
                <div className={css.kpiSubtext}>
                  Tiết kiệm ~445K token nhờ Redis Semantic & KV Context Cache
                </div>
              </div>

              {/* Card 5 */}
              <div className={css.kpiCard}>
                <div className={css.kpiHeader}>
                  <span className={css.kpiTitle}>Lượng Token Tiêu Thụ</span>
                </div>
                <div className={css.kpiValueRow}>
                  <span className={css.kpiBigVal}>499K</span>
                  <span className={css.kpiUnit}>Input</span>
                  <span className={css.kpiDivider}>·</span>
                  <span className={css.kpiBigVal}>8.8K</span>
                  <span className={css.kpiUnit}>Output</span>
                </div>
                <div className={css.kpiSubtext}>
                  Chi phí ước tính: ~$0.38 (Tiết kiệm ~$1.42 nhờ Caching)
                </div>
              </div>

              {/* Card 6 */}
              <div className={css.kpiCard}>
                <div className={css.kpiHeader}>
                  <span className={css.kpiTitle}>Độ Tin Cậy Trích Dẫn</span>
                </div>
                <div className={css.kpiValueRow}>
                  <span className={clsx(css.kpiBigVal, css.greenHighlight)}>98.2%</span>
                  <span className={css.kpiUnit}>Verified</span>
                </div>
                <div className={css.kpiSubtext}>
                  142 khẳng định đã được đối soát chính xác với nguồn tài liệu
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Chuỗi thực thi SaC (Pipeline) */}
        {activeTab === 'pipeline' && (
          <div className={css.tabBody}>
            {/* Latency Pipeline Bar */}
            <div className={css.panelCard}>
              <div className={css.panelHeader}>
                <h3 className={css.panelTitle}>Phân Bổ Thời Gian Chuỗi Thực Thi SaC</h3>
                <span className={css.panelBadge}>100% End-to-End Trace</span>
              </div>
              <div className={css.pipelineBarWrap}>
                <div className={css.pipelineBar}>
                  <Tooltip label="LLM Reasoning & Codegen: 72% (75.6s)" delayMs={200}>
                    <div className={css.segmentLLM} style={{ width: '72%' }} />
                  </Tooltip>
                  <Tooltip label="Python Sandbox Execution: 12% (12.6s)" delayMs={200}>
                    <div className={css.segmentSandbox} style={{ width: '12%' }} />
                  </Tooltip>
                  <Tooltip label="Qdrant Vector Retrieval: 10% (10.5s)" delayMs={200}>
                    <div className={css.segmentVector} style={{ width: '10%' }} />
                  </Tooltip>
                  <Tooltip label="Grounding & Rerank: 6% (6.3s)" delayMs={200}>
                    <div className={css.segmentRerank} style={{ width: '6%' }} />
                  </Tooltip>
                </div>
              </div>
              <div className={css.legendGrid}>
                <div className={css.legendItem}>
                  <span className={clsx(css.legendDot, css.dotLLM)} />
                  <span className={css.legendLabel}>LLM Reasoning & Codegen</span>
                  <span className={css.legendVal}>72% (75.6s)</span>
                </div>
                <div className={css.legendItem}>
                  <span className={clsx(css.legendDot, css.dotSandbox)} />
                  <span className={css.legendLabel}>Python Sandbox Execution</span>
                  <span className={css.legendVal}>12% (12.6s)</span>
                </div>
                <div className={css.legendItem}>
                  <span className={clsx(css.legendDot, css.dotVector)} />
                  <span className={css.legendLabel}>Qdrant Vector Retrieval</span>
                  <span className={css.legendVal}>10% (10.5s)</span>
                </div>
                <div className={css.legendItem}>
                  <span className={clsx(css.legendDot, css.dotRerank)} />
                  <span className={css.legendLabel}>Grounding & Rerank</span>
                  <span className={css.legendVal}>6% (6.3s)</span>
                </div>
              </div>
            </div>

            {/* SaC Search Strategy Distribution */}
            <div className={css.panelCard}>
              <div className={css.panelHeader}>
                <h3 className={css.panelTitle}>Chiến Lược Tìm Kiếm SaC Được Áp Dụng</h3>
                <span className={css.panelBadge}>Tự động điều phối</span>
              </div>
              <div className={css.strategyList}>
                <div className={css.strategyRow}>
                  <div className={css.strategyInfo}>
                    <span className={css.strategyName}>Multi-hop Parallel Reasoning</span>
                    <span className={css.strategyDesc}>Agent sinh code chia câu hỏi thành nhiều sub-queries và tìm kiếm song song</span>
                  </div>
                  <span className={css.strategyPct}>65%</span>
                </div>
                <div className={css.strategyRow}>
                  <div className={css.strategyInfo}>
                    <span className={css.strategyName}>Single-hop Vector Search</span>
                    <span className={css.strategyDesc}>Truy xuất trực tiếp các đoạn văn bản tương đồng cao trong không gian dự án</span>
                  </div>
                  <span className={css.strategyPct}>28%</span>
                </div>
                <div className={css.strategyRow}>
                  <div className={css.strategyInfo}>
                    <span className={css.strategyName}>Direct Synthesis & Summary</span>
                    <span className={css.strategyDesc}>Tổng hợp tổng thể nội dung dựa trên bộ nhớ ngữ cảnh và metadata</span>
                  </div>
                  <span className={css.strategyPct}>7%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tài liệu & Trích dẫn */}
        {activeTab === 'documents' && (
          <div className={css.tabBody}>
            <div className={css.panelCard}>
              <div className={css.panelHeader}>
                <h3 className={css.panelTitle}>Top Tài Liệu Được Truy Vấn Nhiều Nhất Trong Dự Án</h3>
                <span className={css.panelBadge}>{topDocuments.length} files</span>
              </div>
              <div className={css.docList}>
                {topDocuments.map((doc, idx) => (
                  <div key={doc.id} className={css.docItem}>
                    <div className={css.docRank}>#{idx + 1}</div>
                    <div className={css.docInfo}>
                      <div className={css.docName}>{doc.name}</div>
                      <div className={css.docSub}>
                        {doc.chunksQueried} chunks đã quét · Relevance {doc.relevanceAvg} · {doc.verifiedPct}% Verified
                      </div>
                    </div>
                    <div className={css.docCiteCount}>
                      <span className={css.citeNum}>{doc.citations}</span>
                      <span className={css.citeLabel}>trích dẫn</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Chi tiết Phiên chat */}
        {activeTab === 'sessions' && (
          <div className={css.tabBody}>
            <div className={css.tableSection}>
              <div className={css.tableHeaderToolbar}>
                <div className={css.searchWrap}>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm phiên chat..."
                    className={css.sessionSearchInput}
                  />
                </div>
                <span className={css.sessionCountText}>
                  Hiển thị {filteredSessions.length} phiên trò chuyện
                </span>
              </div>

              <div className={css.tableContainer}>
                <div className={css.tableHeaderRow}>
                  <span>Phiên Trò Chuyện</span>
                  <span>Vòng Lặp & Bước</span>
                  <span>Độ Trễ (LLM / Tool)</span>
                  <span>Tốc Độ & TTFT</span>
                  <span>Cache Hit</span>
                  <span>Tokens</span>
                  <span>Trích Dẫn</span>
                  <span style={{ textAlign: 'right' }}>Thao Tác</span>
                </div>

                {filteredSessions.map((s) => (
                  <div key={s.id} className={css.tableRow}>
                    {/* Col 1 */}
                    <div className={css.sessionCell}>
                      <Tooltip label={s.title} delayMs={300}>
                        <div className={css.sessionTitle}>{s.title}</div>
                      </Tooltip>
                      <div className={css.sessionDate}>{s.date} · <span className={css.strategyBadge}>{s.strategy}</span></div>
                    </div>

                    {/* Col 2 */}
                    <div className={css.metricCell}>
                      <span className={css.boldMetric}>{s.turns} turns</span>
                      <span className={css.subMetric}>{s.steps} steps</span>
                    </div>

                    {/* Col 3 */}
                    <div className={css.metricCell}>
                      <span className={css.boldMetric}>LLM {s.llmTime}</span>
                      <span className={css.subMetric}>Tool {s.toolTime}</span>
                    </div>

                    {/* Col 4 */}
                    <div className={css.metricCell}>
                      <span className={css.boldMetric}>{s.ttft} TTFT</span>
                      <span className={css.subMetric}>{s.tokPerSec} tok/s</span>
                    </div>

                    {/* Col 5 */}
                    <div>
                      <span className={clsx(css.cacheBadge, s.cacheHit >= 90 && css.cacheBadgeHigh)}>
                        {s.cacheHit}%
                      </span>
                    </div>

                    {/* Col 6 */}
                    <div className={css.metricCell}>
                      <span className={css.boldMetric}>{s.inputTokens} in</span>
                      <span className={css.subMetric}>{s.outputTokens} out</span>
                    </div>

                    {/* Col 7 */}
                    <div>
                      <span className={css.citationBadge}>
                        {s.citations} ({s.verifiedPct}%)
                      </span>
                    </div>

                    {/* Col 8: Actions Menu */}
                    <div className={css.actionsCell}>
                      <Menu
                        open={menuOpenSessionId === s.id}
                        onClose={() => setMenuOpenSessionId(null)}
                        align="end"
                        portal
                        anchor={
                          <Tooltip label="Tùy chọn phiên chat" delayMs={300}>
                            <button
                              type="button"
                              className={css.menuButton}
                              data-active={menuOpenSessionId === s.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpenSessionId(menuOpenSessionId === s.id ? null : s.id)
                              }}
                              aria-label="Tùy chọn phiên chat"
                            >
                              <IconEllipsisOutline16 size={16} />
                            </button>
                          </Tooltip>
                        }
                        items={[
                          {
                            id: 'trace',
                            label: 'Xem Trace Timeline SaC',
                            icon: <IconInspectOutline12 size={14} />,
                          },
                          {
                            id: 'open-chat',
                            label: 'Mở phiên trò chuyện',
                            icon: <IconSparkle16 size={14} />,
                          },
                        ]}
                        onSelect={(actionId) => {
                          setMenuOpenSessionId(null)
                          if (actionId === 'trace') {
                            setSelectedTraceSession(s)
                          } else if (actionId === 'open-chat') {
                            navigateToChat(s.id, project.id)
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Telemetry & Insights Modal */}
      <AiAnalyticsModal
        open={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        project={project}
        activeTab={activeTab}
        timeRange={timeRange}
        cachedReports={cachedReports}
        onSaveReport={handleSaveReport}
      />

      {/* SaC Execution Trace Timeline Modal */}
      <SessionTraceModal
        open={selectedTraceSession !== null}
        onClose={() => setSelectedTraceSession(null)}
        session={selectedTraceSession}
        project={project}
      />
    </div>
  )
}
