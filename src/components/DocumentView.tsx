interface DocumentViewProps {
  href: string
  title: string
}

export function DocumentView({ href, title }: DocumentViewProps) {
  return (
    <div className="document-view">
      <div className="document-view__toolbar">
        <a className="document-view__link" href={href} download>
          Download
        </a>
      </div>
      <iframe
        className="document-view__frame"
        src={href}
        title={title}
      />
    </div>
  )
}
