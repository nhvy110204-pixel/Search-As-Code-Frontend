import { useState, useEffect, useId } from 'react'
import clsx from 'clsx'
import {
  Modal, Button, Tooltip,
  IconSparkle16, IconRefreshOutline16, IconCheckOutline16,
  IconWarningOutline16, IconLoadingOutline16, IconCodeOutline16,
  IconDataOutline16, IconBrowseOutline16
} from '@/components/ui'
import type { ProjectResponse } from '@/types/project'
import css from './AiAnalyticsModal.module.css'

/**
 * ============================================================================
 * BACKEND API SPECIFICATION NOTE (FOR BACKEND INTEGRATION)
 * ============================================================================
 * Endpoint: POST /api/projects/{projectId}/analytics/ai-audit
 * 
 * Request Payload:
 * {
 *   "tab": "overview" | "pipeline" | "documents" | "sessions",
 *   "time_range": "24h" | "7d" | "30d" | "all",
 *   "force_refresh": boolean
 * }
 * 
 * Expected Response Schema:
 * {
 *   "project_id": string,
 *   "tab": string,
 *   "time_range": string,
 *   "timestamp": string (ISO 8601),
 *   "health_score": number (0 - 100),
 *   "status": "optimal" | "warning" | "critical",
 *   "summary": string,
 *   "strengths": string[],
 *   "bottlenecks": string[],
 *   "recommendations": string[]
 * }
 * ============================================================================
 */

export type AnalyticsTabType = 'overview' | 'pipeline' | 'documents' | 'sessions'

export interface AiAuditReport {
  tab: AnalyticsTabType
  timestamp: string
  healthScore: number
  status: 'optimal' | 'warning' | 'critical'
  summary: string
  strengths: string[]
  bottlenecks: string[]
  recommendations: string[]
}

interface AiAnalyticsModalProps {
  open: boolean
  onClose: () => void
  project: ProjectResponse
  activeTab: AnalyticsTabType
  timeRange: string
  // Cached reports map to retain past analyses
  cachedReports: Partial<Record<AnalyticsTabType, AiAuditReport>>
  onSaveReport: (tab: AnalyticsTabType, report: AiAuditReport) => void
}

const TAB_CONFIG: Record<AnalyticsTabType, { title: string; subtitle: string; icon: any }> = {
  overview: {
    title: 'Tổng Quan & KPIs',
    subtitle: 'Đánh giá toàn diện về chi phí Token, tốc độ phản hồi TTFT và hiệu quả Caching',
    icon: IconDataOutline16,
  },
  pipeline: {
    title: 'Chuỗi Thực Thi SaC',
    subtitle: 'Kiểm toán độ trễ Sandbox Python, vòng lặp sinh mã và thời gian truy vấn Qdrant',
    icon: IconCodeOutline16,
  },
  documents: {
    title: 'Tài Liệu & Trích Dẫn',
    subtitle: 'Phát hiện lỗ hổng tri thức, chất lượng bóc tách Markdown và điểm relevance trích dẫn',
    icon: IconBrowseOutline16,
  },
  sessions: {
    title: 'Chi Tiết Phiên Trò Chuyện',
    subtitle: 'Phân loại chủ đề hội thoại, phát hiện câu hỏi bị timeout và tối ưu intent người dùng',
    icon: IconSparkle16,
  },
}

