import { useRef, type KeyboardEvent, type MouseEvent } from 'react'
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
    | 'youtube'
    | 'terminal'
  onSelect: () => void
  onOpen: () => void
  /** Narrator mode: act as a single-select tab (one click activates). */
  asTab?: boolean
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
}: DesktopIconProps) {
  const lastTap = useRef(0)

  const activate = () => {
    onSelect()
    onOpen()
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
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
    if (asTab) return
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
      id={id}
      role={asTab ? 'tab' : undefined}
      aria-selected={asTab ? selected : undefined}
      className={`desktop-icon${selected ? ' is-selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      aria-label={asTab ? label : `Open ${label}`}
    >
      <span className="desktop-icon__glyph">
        {cover ? (
          <img src={cover} alt="" className="desktop-icon__cover" draggable={false} />
        ) : (
          <WinIcon name={icon} size={44} />
        )}
      </span>
      <span className="desktop-icon__label">{label}</span>
    </button>
  )
}
