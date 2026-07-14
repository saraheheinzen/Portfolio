import { useEffect, useId, useRef, useState } from 'react'
import type { DesktopWindow } from '../hooks/useDesktop'
import type { ProjectCategory } from '../data/content'
import { about } from '../data/content'
import { browserSections } from '../data/browser'
import {
  TEXT_SCALE_MAX,
  TEXT_SCALE_MIN,
  type A11yState,
  type ColorFilter,
} from '../hooks/useExploreMode'
import { WinIcon } from './WinIcon'

const FILTERS: Array<{ id: ColorFilter; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'grayscale', label: 'Grayscale' },
  { id: 'invert', label: 'Inverted' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
]

type AppIcon =
  | 'user'
  | 'browser'
  | 'steam'
  | 'youtube'
  | 'mail'
  | 'notepad'
  | 'terminal'

const START_APPS: Array<{
  id: string
  label: string
  icon: AppIcon
  action: 'about' | 'browser' | 'games' | 'youtube' | 'contact' | 'welcome' | 'terminal'
}> = [
  { id: 'about', label: 'About Me', icon: 'user', action: 'about' },
  { id: 'browser', label: 'Browser', icon: 'browser', action: 'browser' },
  { id: 'games', label: 'Games', icon: 'steam', action: 'games' },
  { id: 'youtube', label: 'YouTube', icon: 'youtube', action: 'youtube' },
  { id: 'contact', label: 'Contact', icon: 'mail', action: 'contact' },
  { id: 'welcome', label: 'Sticky', icon: 'notepad', action: 'welcome' },
  { id: 'terminal', label: 'Terminal', icon: 'terminal', action: 'terminal' },
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

interface TaskbarProps {
  windows: DesktopWindow[]
  startOpen: boolean
  magnifierActive: boolean
  a11y: A11yState
  onToggleStart: () => void
  onToggleMagnifier: () => void
  onFocusWindow: (id: string) => void
  onOpenAbout: () => void
  onOpenContact: () => void
  onOpenBrowser: (route?: string) => void
  onOpenTerminal: () => void
  onOpenWelcome: () => void
  onOpenFolder: (category: ProjectCategory) => void
  onToggleA11y: (
    key: keyof Omit<A11yState, 'mode' | 'colorFilter' | 'textScale'>,
  ) => void
  onColorFilter: (filter: ColorFilter) => void
  onTextScale: (value: number) => void
  onChangeExplore: () => void
}

export function Taskbar({
  windows,
  startOpen,
  magnifierActive,
  a11y,
  onToggleStart,
  onToggleMagnifier,
  onFocusWindow,
  onOpenAbout,
  onOpenContact,
  onOpenBrowser,
  onOpenTerminal,
  onOpenWelcome,
  onOpenFolder,
  onToggleA11y,
  onColorFilter,
  onTextScale,
  onChangeExplore,
}: TaskbarProps) {
  const [now, setNow] = useState(() => new Date())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const settingsId = useId()

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (startOpen) setSettingsOpen(false)
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
    if (!startOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startOpen, onToggleStart])

  const runStartAction = (
    action: (typeof START_APPS)[number]['action'],
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
      case 'youtube':
        onOpenFolder('youtube')
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
    }
  }

  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const initials = about.name
    .split(' ')
    .map((n) => n[0])
    .join('')

  return (
    <footer className="dock">
      <div className="dock__shell">
        <div
          className="dock__launcher-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={`dock__launcher${startOpen ? ' is-active' : ''}`}
            aria-label="Start menu"
            aria-expanded={startOpen}
            aria-haspopup="dialog"
            onClick={onToggleStart}
          >
            SH
          </button>

          {startOpen ? (
            <div
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
                    {START_APPS.map((app) => (
                      <li key={app.id}>
                        <button
                          type="button"
                          className="launcher-menu__item"
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
          {windows.map((w) => (
            <button
              key={w.id}
              type="button"
              role="listitem"
              className={`dock__app${w.minimized ? '' : ' is-open'}`}
              onClick={() => onFocusWindow(w.id)}
              title={w.title}
            >
              {w.kind === 'welcome'
                ? w.title
                : w.title.replace(/\s*[—–-]\s*.*$/, '')}
            </button>
          ))}
        </div>

        <div className="dock__tray">
          <div className="dock__settings-wrap" ref={settingsRef}>
            <button
              type="button"
              className={`dock__settings${settingsOpen ? ' is-active' : ''}`}
              aria-label="Accessibility settings"
              aria-expanded={settingsOpen}
              aria-controls={settingsId}
              title="Accessibility settings"
              onClick={(e) => {
                e.stopPropagation()
                setSettingsOpen((v) => !v)
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="9.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
                <circle cx="12" cy="7" r="1.85" fill="currentColor" />
                <path
                  d="M7.5 11h9M12 11.25v4.25M12 15.5l-2.75 4M12 15.5l2.75 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {settingsOpen ? (
              <div
                id={settingsId}
                className="a11y-menu"
                role="dialog"
                aria-label="Accessibility settings"
                onClick={(e) => e.stopPropagation()}
              >
                <section className="a11y-menu__section" aria-labelledby={`${settingsId}-input`}>
                  <h3 id={`${settingsId}-input`} className="a11y-menu__heading">
                    Interaction
                  </h3>
                  <A11yToggle
                    label="Head Control"
                    checked={a11y.headControl}
                    onChange={() => onToggleA11y('headControl')}
                  />
                  <A11yToggle
                    label="Dwell Cursor"
                    checked={a11y.dwellCursor}
                    onChange={() => onToggleA11y('dwellCursor')}
                  />
                  <A11yToggle
                    label="Voice Access"
                    checked={a11y.voiceAccess}
                    onChange={() => onToggleA11y('voiceAccess')}
                  />
                </section>

                <section className="a11y-menu__section" aria-labelledby={`${settingsId}-explore`}>
                  <h3 id={`${settingsId}-explore`} className="a11y-menu__heading">
                    Explore
                  </h3>
                  <button
                    type="button"
                    className="a11y-menu__item a11y-menu__item--nav"
                    onClick={() => {
                      setSettingsOpen(false)
                      onChangeExplore()
                    }}
                  >
                    <span>Change explore mode</span>
                    <svg
                      className="a11y-menu__caret"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 3.5 10.5 8 6 12.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
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
                  <label className="a11y-menu__filters">
                    <span>Color Filters</span>
                    <select
                      value={a11y.colorFilter}
                      onChange={(e) =>
                        onColorFilter(e.target.value as ColorFilter)
                      }
                      aria-label="Color Filters"
                    >
                      {FILTERS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={`dock__mag${magnifierActive ? ' is-active' : ''}`}
            aria-label={magnifierActive ? 'Turn off magnifier' : 'Turn on magnifier'}
            aria-pressed={magnifierActive}
            title="Magnifier"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMagnifier()
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <circle
                cx="10.5"
                cy="10.5"
                r="6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
              />
              <path
                d="M15.5 15.5L21 21"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <time className="dock__clock" dateTime={now.toISOString()}>
            {time}
          </time>
        </div>
      </div>
    </footer>
  )
}
