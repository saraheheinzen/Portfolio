interface PhotoViewProps {
  src: string
  title: string
  alt: string
}

export function PhotoView({ src, alt }: PhotoViewProps) {
  return (
    <div className="photo-view">
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
