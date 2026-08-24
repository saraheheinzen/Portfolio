const photoModules = import.meta.glob<string>(
  '../../assets/Photos/*.{jpg,jpeg,png,gif,webp,avif}',
  { eager: true, query: '?url', import: 'default' },
)

const hcPhotoModules = import.meta.glob<string>(
  '../../assets/Photos/High contrast/*.{jpg,jpeg,png,gif,webp,avif}',
  { eager: true, query: '?url', import: 'default' },
)

function labelFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, '')
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function idFromPath(path: string) {
  const filename = path.split('/').pop() ?? 'photo'
  return filename.replace(/\.[^.]+$/, '')
}

const photoDetails: Record<string, { label: string; alt: string }> = {
  '1779416546008.jpg': {
    label: 'Accessibility Booth',
    alt: 'Overhead view of a Microsoft accessibility booth where a presenter demonstrates a handheld adaptive device to visitors beside Surface laptops and tablets.',
  },
  '1779416547501.jpg': {
    label: 'Inclusive Tech Lab',
    alt: 'Five people pose outside the Inclusive Tech Lab entrance, including someone seated in a power wheelchair, with the yellow Inclusive Tech Lab sign on the glass door.',
  },
  '1779416551317.jpg': {
    label: 'Ability Summit 2026',
    alt: 'Two people stand beside a large outdoor Ability Summit 2026 sign with gradient blue letters spelling Ability and white letters spelling Summit 2026.',
  },
  '1779416575940.jpg': {
    label: 'Adaptive Gaming Setup',
    alt: 'Close-up of hands using an Xbox controller and Xbox Adaptive Controller while Call of Duty plays on a monitor, with a phone showing a Cephable voice-control app.',
  },
  '1779416579013.jpg': {
    label: 'GAAD at the Lab',
    alt: 'Two people watch a wall display streaming a GAAD 2026 session on Call of Duty Black Ops 7 and Cephable at the Microsoft Inclusive Tech Lab, with live captions on screen.',
  },
}

const hcById = Object.fromEntries(
  Object.entries(hcPhotoModules).map(([path, src]) => [idFromPath(path), src]),
)

export const photos = Object.entries(photoModules)
  .map(([path, src]) => {
    const filename = path.split('/').pop() ?? 'photo'
    const id = filename.replace(/\.[^.]+$/, '')
    const details = photoDetails[filename]
    const label = details?.label ?? labelFromFilename(filename)
    const alt = details?.alt ?? label
    return { id, label, src, alt, hcSrc: hcById[id] as string | undefined }
  })
  .sort((a, b) => a.label.localeCompare(b.label))

export type Photo = (typeof photos)[number]

/** Resolve the display URL for a photo, swapping in the HC asset when available. */
export function photoSrc(photo: Photo, highContrast: boolean) {
  return highContrast && photo.hcSrc ? photo.hcSrc : photo.src
}

export function findPhoto(idOrSrc: string) {
  return photos.find((photo) => photo.id === idOrSrc || photo.src === idOrSrc)
}

export function resolvePhotoSrc(idOrSrc: string, highContrast: boolean) {
  const photo = findPhoto(idOrSrc)
  return photo ? photoSrc(photo, highContrast) : idOrSrc
}