// Preset tailored AI Audit reports for each tab (Simulated production AI output)
function generateAuditReport(tab: AnalyticsTabType, projectName: string, timeRange: string): AiAuditReport {
  const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  switch (tab) {
    case 'overview':
      return {
        tab: 'overview',
        timestamp: `Hôm nay, ${now}`,
        healthScore: 94,
        status: 'optimal',
        summary: `Hệ thống SaC cho dự án "${projectName}" đang hoạt động với hiệu suất xuất sắc. Tỷ lệ trúng cache 89.4% giúp giảm thiểu 75% chi phí API và rút ngắn độ trễ.`,
        strengths: [
          'Tỷ lệ Cache Hit đạt 89.4% giúp tiết kiệm xấp xỉ 445K token (~$1.42) trong 7 ngày qua.',
          'Tốc độ sinh token trung bình đạt 429 tok/s, vượt trội 28% so với ngưỡng tiêu chuẩn ngành (320 tok/s).',
          'Độ tin cậy trích dẫn đạt 98.2% với 142 dẫn chứng được đối soát chính xác theo chuẩn NotebookLM.',
        ],
        bottlenecks: [
          'Độ trễ nhận token đầu tiên (TTFT avg 3.4s) còn hơi cao ở những câu hỏi yêu cầu đối chiếu tài liệu phức tạp nhiều bảng biểu.',
          'Lượng Token Output ở các câu hỏi phân tích báo cáo tài chính có xu hướng dài hơn mức cần thiết do prompt hệ thống chưa giới hạn độ dài chặt chẽ.',
        ],
        recommendations: [
          'Kích hoạt cơ chế Prompt Prefix Caching riêng biệt cho phần System Directives để giảm thêm ~0.8s TTFT.',
          'Bổ sung chỉ dẫn định dạng phản hồi dạng Bullet Point ngắn gọn trong tab Cài đặt dự án để giảm 15% lượng Output Token thừa.',
          'Duy trì cấu hình Max SaC Iterations = 5 để cân bằng tối ưu giữa độ sâu suy luận và chi phí.',
        ],
      }

    case 'pipeline':
      return {
        tab: 'pipeline',
        timestamp: `Hôm nay, ${now}`,
        healthScore: 91,
        status: 'optimal',
        summary: `Chuỗi thực thi Search-as-Code (SaC) hoạt động ổn định với tỷ lệ thành công của Sandbox đạt 99.2%. Thời gian chạy Python Sandbox chỉ chiếm 12% tổng thời gian.`,
        strengths: [
          'Sandbox Python thực thi mã tìm kiếm an toàn với độ trễ cực thấp (chỉ 4.3s / 12% pipeline).',
          'Chiến lược Multi-hop Parallel Reasoning (65%) hoạt động hiệu quả, xử lý mượt mà các câu hỏi phức tạp cần chia tách sub-queries.',
          'Tần suất lỗi cú pháp mã code do LLM sinh ra chỉ ở mức 0.8%, cơ chế tự sửa lỗi (Self-healing loop) khắc phục ngay trong vòng lặp đầu tiên.',
        ],
        bottlenecks: [
          'Khâu LLM Reasoning & Codegen chiếm 72% thời gian xử lý (75.6s) do mô hình suy luận tư duy CoT (Chain-of-Thought) khá kỹ.',
          'Bước Vector Similarity Search với Qdrant thỉnh thoảng bị trễ thêm 1.5s khi thực hiện truy vấn đồng thời nhiều payload lớn.',
        ],
        recommendations: [
          'Chuyển sang sử dụng Model DeepSeek-V3 cho các câu hỏi tra cứu đơn giản (Single-hop) để tăng tốc độ Codegen gấp 2 lần.',
          'Tối ưu hóa HNSW Index của Qdrant Collection với tham số `ef_search = 64` để giảm thời gian tìm kiếm vector.',
          'Giữ thời gian Sandbox Execution Timeout ở mức 20s như hiện tại là rất an toàn.',
        ],
      }

    case 'documents':
      return {
        tab: 'documents',
        timestamp: `Hôm nay, ${now}`,
        healthScore: 88,
        status: 'optimal',
        summary: `Kho tài liệu của dự án "${projectName}" có độ phủ thông tin tốt. Các tệp báo cáo chính được khai thác triệt để với điểm relevance trung bình trên 0.92.`,
        strengths: [
          'Tệp "Bao_cao_tai_chinh_nam_2025.pdf" được Agent khai thác hiệu quả nhất với 48 lượt trích dẫn và điểm liên quan 0.96.',
          '100% các đoạn trích dẫn đều map chính xác vào vị trí trang và tiêu đề mục tương ứng.',
          'Cấu trúc Markdown bóc tách các bảng biểu tài chính giữ được nguyên vẹn định dạng cột và hàng.',
        ],
        bottlenecks: [
          'Tệp "Thong_so_ky_thuat_API_Gateway.txt" có tỷ lệ trích dẫn thấp (18 lượt) và điểm relevance chỉ đạt 0.89 do chứa nhiều đoạn text thô chưa phân đoạn.',
          'Phát hiện lỗ hổng tri thức: Các câu hỏi liên quan đến kế hoạch ngân sách Q4/2026 chưa có tài liệu tương ứng trong dự án.',
        ],
        recommendations: [
          'Bổ sung thêm tài liệu "Ke_hoach_kinh_doanh_Q4_2026.pdf" để lấp đầy khoảng trống tri thức cho Agent.',
          'Chuyển đổi tệp `.txt` sang định dạng `.md` có phân cấp Heading (#, ##) rõ ràng để tăng chất lượng Chunking thêm 20%.',
          'Đồng bộ lại vector embeddings nếu có cập nhật nội dung mới.',
        ],
      }

    case 'sessions':
      return {
        tab: 'sessions',
        timestamp: `Hôm nay, ${now}`,
        healthScore: 96,
        status: 'optimal',
        summary: `Các phiên trò chuyện trong dự án đạt tỷ lệ hài lòng cao. Người dùng tập trung hỏi sâu về điều khoản hợp đồng và số liệu tài chính với 100% câu trả lời có nguồn dẫn.`,
        strengths: [
          'Số lượt hội thoại trung bình 3-4 turns / phiên chứng minh người dùng tương tác sâu và nhận được câu trả lời thỏa đáng.',
          'Không có phiên trò chuyện nào bị lỗi ngắt quãng giữa chừng (Crash / Abort rate = 0%).',
          'Chiến lược sinh mã song song giúp giải quyết các câu hỏi so sánh phức tạp chỉ trong 1 lần phản hồi.',
        ],
        bottlenecks: [
          'Một số phiên chat có tiêu đề mặc định chưa mô tả rõ nội dung cốt lõi của phiên làm việc.',
        ],
        recommendations: [
          'Tự động kích hoạt tính năng Auto-Rename Session bằng LLM sau lượt hỏi đáp thứ 2 để dễ dàng tìm kiếm lại.',
          'Khuyến khích người dùng sử dụng tính năng Fork Session khi muốn phân nhánh nghiên cứu sâu một chủ đề con.',
        ],
      }
  }
}

