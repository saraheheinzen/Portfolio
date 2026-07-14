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

      <h2>I've helped build the future at</h2>
      <ul className="about-view__companies">
        {about.companies.map((c) => (
          <li key={c.name}>
            <a href={c.url} target="_blank" rel="noopener noreferrer">
              {c.name}
            </a>
          </li>
        ))}
      </ul>

      <h2>Skills</h2>
      <ul className="about-view__skills">
        {about.skills.map((s) => (
          <li key={s.label}>
            <img src={s.icon} alt="" width={36} height={36} />
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
