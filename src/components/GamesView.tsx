import { useMemo, useState } from 'react'
import { getProjectsByCategory, type Project } from '../data/content'

type SortMode = 'alphabetical' | 'recent'

interface GamesViewProps {
  onOpenProject: (id: string) => void
}

function sortGames(games: Project[], mode: SortMode) {
  const next = [...games]
  if (mode === 'alphabetical') {
    next.sort((a, b) => a.title.localeCompare(b.title))
  }
  return next
}

export function GamesView({ onOpenProject }: GamesViewProps) {
  const library = useMemo(() => getProjectsByCategory('games'), [])
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortMode>('alphabetical')

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const base = q
      ? library.filter(
          (g) =>
            g.title.toLowerCase().includes(q) ||
            g.tags.toLowerCase().includes(q) ||
            g.summary.toLowerCase().includes(q),
        )
      : library
    return sortGames(base, sortBy)
  }, [filter, library, sortBy])

  return (
    <div className="steam-library">
      <header className="steam-library__nav" aria-label="Steam navigation">
        <nav className="steam-library__tabs">
          <span className="steam-library__tab" aria-hidden="true">
            Store
          </span>
          <span className="steam-library__tab is-active" aria-current="page">
            Library
          </span>
          <span className="steam-library__tab" aria-hidden="true">
            Community
          </span>
        </nav>
        <label className="steam-library__search">
          <span className="visually-hidden">Search library</span>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search library"
          />
        </label>
      </header>

      <div className="steam-library__body">
        <section className="steam-library__shelf" aria-label="Uncategorized games">
          <header className="steam-library__shelf-head">
            <h2 className="steam-library__shelf-title">
              Uncategorized
              <span>
                ({filtered.length}/{library.length})
              </span>
            </h2>
            <div className="steam-library__shelf-rule" aria-hidden="true" />
          </header>

          <div className="steam-library__sort">
            <span className="steam-library__sort-label">Sort by</span>
            <label className="steam-library__sort-control">
              <span className="visually-hidden">Sort games</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMode)}
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="recent">Recent</option>
              </select>
            </label>
          </div>

          {filtered.length > 0 ? (
            <ul className="steam-library__grid">
              {filtered.map((game, index) => (
                <li key={game.id}>
                  <button
                    type="button"
                    className="steam-library__poster"
                    style={{ animationDelay: `${index * 45}ms` }}
                    onClick={() => onOpenProject(game.id)}
                  >
                    <img src={game.libraryCover ?? game.cover} alt="" />
                    <span className="visually-hidden">{game.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="steam-library__empty">No games match.</p>
          )}
        </section>
      </div>
    </div>
  )
}