export function AiAnalyticsModal({
  open,
  onClose,
  project,
  activeTab,
  timeRange,
  cachedReports,
  onSaveReport,
}: AiAnalyticsModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzingStep, setAnalyzingStep] = useState(0)
  const [copied, setCopied] = useState(false)
  const titleId = useId()

  const currentReport = cachedReports[activeTab] || null
  const tabInfo = TAB_CONFIG[activeTab]
  const TabIcon = tabInfo.icon

  // Run AI Analysis Simulation (with 4-step progressive state)
  const handleStartAnalysis = () => {
    setIsAnalyzing(true)
    setAnalyzingStep(1)

    setTimeout(() => {
      setAnalyzingStep(2)
    }, 600)

    setTimeout(() => {
      setAnalyzingStep(3)
    }, 1200)

    setTimeout(() => {
      setAnalyzingStep(4)
    }, 1800)

    setTimeout(() => {
      const newReport = generateAuditReport(activeTab, project.name, timeRange)
      onSaveReport(activeTab, newReport)
      setIsAnalyzing(false)
      setAnalyzingStep(0)
    }, 2400)
  }

  // Copy Markdown Report to Clipboard
  const handleCopyReport = () => {
    if (!currentReport) return
    const text = `
# Báo Cáo Phân Tích AI: ${tabInfo.title}
* Dự án: ${project.name}
* Thời gian: ${currentReport.timestamp}
* Điểm sức khỏe: ${currentReport.healthScore}/100 (${currentReport.status.toUpperCase()})

## 📝 Tóm tắt:
${currentReport.summary}

## ⚡ Điểm mạnh nổi bật:
${currentReport.strengths.map((s) => `- ${s}`).join('\n')}

## ⚠️ Điểm nghẽn phát hiện:
${currentReport.bottlenecks.map((b) => `- ${b}`).join('\n')}

## 💡 Khuyến nghị tối ưu:
${currentReport.recommendations.map((r) => `- ${r}`).join('\n')}
    `.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`AI Phân Tích & Cố Vấn Tối Ưu: ${tabInfo.title}`}
      headless
      className={css.modalContainer}
    >
      <div className={css.modalShell}>
        {/* 1. Modal Top Bar */}
        <div className={css.topBar}>
          <div className={css.topBarLeft}>
            <div className={css.sparkleBadge}>
              <IconSparkle16 size={18} className={css.sparkleIcon} />
            </div>
            <div>
              <h2 id={titleId} className={css.modalTitle}>
                AI Phân Tích & Cố Vấn Tối Ưu: {tabInfo.title}
              </h2>
              <p className={css.modalSubtitle}>{tabInfo.subtitle}</p>
            </div>
          </div>
          <button type="button" className={css.closeBtn} onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* 2. Modal Body */}
        <div className={css.modalBody}>
          {/* STATE 2: ANALYZING (Loading radar) */}
          {isAnalyzing && (
            <div className={css.analyzingState}>
              <div className={css.radarWrap}>
                <div className={css.radarRing} />
                <div className={css.radarCore}>
                  <IconSparkle16 size={24} className={css.pulseSparkle} />
                </div>
              </div>
              <h3 className={css.analyzingTitle}>AI đang kiểm toán dữ liệu...</h3>
              <p className={css.analyzingDesc}>
                {analyzingStep === 1 && '1/4. Đang quét telemetry logs và metrics của dự án...'}
                {analyzingStep === 2 && '2/4. Kiểm toán độ trễ Sandbox Python & Vòng lặp SaC...'}
                {analyzingStep === 3 && '3/4. Đối soát tỷ lệ Cache Hit & Độ tin cậy trích dẫn...'}
                {analyzingStep === 4 && '4/4. Tổng hợp khuyến nghị tối ưu hóa hệ thống...'}
              </p>
            </div>
          )}

          {/* STATE 1: EMPTY STATE (Chưa phân tích) */}
          {!isAnalyzing && !currentReport && (
            <div className={css.emptyState}>
              <div className={css.emptyIconCircle}>
                <TabIcon size={28} className={css.emptyIcon} />
              </div>
              <h3 className={css.emptyTitle}>
                Chưa có báo cáo phân tích AI cho phân mục này
              </h3>
              <p className={css.emptyDesc}>
                Trợ lý AI sẽ phân tích chuyên sâu toàn bộ log thực thi Search-as-Code, độ trễ sandbox,
                hiệu quả bộ nhớ đệm và đối soát nguồn trích dẫn để đưa ra các gợi ý tối ưu cụ thể cho dự án của bạn.
              </p>
              <Button
                variant="primary"
                size="md"
                className={css.startBtn}
                onClick={handleStartAnalysis}
              >
                <IconSparkle16 size={16} style={{ marginRight: 8 }} />
                <span>Bắt đầu AI Phân tích {tabInfo.title}</span>
              </Button>
            </div>
          )}

          {/* STATE 3: RESULT STATE (Đã có báo cáo) */}
          {!isAnalyzing && currentReport && (
            <div className={css.reportContent}>
              {/* Health Score Banner */}
              <div className={css.healthBanner}>
                <div className={css.healthScoreBlock}>
                  <span className={css.healthScoreNum}>{currentReport.healthScore}</span>
                  <span className={css.healthScoreMax}>/100</span>
                </div>
                <div className={css.healthTextWrap}>
                  <div className={css.healthTitleRow}>
                    <span className={css.healthStatusBadge}>
                      {currentReport.healthScore >= 90 ? '🌟 Hoạt động Rất Tối Ưu' : '⚠️ Cần Lưu Ý Tối Ưu'}
                    </span>
                    <span className={css.healthTimeText}>{currentReport.timestamp}</span>
                  </div>
                  <p className={css.healthSummary}>{currentReport.summary}</p>
                </div>
              </div>

              {/* 3 Sections: Strengths, Bottlenecks, Recommendations */}
              <div className={css.sectionsGrid}>
                {/* 1. Strengths */}
                <div className={css.sectionCard}>
                  <div className={css.sectionHeader}>
                    <IconCheckOutline16 size={16} className={css.greenIcon} />
                    <h4 className={css.sectionTitle}>Điểm Sáng Nổi Bật</h4>
                  </div>
                  <ul className={css.bulletList}>
                    {currentReport.strengths.map((item, idx) => (
                      <li key={idx} className={css.bulletItem}>
                        <span className={css.greenBullet}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Bottlenecks */}
                <div className={css.sectionCard}>
                  <div className={css.sectionHeader}>
                    <IconWarningOutline16 size={16} className={css.warnIcon} />
                    <h4 className={css.sectionTitle}>Điểm Nghẽn & Rủi Ro Phát Hiện</h4>
                  </div>
                  <ul className={css.bulletList}>
                    {currentReport.bottlenecks.map((item, idx) => (
                      <li key={idx} className={css.bulletItem}>
                        <span className={css.warnBullet}>!</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Actionable Recommendations */}
                <div className={clsx(css.sectionCard, css.recCard)}>
                  <div className={css.sectionHeader}>
                    <IconSparkle16 size={16} className={css.brandIcon} />
                    <h4 className={css.sectionTitle}>Khuyến Nghị Hành Động Ngay</h4>
                  </div>
                  <ul className={css.bulletList}>
                    {currentReport.recommendations.map((item, idx) => (
                      <li key={idx} className={css.bulletItem}>
                        <span className={css.recBullet}>💡</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Modal Footer */}
        <div className={css.modalFooter}>
          <div className={css.footerLeft}>
            {currentReport && !isAnalyzing && (
              <span className={css.footerTimestamp}>
                Cập nhật: {currentReport.timestamp}
              </span>
            )}
          </div>
          <div className={css.footerActions}>
            {currentReport && !isAnalyzing && (
              <>
                <Tooltip label="Sao chép toàn bộ báo cáo phân tích định dạng Markdown" delayMs={200}>
                  <Button variant="outline" size="sm" onClick={handleCopyReport}>
                    {copied ? 'Đã sao chép ✓' : 'Sao chép báo cáo'}
                  </Button>
                </Tooltip>
                <Tooltip label="Chạy lại AI kiểm toán và làm mới các khuyến nghị" delayMs={200}>
                  <Button variant="outline" size="sm" onClick={handleStartAnalysis}>
                    <IconRefreshOutline16 size={14} style={{ marginRight: 6 }} />
                    <span>Phân tích lại</span>
                  </Button>
                </Tooltip>
              </>
            )}
            <Button variant={currentReport ? 'primary' : 'outline'} size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
