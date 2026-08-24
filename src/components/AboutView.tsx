import { about } from '../data/content'

export function AboutView() {
  return (
    <div className="about-view">
      <header className="about-view__header">
        <div>
          <p className="about-view__eyebrow">Computer · Sarah</p>
          <h1>About me</h1>
          <p className="about-view__role">
            {about.title}
            <br />
            {about.company}
          </p>
        </div>
      </header>

      {about.bio.map((p) => (
        <p key={p.slice(0, 24)} className="about-view__bio">
          {p}
        </p>
      ))}

      <h2>Timeline</h2>
      <ol className="about-view__timeline">
        {about.timeline.map((step, i) => (
          <li key={step.year}>
            <div className="about-view__timeline-step">
              <time dateTime={step.year}>{step.year}</time>
              <span>{step.label}</span>
            </div>
            {i < about.timeline.length - 1 ? (
              <span className="about-view__timeline-arrow" aria-hidden="true">
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <h2>I've helped build the future at</h2>
      <ul className="about-view__companies">
        {about.companies.map((c) => (
          <li key={c.name}>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={c.name}
            >
              <img src={c.logo} alt="" />
            </a>
          </li>
        ))}
      </ul>

      <h2>Skills</h2>
      <ul className="about-view__skills">
        {about.skills.map((s) => (
          <li key={s.label}>
            <img src={s.icon} alt="" width={40} height={40} />
            <div>
              <strong>{s.label}</strong>
              <span>{s.detail}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
