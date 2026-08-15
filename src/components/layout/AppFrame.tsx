import { useState, useCallback, useRef } from 'react'
import { SidebarRoot } from '@/components/sidebar/SidebarRoot'
import { ConversationRoot } from '@/components/conversation/ConversationRoot'
import { SettingsRoot } from '@/components/settings/SettingsRoot'
import css from './AppFrame.module.css'

export function AppFrame() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [dragging, setDragging] = useState(false)

  const originX = useRef(0)
  const startWidth = useRef(260)

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    originX.current = e.clientX
    startWidth.current = sidebarWidth
    setDragging(true)
  }, [sidebarWidth])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const dx = e.clientX - originX.current
    const newWidth = Math.max(180, Math.min(420, startWidth.current + dx))
    setSidebarWidth(newWidth)
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }, [])

  const gridColumns = sidebarCollapsed ? '56px 1fr' : `${sidebarWidth}px 1fr`

  return (
    <div
      className={css.frame}
      style={{ gridTemplateColumns: gridColumns }}
      data-dragging={dragging || undefined}
    >
      <div className={css.sidebarCol}>
        <SidebarRoot
          collapsed={sidebarCollapsed}
          width={sidebarWidth}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {!sidebarCollapsed && (
        <div
          className={css.handle}
          style={{ left: sidebarWidth }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}

      <div className={css.centerCol}>
        <ConversationRoot />
      </div>

      <SettingsRoot />
    </div>
  )
}
