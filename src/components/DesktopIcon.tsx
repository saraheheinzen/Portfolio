import { useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { usePointerDrag } from '../hooks/usePointerDrag'
import { WinIcon } from './WinIcon'

interface DesktopIconProps {
  id: string
  label: string
  selected: boolean
  cover?: string
  icon?:
    | 'folder'
    | 'documents'
    | 'computer'
    | 'mail'
    | 'user'
    | 'notepad'
    | 'file'
    | 'star'
    | 'player'
    | 'vscode'
    | 'figma'
    | 'steam'
    | 'browser'
    | 'terminal'
    | 'photos'
  onSelect: () => void
  onOpen: () => void
  /** Narrator mode: act as a single-select tab (one click activates). */
  asTab?: boolean
  /** Free-desktop position; when set with onMove, the icon is draggable. */
  position?: { x: number; y: number }
  onMove?: (x: number, y: number) => void
  dragDisabled?: boolean
}

export function DesktopIcon({
  id,
  label,
  selected,
  cover,
  icon = 'file',
  onSelect,
  onOpen,
  asTab = false,
  position,
  onMove,
  dragDisabled = false,
}: DesktopIconProps) {
  const lastTap = useRef(0)
  const rootRef = useRef<HTMLButtonElement>(null)
  const free = Boolean(position && onMove && !asTab)

  const { dragging, onPointerDown, suppressClick } = usePointerDrag({
    x: position?.x ?? 0,
    y: position?.y ?? 0,
    onMove: onMove ?? (() => {}),
    disabled: !free || dragDisabled,
    getBounds: () => {
      const el = rootRef.current
      const parent = el?.parentElement
      if (!el || !parent) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
      }
      return {
        minX: 0,
        minY: 0,
        maxX: Math.max(0, parent.clientWidth - el.offsetWidth),
        maxY: Math.max(0, parent.clientHeight - el.offsetHeight),
      }
    },
  })

  const activate = () => {
    onSelect()
    onOpen()
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (suppressClick()) return
    if (asTab) {
      activate()
      return
    }

    const now = Date.now()
    const isCoarse =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches

    if (isCoarse) {
      activate()
      return
    }

    if (selected && now - lastTap.current < 450) {
      onOpen()
    } else {
      onSelect()
    }
    lastTap.current = now
  }

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (asTab || suppressClick()) return
    onOpen()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activate()
    }
  }

  return (
    <button
      type="button"
      ref={rootRef}
      id={id}
      role={asTab ? 'tab' : undefined}
      aria-selected={asTab ? selected : undefined}
      className={`desktop-icon${selected ? ' is-selected' : ''}${free ? ' is-free' : ''}${dragging ? ' is-dragging' : ''}`}
      style={
        free && position
          ? { left: position.x, top: position.y }
          : undefined
      }
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={free ? onPointerDown : undefined}
      aria-label={asTab ? label : `Open ${label}`}
    >
      <span className="desktop-icon__glyph">
        {cover ? (
          <img src={cover} alt="" className="desktop-icon__cover" draggable={false} />
        ) : (
          <WinIcon name={icon} size={48} />
        )}
      </span>
      <span className="desktop-icon__label">{label}</span>
    </button>
  )
}
