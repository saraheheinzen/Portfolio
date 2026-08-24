import { PINNED_APPS, type AppAction } from '../data/apps'
import { WinIcon } from './WinIcon'

interface MobileHomeGridProps {
  onOpen: (action: AppAction) => void
}

/** Phone home screen: a plain app grid instead of floating windows. */
export function MobileHomeGrid({ onOpen }: MobileHomeGridProps) {
  return (
    <div className="mobile-home" role="list" aria-label="Apps">
      {PINNED_APPS.map((app) => (
        <button
          key={app.id}
          type="button"
          role="listitem"
          className="mobile-home__app"
          onClick={() => onOpen(app.action)}
        >
          <span className="mobile-home__glyph">
            <WinIcon name={app.icon} size={40} />
          </span>
          <span className="mobile-home__label">{app.label}</span>
        </button>
      ))}
    </div>
  )
}
