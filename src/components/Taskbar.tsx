import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { DesktopWindow } from '../hooks/useDesktop'
import type { ProjectCategory } from '../data/content'
import { about } from '../data/content'
import { browserSections } from '../data/browser'
import { PINNED_APPS } from '../data/apps'
import {
  TEXT_SCALE_MAX,
  TEXT_SCALE_MIN,
  type A11yState,
  type A11yToggleKey,
  type ColorFilter,
  type CursorSize,
  type FontFamily,
} from '../hooks/useExploreMode'
import { WinIcon } from './WinIcon'
import { Dropdown } from './Dropdown'

const FILTERS: Array<{ id: ColorFilter; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'grayscale', label: 'Grayscale' },
  { id: 'invert', label: 'Inverted' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
]

const FONTS: Array<{ id: FontFamily; label: string }> = [
  { id: 'default', label: 'Default' },
  { id: 'comic', label: 'Comic Sans' },
  { id: 'legible', label: 'Atkinson Hyperlegible' },
  { id: 'dyslexia', label: 'OpenDyslexic' },
]

const CURSOR_SIZES: Array<{ id: CursorSize; label: string }> = [
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
  { id: 'xlarge', label: 'Extra large' },
  { id: 'xxlarge', label: 'Extra extra large' },
]

function A11yToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`a11y-menu__toggle${checked ? ' is-on' : ''}`}
      onClick={onChange}
    >
      <span className="a11y-menu__toggle-label">{label}</span>
      <span className="a11y-menu__switch" aria-hidden="true">
        <span className="a11y-menu__switch-thumb" />
      </span>
    </button>
  )
}

/** Which pinned taskbar icon a given window belongs to (groups related window kinds). */
function pinnedAppForWindow(win: DesktopWindow): string | null {
  switch (win.kind) {
    case 'browser':
    case 'project':
      return 'browser'
    case 'about':
      return 'about'
    case 'contact':
      return 'contact'
    case 'welcome':
      return 'welcome'
    case 'terminal':
      return 'terminal'
    case 'documents':
    case 'document':
      return 'documents'
    case 'photos':
    case 'photo':
      return 'photos'
    case 'figma':
      return 'figma'
    case 'folder':
      if (win.category === 'games') return 'games'
      if (win.category === 'player') return 'player'
      return null
    default:
      return null
  }
}

interface TaskbarProps {
  windows: DesktopWindow[]
  startOpen: boolean
  magnifierActive: boolean
  a11y: A11yState
  onToggleStart: () => void
  onToggleMagnifier: () => void
  onFocusWindow: (id: string) => void
  onMinimizeWindow: (id: string) => void
  onOpenAbout: () => void
  onOpenContact: () => void
  onOpenBrowser: (route?: string) => void
  onOpenTerminal: () => void
  onOpenWelcome: () => void
  onOpenDocuments: () => void
  onOpenPhotos: () => void
  onOpenFigma: () => void
  onOpenFolder: (category: ProjectCategory) => void
  onToggleA11y: (key: A11yToggleKey) => void
  onColorFilter: (filter: ColorFilter) => void
  onTextScale: (value: number) => void
  onFontFamily: (font: FontFamily) => void
  onCursorSize: (size: CursorSize) => void
}

