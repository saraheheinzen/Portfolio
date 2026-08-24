import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

const DRAG_THRESHOLD = 5

export interface DragBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * Pointer drag for free-positioned desktop items.
 * Call suppressClick() at the start of click handlers to ignore post-drag clicks.
 * Set invertY when the Y axis is CSS `bottom` (screen-down increases, CSS value decreases).
 */
export function usePointerDrag({
  x,
  y,
  onMove,
  disabled = false,
  invertY = false,
  getBounds,
}: {
  x: number
  y: number
  onMove: (x: number, y: number) => void
  disabled?: boolean
  invertY?: boolean
  getBounds?: () => DragBounds
}) {
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    ox: number
    oy: number
    sx: number
    sy: number
  } | null>(null)
  const movedRef = useRef(false)
  const posRef = useRef({ x, y })
  const onMoveRef = useRef(onMove)
  const getBoundsRef = useRef(getBounds)
  const invertYRef = useRef(invertY)

  posRef.current = { x, y }
  onMoveRef.current = onMove
  getBoundsRef.current = getBounds
  invertYRef.current = invertY

  useEffect(() => {
    if (disabled) return

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return

      const dx = e.clientX - drag.ox
      const dy = e.clientY - drag.oy
      if (!movedRef.current) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        movedRef.current = true
        setDragging(true)
      }

      let nextX = drag.sx + dx
      let nextY = invertYRef.current ? drag.sy - dy : drag.sy + dy
      const bounds = getBoundsRef.current?.()
      if (bounds) {
        nextX = clamp(nextX, bounds.minX, bounds.maxX)
        nextY = clamp(nextY, bounds.minY, bounds.maxY)
      }
      onMoveRef.current(nextX, nextY)
    }

    const onUp = () => {
      if (!dragRef.current) return
      dragRef.current = null
      setDragging(false)
      // Keep movedRef true briefly so the synthetic click is suppressed.
      window.setTimeout(() => {
        movedRef.current = false
      }, 0)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [disabled])

  const onPointerDown = (e: ReactPointerEvent) => {
    if (disabled || e.button !== 0) return
    // Don’t steal interaction from nested controls.
    if (
      (e.target as HTMLElement).closest(
        'input, textarea, select, a, .clippy-panel__close, .clippy-chip, .clippy-action, .clippy-panel__form button, .clippy-panel__messages',
      )
    ) {
      return
    }
    movedRef.current = false
    dragRef.current = {
      ox: e.clientX,
      oy: e.clientY,
      sx: posRef.current.x,
      sy: posRef.current.y,
    }
  }

  const suppressClick = () => movedRef.current || dragging

  return { dragging, onPointerDown, suppressClick }
}
