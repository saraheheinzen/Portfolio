import { toFigmaEmbedUrl } from '../data/figma'

interface FigmaEmbedViewProps {
  shareUrl: string
  title: string
}

export function FigmaEmbedView({ shareUrl, title }: FigmaEmbedViewProps) {
  const embedSrc = toFigmaEmbedUrl(shareUrl)

  return (
    <div className="figma-embed">
      <iframe
        className="figma-embed__frame"
        src={embedSrc}
        title={title}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
