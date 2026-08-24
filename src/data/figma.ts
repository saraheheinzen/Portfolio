export interface FigmaLiveFile {
  id: string
  label: string
  /** Figma share link — file must allow “Anyone with the link” to view */
  url: string
}

/** Live Figma files embedded in the app (File → Share → Copy link). */
export const figmaFiles: FigmaLiveFile[] = [
  {
    id: 'uw-applied-ux',
    label: 'UW Applied UX',
    url: 'https://www.figma.com/board/ce92LsxTXTjzKUSR4Gpyt0/UW-Applied-UX?node-id=0-1&t=f5x5wr2tkDoymZmK-1',
  },
  {
    id: 'oobe-accessibility',
    label: 'OOBE Accessibility',
    url: 'https://www.figma.com/design/QLlxlUnSKzW6MdyUidmxX5/OOBE-Accessibility?node-id=25-2&t=3kcW44JKJSjqH3Eh-1',
  },
  {
    id: 'spatial-platform',
    label: 'Spatial Platform 5.0',
    url: 'https://www.figma.com/design/DwGuX4fg8BXaBWa08zTYtb/Spatial-Platform-5.0--Copy-?node-id=1083-2244',
  },
]

/** Turn a Figma share URL into an embeddable iframe src. */
export function toFigmaEmbedUrl(shareUrl: string): string {
  const normalized = shareUrl.trim()
  if (!normalized) return ''
  if (normalized.includes('figma.com/embed')) return normalized
  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(normalized)}`
}
