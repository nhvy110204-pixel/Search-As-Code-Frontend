import { useState, useCallback, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { SidebarRoot } from '@/components/sidebar/SidebarRoot'
import { ConversationRoot } from '@/components/conversation/ConversationRoot'
import { SettingsRoot } from '@/components/settings/SettingsRoot'
import css from './AppFrame.module.css'

const SIDEBAR_AUTO_COLLAPSE = 1024
const MOBILE_BREAKPOINT = 768

export function AppFrame() {
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200))
  const isMobile = viewportWidth < MOBILE_BREAKPOINT
  const isNarrow = viewportWidth < SIDEBAR_AUTO_COLLAPSE

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < SIDEBAR_AUTO_COLLAPSE : false))
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [dragging, setDragging] = useState(false)

  const originX = useRef(0)
  const startWidth = useRef(260)
  const frameRef = useRef<HTMLDivElement>(null)

  // Track viewport width changes
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      setViewportWidth(w)
      if (w < SIDEBAR_AUTO_COLLAPSE && !sidebarCollapsed && !isMobile) {
        setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [sidebarCollapsed, isMobile])

  // Drag handle for sidebar resizing on desktop
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    originX.current = e.clientX
    startWidth.current = sidebarWidth
    setDragging(true)
  }, [sidebarWidth, isMobile])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const dx = e.clientX - originX.current
    const newWidth = Math.max(200, Math.min(420, startWidth.current + dx))
    setSidebarWidth(newWidth)
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }, [])

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileDrawerOpen((v) => !v)
    } else {
      setSidebarCollapsed((v) => !v)
    }
  }

  // Grid columns definition:
  // Desktop: 56px (rail) or sidebarWidth (expanded) + 1fr (chat)
  // Mobile: 1fr (chat full width, sidebar is fixed overlay)
  const gridColumns = isMobile
    ? '1fr'
    : sidebarCollapsed
    ? '56px 1fr'
    : `${sidebarWidth}px 1fr`

  return (
    <div
      ref={frameRef}
      className={css.frame}
      style={{ gridTemplateColumns: gridColumns }}
      data-dragging={dragging || undefined}
    >
      {/* Mobile Drawer Mask */}
      {isMobile && (
        <div
          className={clsx(css.mobileBackdrop, mobileDrawerOpen && css.mobileBackdropActive)}
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Column */}
      <div
        className={clsx(
          css.sidebarCol,
          isMobile && css.sidebarDrawer,
          isMobile && mobileDrawerOpen && css.sidebarDrawerOpen
        )}
      >
        <SidebarRoot
          collapsed={!isMobile && sidebarCollapsed}
          width={sidebarWidth}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Resize Drag Handle (Desktop only) */}
      {!sidebarCollapsed && !isMobile && (
        <div
          className={css.handle}
          style={{ left: sidebarWidth }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          aria-label="Resize sidebar"
        />
      )}

      {/* Main Conversation Center Column */}
      <div className={css.centerCol}>
        <ConversationRoot onOpenMobileSidebar={() => setMobileDrawerOpen(true)} isMobile={isMobile} />
      </div>

      {/* Settings Modal Layer */}
      <SettingsRoot />
    </div>
  )
}
