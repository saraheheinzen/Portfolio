import { useState } from 'react'
import { photoSrc, photos } from '../data/photos'
import { DesktopIcon } from './DesktopIcon'
import { WinIcon } from './WinIcon'

interface PhotosViewProps {
  highContrast: boolean
  onHighContrastChange: (next: boolean) => void
  onOpenPhoto: (photoId: string, title: string, src: string) => void
}

export function PhotosView({
  highContrast,
  onHighContrastChange,
  onOpenPhoto,
}: PhotosViewProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="folder-view">
      <div className="folder-view__toolbar">
        <WinIcon name="photos" size={20} />
        <span>Photos</span>
        <button
          type="button"
          role="switch"
          aria-checked={highContrast}
          aria-label="High contrast photos"
          className={`folder-view__hc-toggle${highContrast ? ' is-on' : ''}`}
          onClick={() => onHighContrastChange(!highContrast)}
        >
          <span className="folder-view__hc-toggle-label">High contrast</span>
          <span className="folder-view__hc-switch" aria-hidden="true">
            <span className="folder-view__hc-switch-thumb" />
          </span>
        </button>
        <span className="folder-view__meta">{photos.length} items</span>
      </div>
      <p className="folder-view__desc">
        {photos.length
          ? highContrast
            ? 'Showing high-contrast versions of the gallery.'
            : 'Pictures from the gallery folder.'
          : 'Drop images into assets/Photos to fill this folder.'}
      </p>
      <div className="folder-view__grid">
        {photos.map((photo) => {
          const src = photoSrc(photo, highContrast)
          return (
            <DesktopIcon
              key={photo.id}
              id={`photo-item-${photo.id}`}
              label={photo.label}
              cover={src}
              selected={selected === photo.id}
              onSelect={() => setSelected(photo.id)}
              onOpen={() => onOpenPhoto(photo.id, photo.label, src)}
            />
          )
        })}
      </div>
    </div>
  )
}
