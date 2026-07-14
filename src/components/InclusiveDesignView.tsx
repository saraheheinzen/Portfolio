const INCLUSIVE_DESIGN_URL = 'https://inclusive.microsoft.design/'

export function InclusiveDesignView() {
  return (
    <div className="site-embed">
      <iframe
        className="site-embed__frame"
        src={INCLUSIVE_DESIGN_URL}
        title="Microsoft Inclusive Design"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