export function Taskbar({
  windows,
  startOpen,
  magnifierActive,
  a11y,
  onToggleStart,
  onToggleMagnifier,
  onFocusWindow,
  onMinimizeWindow,
  onOpenAbout,
  onOpenContact,
  onOpenBrowser,
  onOpenTerminal,
  onOpenWelcome,
  onOpenDocuments,
  onOpenPhotos,
  onOpenFigma,
  onOpenFolder,
  onToggleA11y,
  onColorFilter,
  onTextScale,
  onFontFamily,
  onCursorSize,
}: TaskbarProps) {
  const [now, setNow] = useState(() => new Date())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const launcherMenuRef = useRef<HTMLDivElement>(null)
  const settingsId = useId()

  const focusAboutMe = () => {
    const aboutButton =
      launcherMenuRef.current?.querySelector<HTMLButtonElement>(
        '[data-start-item="about"]',
      )
    aboutButton?.focus({ preventScroll: true })
  }

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (startOpen) {
      setSettingsOpen(false)
      setMoreOpen(false)
    }
  }, [startOpen])

  useEffect(() => {
    if (!settingsOpen) return
    const onPointer = (e: PointerEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onPointer = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  useEffect(() => {
    if (!startOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onToggleStart()
        if (a11y.keyboardOnly) {
          launcherRef.current?.focus({ preventScroll: true })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startOpen, onToggleStart, a11y.keyboardOnly])

  useLayoutEffect(() => {
    if (!startOpen || !a11y.keyboardOnly) return
    focusAboutMe()
    const id = window.setTimeout(focusAboutMe, 50)
    return () => window.clearTimeout(id)
  }, [startOpen, a11y.keyboardOnly])

  const runStartAction = (
    action: (typeof PINNED_APPS)[number]['action'],
  ) => {
    switch (action) {
      case 'about':
        onOpenAbout()
        break
      case 'browser':
        onOpenBrowser()
        break
      case 'games':
        onOpenFolder('games')
        break
      case 'player':
        onOpenFolder('player')
        break
      case 'contact':
        onOpenContact()
        break
      case 'welcome':
        onOpenWelcome()
        break
      case 'terminal':
        onOpenTerminal()
        break
      case 'documents':
        onOpenDocuments()
        break
      case 'photos':
        onOpenPhotos()
        break
      case 'figma':
        onOpenFigma()
        break
    }
  }

  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const initials = about.name
    .split(' ')
    .map((n) => n[0])
    .join('')

  // Sticky intro lives inside About Me in screen reader mode.
  const pinnedApps = a11y.narrator
    ? PINNED_APPS.filter((app) => app.id !== 'welcome')
    : PINNED_APPS
  const topZIndex = Math.max(
    0,
    ...windows.filter((w) => !w.minimized).map((w) => w.zIndex),
  )

  return (
    <footer className={`dock${startOpen ? ' is-start-open' : ''}`}>
      <div className="dock__shell">
        <div
          className="dock__launcher-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={launcherRef}
            type="button"
            className={`dock__launcher${startOpen ? ' is-active' : ''}`}
            aria-label="Start menu"
            aria-expanded={startOpen}
            aria-haspopup="dialog"
            onClick={onToggleStart}
          >
            SH
            <span className="dock__tooltip">Start</span>
          </button>

          {startOpen ? (
            <div
              ref={launcherMenuRef}
              className="launcher-menu"
              role="dialog"
              aria-label="Start menu"
            >
              <div className="launcher-menu__user">
                <div className="launcher-menu__avatar" aria-hidden="true">
                  {initials}
                </div>
                <div>
                  <strong>{about.name}</strong>
                  <span>{about.title}</span>
                </div>
              </div>

              <div className="launcher-menu__body">
                <nav className="launcher-menu__pane" aria-label="Apps">
                  <p className="launcher-menu__pane-label">Apps</p>
                  <ul className="launcher-menu__list">
                    {PINNED_APPS.map((app) => (
                      <li key={app.id}>
                        <button
                          type="button"
                          className="launcher-menu__item"
                          data-start-item={app.id}
                          autoFocus={a11y.keyboardOnly && app.id === 'about'}
                          onClick={() => runStartAction(app.action)}
                        >
                          <WinIcon name={app.icon} size={28} />
                          <span>{app.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>

                <nav className="launcher-menu__pane launcher-menu__pane--places" aria-label="Browse">
                  <p className="launcher-menu__pane-label">Browse</p>
                  <ul className="launcher-menu__list">
                    {browserSections.map((section) => (
                      <li key={section.id}>
                        <button
                          type="button"
                          className="launcher-menu__item"
                          onClick={() => onOpenBrowser(section.id)}
                        >
                          <span className="launcher-menu__mark" aria-hidden="true">
                            {section.mark}
                          </span>
                          <span>{section.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          ) : null}
        </div>

        <div className="dock__apps" role="list">
          {pinnedApps.map((app) => {
            const matching = windows.filter(
              (w) => pinnedAppForWindow(w) === app.id,
            )
            const openMatches = matching.filter((w) => !w.minimized)
            const isOpen = openMatches.length > 0
            const isMinimized = !isOpen && matching.length > 0
            const isFocused =
              isOpen && openMatches.some((w) => w.zIndex === topZIndex)
            const state = isMinimized ? 'minimized' : isOpen ? 'open' : 'closed'

            return (
              <button
                key={app.id}
                type="button"
                role="listitem"
                data-app={app.id}
                data-state={state}
                className={`dock__app${isOpen ? ' is-open' : ''}${isMinimized ? ' is-minimized' : ''}${isFocused ? ' is-focused' : ''}`}
                aria-pressed={isOpen}
                aria-label={app.label}
                onClick={() => {
                  if (matching.length === 0) {
                    runStartAction(app.action)
                    return
                  }
                  if (isFocused) {
                    openMatches.forEach((w) => onMinimizeWindow(w.id))
                    return
                  }
                  const target = matching
                    .slice()
                    .sort((a, b) => b.zIndex - a.zIndex)[0]
                  onFocusWindow(target.id)
                }}
              >
                <WinIcon name={app.icon} size={22} />
                <span className="dock__app-label">{app.label}</span>
                <span className="dock__app-state" aria-hidden="true" />
              </button>
            )
          })}
        </div>

        <div className="dock__tray">
          <div className="dock__settings-wrap" ref={settingsRef}>
            <button
              type="button"
              className={`dock__settings${settingsOpen ? ' is-active' : ''}`}
              aria-label="Accessibility settings"
              aria-expanded={settingsOpen}
              aria-controls={settingsId}
              onClick={(e) => {
                e.stopPropagation()
                setSettingsOpen((v) => !v)
              }}
            >
              <WinIcon name="accessibility" size={24} />
              <span className="dock__tooltip">Accessibility</span>
            </button>

            {settingsOpen ? (
              <div
                id={settingsId}
                className="a11y-menu"
                role="dialog"
                aria-labelledby={`${settingsId}-title`}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id={`${settingsId}-title`} className="a11y-menu__title">
                  Ways to explore
                </h2>
                <section className="a11y-menu__section" aria-labelledby={`${settingsId}-input`}>
                  <h3 id={`${settingsId}-input`} className="a11y-menu__heading">
                    Interaction
                  </h3>
                  <A11yToggle
                    label="Dwell Cursor"
                    checked={a11y.dwellCursor}
                    onChange={() => onToggleA11y('dwellCursor')}
                  />
                  <div className="a11y-menu__filters">
                    <span>Cursor size</span>
                    <Dropdown
                      value={a11y.cursorSize}
                      options={CURSOR_SIZES}
                      onChange={onCursorSize}
                      aria-label="Cursor size"
                    />
                  </div>
                </section>

                <section className="a11y-menu__section" aria-labelledby={`${settingsId}-vision`}>
                  <h3 id={`${settingsId}-vision`} className="a11y-menu__heading">
                    Vision
                  </h3>
                  <A11yToggle
                    label="Dark Mode"
                    checked={a11y.darkMode}
                    onChange={() => onToggleA11y('darkMode')}
                  />
                  <A11yToggle
                    label="High Contrast"
                    checked={a11y.highContrast}
                    onChange={() => onToggleA11y('highContrast')}
                  />
                  <A11yToggle
                    label="Reduced Motion"
                    checked={a11y.reducedMotion}
                    onChange={() => onToggleA11y('reducedMotion')}
                  />
                  <A11yToggle
                    label="Screen reader mode"
                    checked={a11y.narrator}
                    onChange={() => onToggleA11y('narrator')}
                  />
                  <label className="a11y-menu__scale">
                    <span className="a11y-menu__scale-label">
                      Text size
                      <output htmlFor={`${settingsId}-text-scale`}>
                        {a11y.textScale}%
                      </output>
                    </span>
                    <input
                      id={`${settingsId}-text-scale`}
                      type="range"
                      min={TEXT_SCALE_MIN}
                      max={TEXT_SCALE_MAX}
                      step={2}
                      value={a11y.textScale}
                      onChange={(e) => onTextScale(Number(e.target.value))}
                      aria-label="Text size"
                      aria-valuetext={`${a11y.textScale} percent`}
                    />
                  </label>
                  <div className="a11y-menu__filters">
                    <span>Font</span>
                    <Dropdown
                      value={a11y.fontFamily}
                      options={FONTS}
                      onChange={onFontFamily}
                      aria-label="Font"
                    />
                  </div>
                  <div className="a11y-menu__filters">
                    <span>Color Filters</span>
                    <Dropdown
                      value={a11y.colorFilter}
                      options={FILTERS}
                      onChange={onColorFilter}
                      aria-label="Color Filters"
                    />
                  </div>
                </section>
              </div>
            ) : null}
          </div>

          <div className="dock__quick-group">
            <button
              type="button"
              className={`dock__quick dock__head${a11y.headControl ? ' is-active' : ''}`}
              aria-label={
                a11y.headControl ? 'Turn off head control' : 'Turn on head control'
              }
              aria-pressed={a11y.headControl}
              onClick={(e) => {
                e.stopPropagation()
                onToggleA11y('headControl')
              }}
            >
              <WinIcon name="headControl" size={24} />
              <span className="dock__tooltip">Head Control</span>
            </button>

            <button
              type="button"
              className={`dock__quick dock__voice${a11y.voiceAccess ? ' is-active' : ''}`}
              aria-label={
                a11y.voiceAccess ? 'Turn off voice access' : 'Turn on voice access'
              }
              aria-pressed={a11y.voiceAccess}
              onClick={(e) => {
                e.stopPropagation()
                onToggleA11y('voiceAccess')
              }}
            >
              <WinIcon name="voiceAccess" size={24} />
              <span className="dock__tooltip">Voice Access</span>
            </button>

            <button
              type="button"
              className={`dock__quick dock__mag${magnifierActive ? ' is-active' : ''}`}
              aria-label={magnifierActive ? 'Turn off magnifier' : 'Turn on magnifier'}
              aria-pressed={magnifierActive}
              onClick={(e) => {
                e.stopPropagation()
                onToggleMagnifier()
              }}
            >
              <WinIcon name="magnify" size={24} />
              <span className="dock__tooltip">Magnifier</span>
            </button>
          </div>

          <div className="dock__more-wrap" ref={moreRef}>
            <button
              type="button"
              className={`dock__more${moreOpen ? ' is-active' : ''}`}
              aria-label="More accessibility controls"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={(e) => {
                e.stopPropagation()
                setMoreOpen((v) => !v)
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="4" cy="10" r="1.8" fill="currentColor" />
                <circle cx="10" cy="10" r="1.8" fill="currentColor" />
                <circle cx="16" cy="10" r="1.8" fill="currentColor" />
              </svg>
              <span className="dock__tooltip">More</span>
            </button>

            {moreOpen ? (
              <div className="dock__more-menu" role="menu">
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={a11y.headControl}
                  className={`dock__more-item${a11y.headControl ? ' is-active' : ''}`}
                  onClick={() => {
                    onToggleA11y('headControl')
                    setMoreOpen(false)
                  }}
                >
                  <WinIcon name="headControl" size={22} />
                  <span>Head Control</span>
                </button>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={a11y.voiceAccess}
                  className={`dock__more-item${a11y.voiceAccess ? ' is-active' : ''}`}
                  onClick={() => {
                    onToggleA11y('voiceAccess')
                    setMoreOpen(false)
                  }}
                >
                  <WinIcon name="voiceAccess" size={22} />
                  <span>Voice Access</span>
                </button>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={magnifierActive}
                  className={`dock__more-item${magnifierActive ? ' is-active' : ''}`}
                  onClick={() => {
                    onToggleMagnifier()
                    setMoreOpen(false)
                  }}
                >
                  <WinIcon name="magnify" size={22} />
                  <span>Magnifier</span>
                </button>
              </div>
            ) : null}
          </div>

          <time className="dock__clock" dateTime={now.toISOString()}>
            {time}
          </time>
        </div>
      </div>
    </footer>
  )
}
