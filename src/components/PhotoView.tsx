interface PhotoViewProps {
  src: string
  title: string
  alt: string
}

export function PhotoView({ src, title, alt }: PhotoViewProps) {
  return (
    <div className="photo-view">
      <div className="photo-view__toolbar">
        <a
          className="photo-view__link"
          href={src}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new tab
        </a>
        <a className="photo-view__link" href={src} download>
          Download
        </a>
      </div>
      <div className="photo-view__stage">
        <figure className="photo-view__figure">
          <img className="photo-view__image" src={src} alt={alt} />
          <figcaption className="photo-view__caption" aria-hidden="true">
            {alt}
          </figcaption>
        </figure>
      </div>
    </div>
  )
}
