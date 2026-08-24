import type { ChecklistId } from '../hooks/useStickyChecklist'

interface WelcomeViewProps {
  variant?: 'default' | 'screenReader'
  onOpenAbout: () => void
  onOpenBrowser: (route?: string) => void
  /** Screen reader sticky: open a place by action id. */
  onOpenPlace?: (action: ScreenReaderPlaceAction) => void
  onOpenGames?: () => void
  onOpenContact?: () => void
  checked?: Set<ChecklistId>
  onToggleChecklist?: (id: ChecklistId) => void
}

const CHECKLIST: Array<{ id: ChecklistId; label: string }> = [
  { id: 'browser', label: 'Browse Featured & Product work' },
  { id: 'case-study', label: 'Open a case study' },
  { id: 'games', label: 'Peek at Games' },
  { id: 'player', label: 'Play something in Media Player' },
  { id: 'a11y', label: 'Try an accessibility setting' },
  { id: 'clippy', label: 'Ask Finnley a question' },
  { id: 'contact', label: 'Say hi via Contact' },
]

const EMPTY_CHECKED: Set<ChecklistId> = new Set()

/**
 * Places on the screen-reader sticky — same names and order as the
 * narrator tab bar (Sticky itself is omitted; it lives inside About Me).
 */
export const SCREEN_READER_PLACES = [
  { key: '1', label: 'About Me', action: 'about' as const },
  { key: '2', label: 'Browser', action: 'browser' as const },
  { key: '3', label: 'Media Player', action: 'player' as const },
  { key: '4', label: 'Games', action: 'games' as const },
  { key: '5', label: 'Documents', action: 'documents' as const },
  { key: '6', label: 'Photos', action: 'photos' as const },
  { key: '7', label: 'Figma', action: 'figma' as const },
  { key: '8', label: 'Contact', action: 'contact' as const },
  { key: '9', label: 'Terminal', action: 'terminal' as const },
] as const

export type ScreenReaderPlaceAction =
  (typeof SCREEN_READER_PLACES)[number]['action']

function ScreenReaderSticky({
  onOpenPlace,
}: {
  onOpenPlace: (action: ScreenReaderPlaceAction) => void
}) {
  return (
    <div className="sticky-note sticky-note--screen-reader">
      <p className="sticky-note__label">Start here</p>
      <h1 className="sticky-note__title">Welcome!</h1>
      <p className="sticky-note__body">
        This experience has been reorganized for screen readers.
        Instead of navigating windows, you&rsquo;ll move through collections,
        stories, and projects.
      </p>
      <p className="sticky-note__body">
        There are {SCREEN_READER_PLACES.length} places to begin.
      </p>
      <ul className="sticky-note__places" aria-label="Places to begin">
        {SCREEN_READER_PLACES.map((place) => (
          <li key={place.key}>
            <button type="button" onClick={() => onOpenPlace(place.action)}>
              {place.key}. {place.label}
            </button>
          </li>
        ))}
      </ul>
      <ul className="sticky-note__tips">
        <li>Press H to move by headings.</li>
        <li>
          Press 1–{SCREEN_READER_PLACES.length} to jump between sections.
        </li>
        <li>Or keep reading and I&rsquo;ll introduce each one.</li>
      </ul>
    </div>
  )
}

export function WelcomeView({
  variant = 'default',
  onOpenPlace,
  checked = EMPTY_CHECKED,
  onToggleChecklist,
}: WelcomeViewProps) {
  const toggle = (id: ChecklistId) => onToggleChecklist?.(id)

  if (variant === 'screenReader') {
    return (
      <ScreenReaderSticky
        onOpenPlace={onOpenPlace ?? (() => undefined)}
      />
    )
  }

  return (
    <div className="sticky-note">
      <h1 className="sticky-note__title">Welcome!</h1>
      <p className="sticky-note__body">
        A few things worth trying while you&rsquo;re here:
      </p>
      <ul className="sticky-note__checklist">
        {CHECKLIST.map((item) => {
          const isOn = checked.has(item.id)
          return (
            <li key={item.id}>
              <label className={isOn ? 'is-checked' : undefined}>
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => toggle(item.id)}
                />
                <span>{item.label}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
