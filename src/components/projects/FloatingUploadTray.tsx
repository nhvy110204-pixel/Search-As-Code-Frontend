import { useState } from 'react'
import clsx from 'clsx'
import {
  Button, Pill, Tooltip,
  IconBrowseOutline16, IconCloseOutline16,
  IconCheckOutline16, IconWarningOutline16,
  IconLoadingOutline16, IconDownloadOutline16
} from '@/components/ui'
import type { UploadQueueItem } from '@/types/project'
import { useSmoothProgress } from './useSmoothProgress'
import css from './FloatingUploadTray.module.css'

export interface FloatingUploadTrayProps {
  items: UploadQueueItem[]
  onClearCompleted: () => void
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function UploadQueueItemRow({ item }: { item: UploadQueueItem }) {
  const isDone = item.status === 'completed'
  const isFailed = item.status === 'failed'
  const isProcessing = !isDone && !isFailed
  const smoothProgress = useSmoothProgress(item.progress, isProcessing, isDone, item.id)

  return (
    <div className={css.queueItem}>
      <div className={css.itemHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <IconBrowseOutline16 size={14} style={{ color: 'var(--dsw-alias-brand-primary)', flexShrink: 0 }} />
          <span className={css.fileName} title={item.name}>{item.name}</span>
          <span className={css.fileSize}>({formatBytes(item.size)})</span>
        </div>

        <div>
          {isDone ? (
            <Pill style={{ color: 'var(--dsw-static-green-500)' }}>
              <IconCheckOutline16 size={11} style={{ marginRight: 4 }} />
              <span>Hoàn thành</span>
            </Pill>
          ) : isFailed ? (
            <Pill style={{ color: 'var(--dsw-static-red-500)' }}>
              <IconWarningOutline16 size={11} style={{ marginRight: 4 }} />
              <span>Lỗi nạp</span>
            </Pill>
          ) : (
            <Pill style={{ color: 'var(--dsw-alias-brand-primary)' }}>
              <IconLoadingOutline16 size={11} className="spin" style={{ marginRight: 4 }} />
              <span>Đang nạp {smoothProgress}%</span>
            </Pill>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className={css.progressTrack}>
        <div
          className={`${css.progressFill} ${isDone ? css.progressFillDone : isFailed ? css.progressFillFailed : ''}`}
          style={{ width: `${smoothProgress}%` }}
        />
      </div>
    </div>
  )
}

export function FloatingUploadTray({ items, onClearCompleted }: FloatingUploadTrayProps) {
  const [minimized, setMinimized] = useState(false)

  if (!items || items.length === 0) return null

  const activeCount = items.filter((i) => i.status !== 'completed' && i.status !== 'failed').length
  const completedCount = items.filter((i) => i.status === 'completed').length
  const failedCount = items.filter((i) => i.status === 'failed').length

  return (
    <div className={css.trayContainer}>
      {minimized ? (
        <Tooltip label="Nhấp để mở rộng bảng tiến trình nạp tài liệu" delayMs={300}>
          <button
            type="button"
            className={css.minimizedPill}
            onClick={() => setMinimized(false)}
          >
            {activeCount > 0 ? (
              <>
                <IconLoadingOutline16 size={14} className="spin" style={{ color: 'var(--dsw-alias-brand-primary)' }} />
                <span className={css.minimizedText}>Đang nạp {activeCount} tài liệu...</span>
              </>
            ) : failedCount > 0 ? (
              <>
                <IconWarningOutline16 size={14} style={{ color: 'var(--dsw-static-red-500)' }} />
                <span className={css.minimizedText}>{failedCount} file lỗi nạp</span>
              </>
            ) : (
              <>
                <IconCheckOutline16 size={14} style={{ color: 'var(--dsw-static-green-500)' }} />
                <span className={css.minimizedText}>Đã nạp xong {completedCount} tài liệu</span>
              </>
            )}
          </button>
        </Tooltip>
      ) : null}

      <div className={clsx(css.expandedCard, minimized && css.hidden)}>
        {/* Header */}
        <div className={css.trayHeader}>
          <div className={css.trayTitleGroup}>
            <IconDownloadOutline16 size={16} style={{ color: 'var(--dsw-alias-brand-primary)', transform: 'rotate(180deg)' }} />
            <span className={css.trayTitle}>
              Tiến trình nạp Tri thức ({completedCount}/{items.length})
            </span>
          </div>

          <div className={css.trayHeaderActions}>
            {completedCount > 0 && activeCount === 0 && (
              <Tooltip label="Dọn dẹp danh sách đã hoàn thành" delayMs={300}>
                <Button variant="ghost" size="sm" onClick={onClearCompleted} style={{ fontSize: 11, height: 22, padding: '0 6px' }}>
                  Dọn sạch
                </Button>
              </Tooltip>
            )}
            <Tooltip label="Thu nhỏ bảng" delayMs={300}>
              <button
                type="button"
                className={css.headerIconBtn}
                onClick={() => setMinimized(true)}
                aria-label="Thu nhỏ"
              >
                ─
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Queue Items List */}
        <div className={css.queueList}>
          {items.map((item) => (
            <UploadQueueItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
