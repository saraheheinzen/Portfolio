import {
  blogEntries,
  speakingBeyondStage,
  speakingEntries,
} from '../data/browser'

interface KnowledgeListViewProps {
  kind: 'speaking' | 'blog'
}

export function KnowledgeListView({ kind }: KnowledgeListViewProps) {
  if (kind === 'speaking') {
    return (
      <div className="knowledge-list">
        <header className="knowledge-list__header">
          <h1>Speaking</h1>
          <p className="knowledge-list__lede">
            Talks and conversations on inclusive product, play, and adaptive
            systems.
          </p>
        </header>
        <ul className="knowledge-list__items">
          {speakingEntries.map((entry) => (
            <li key={entry.id}>
              <article className="knowledge-list__item">
                <p className="knowledge-list__event">{entry.event}</p>
                <h2>{entry.title}</h2>
                <p>{entry.summary}</p>
              </article>
            </li>
          ))}
        </ul>
        <section className="knowledge-list__aside" aria-labelledby="beyond-stage">
          <h2 id="beyond-stage">{speakingBeyondStage.title}</h2>
          <p>{speakingBeyondStage.summary}</p>
        </section>
      </div>
    )
  }

  return (
    <div className="knowledge-list">
      <header className="knowledge-list__header">
        <h1>Blog</h1>
        <p className="knowledge-list__lede">
          Notes on craft, access, and building curious things.
        </p>
      </header>
      <ul className="knowledge-list__items">
        {blogEntries.map((entry) => (
          <li key={entry.id}>
            <article className="knowledge-list__item knowledge-list__item--article">
              <p className="knowledge-list__meta">{entry.date}</p>
              <h2>{entry.title}</h2>
              <p className="knowledge-list__summary">{entry.summary}</p>
              {entry.body?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              {entry.url ? (
                <p className="knowledge-list__source">
                  <a href={entry.url} target="_blank" rel="noreferrer">
                    Originally published on LinkedIn
                  </a>
                </p>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
