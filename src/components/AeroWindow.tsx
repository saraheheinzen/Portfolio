import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import type { DesktopWindow } from '../hooks/useDesktop'

const MIN_W = 320
const MIN_H = 220

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface AeroWindowProps {
  win: DesktopWindow
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onToggleMaximize: () => void
  onMove: (x: number, y: number) => void
  onResize: (next: {
    x: number
    y: number
    width: number
    height: number
  }) => void
  children: ReactNode
  focused: boolean
  /** Stack in document flow — no drag/resize (narrator / screen reader). */
  linear?: boolean
}

export function AeroWindow({
  win,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  children,
  focused,
  linear = false,
}: AeroWindowProps) {
  const rootRef = useRef<HTMLElement>(null)
  const dragRef = useRef<{
    ox: number
    oy: number
    sx: number
    sy: number
  } | null>(null)

  const resizeRef = useRef<{
    edge: ResizeEdge
    ox: number
    oy: number
    sx: number
    sy: number
    sw: number
    sh: number
  } | null>(null)

  useEffect(() => {
    if (!focused || win.minimized) return
    const root = rootRef.current
    if (!root) return
    if (root.contains(document.activeElement)) return

    // Defer so the window is painted after open/focus from a desktop icon.
    const id = window.requestAnimationFrame(() => {
      root.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(id)
  }, [focused, win.minimized, win.zIndex, win.id])

  useEffect(() => {
    if (linear) return
    const onMovePointer = (e: PointerEvent) => {
      if (win.maximized) return

      if (dragRef.current) {
        const { ox, oy, sx, sy } = dragRef.current
        onMove(sx + (e.clientX - ox), sy + (e.clientY - oy))
        return
      }

      if (!resizeRef.current) return
      const { edge, ox, oy, sx, sy, sw, sh } = resizeRef.current
      const dx = e.clientX - ox
      const dy = e.clientY - oy

      let x = sx
      let y = sy
      let width = sw
      let height = sh

      if (edge.includes('e')) width = Math.max(MIN_W, sw + dx)
      if (edge.includes('s')) height = Math.max(MIN_H, sh + dy)
      if (edge.includes('w')) {
        width = Math.max(MIN_W, sw - dx)
        x = sx + (sw - width)
      }
      if (edge.includes('n')) {
        height = Math.max(MIN_H, sh - dy)
        y = sy + (sh - height)
      }

      onResize({ x, y, width, height })
    }

    const onUp = () => {
      dragRef.current = null
      resizeRef.current = null
    }

    window.addEventListener('pointermove', onMovePointer)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMovePointer)
      window.removeEventListener('pointerup', onUp)
    }
  }, [linear, onMove, onResize, win.maximized])

  const onTitlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      onFocus()
      if (linear || win.maximized) return
      dragRef.current = {
        ox: e.clientX,
        oy: e.clientY,
        sx: win.x,
        sy: win.y,
      }
    },
    [linear, onFocus, win.maximized, win.x, win.y],
  )

  const onResizePointerDown = useCallback(
    (edge: ResizeEdge) => (e: ReactPointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onFocus()
      if (linear || win.maximized) return
      resizeRef.current = {
        edge,
        ox: e.clientX,
        oy: e.clientY,
        sx: win.x,
        sy: win.y,
        sw: win.width,
        sh: win.height,
      }
    },
    [linear, onFocus, win.maximized, win.x, win.y, win.width, win.height],
  )

  if (win.minimized) return null

  const isSticky = win.kind === 'welcome'

  const style = linear
    ? { zIndex: win.zIndex }
    : win.maximized && !isSticky
      ? {
          left: 12,
          top: 12,
          width: 'calc(100% - 24px)',
          height: 'calc(100% - 96px)',
          zIndex: win.zIndex,
        }
      : {
          left: win.x,
          top: win.y,
          width: win.width,
          height: win.height,
          zIndex: win.zIndex,
        }

  const edges: ResizeEdge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

  return (
    <section
      ref={rootRef}
      className={`os-window${isSticky ? ' os-window--sticky' : ''}${focused ? ' is-focused' : ''}${win.maximized && !isSticky ? ' is-max' : ''}${linear ? ' is-linear' : ''}`}
      style={style}
      role="dialog"
      aria-modal={focused && !linear ? true : undefined}
      aria-label={win.title}
      tabIndex={-1}
      onMouseDown={onFocus}
      onPointerDown={isSticky && !linear ? onTitlePointerDown : undefined}
    >
      {isSticky ? (
        linear ? null : (
          <div className="os-window__sticky-bar">
            <button
              type="button"
              className="os-ctrl close"
              aria-label="Close sticky"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        )
      ) : (
        <header className="os-window__title" onPointerDown={onTitlePointerDown}>
          <span className="os-window__title-text">{win.title}</span>
          {linear ? null : (
            <div className="os-window__controls">
              <button
                type="button"
                className="os-ctrl minimize"
                aria-label="Minimize"
                onClick={onMinimize}
              >
                –
              </button>
              <button
                type="button"
                className="os-ctrl maximize"
                aria-label={win.maximized ? 'Restore' : 'Maximize'}
                onClick={onToggleMaximize}
              >
                ▢
              </button>
              <button
                type="button"
                className="os-ctrl close"
                aria-label="Close"
                onClick={onClose}
              >
                ×
              </button>
            </div>
          )}
        </header>
      )}
      <div className="os-window__body">{children}</div>

      {!isSticky && !win.maximized && !linear
        ? edges.map((edge) => (
            <div
              key={edge}
              className={`os-window__resize os-window__resize--${edge}`}
              onPointerDown={onResizePointerDown(edge)}
              aria-hidden="true"
            />
          ))
        : null}
    </section>
  )
}
