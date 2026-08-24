import { useCallback, useState } from 'react'
import { mediaPlaylist, type AnimationClip } from '../data/content'
import { VimeoPlayer } from './VimeoPlayer'

interface MediaPlayerViewProps {
  onOpenProject: (id: string) => void
}

export function MediaPlayerView({ onOpenProject }: MediaPlayerViewProps) {
  const [activeId, setActiveId] = useState(mediaPlaylist[0]?.id ?? '')
  const [autoPlay, setAutoPlay] = useState(false)

  const index = Math.max(
    0,
    mediaPlaylist.findIndex((c) => c.id === activeId),
  )
  const active: AnimationClip = mediaPlaylist[index] ?? mediaPlaylist[0]

  const selectClip = useCallback((clip: AnimationClip, play: boolean) => {
    setActiveId(clip.id)
    setAutoPlay(play)
  }, [])

  const goRelative = useCallback(
    (delta: number, play: boolean) => {
      const next =
        mediaPlaylist[
          (index + delta + mediaPlaylist.length) % mediaPlaylist.length
        ]
      if (next) selectClip(next, play)
    },
    [index, selectClip],
  )

  if (!active) return null

  return (
    <div className="player-view player-view--app">
      <header className="player-view__bar">
        <div className="player-view__now">
          <p className="player-view__eyebrow">Media Player · Library</p>
          <h1 className="player-view__title">{active.title}</h1>
          <p className="player-view__lede">{active.subtitle}</p>
        </div>
        <div className="player-view__skip">
          <button
            type="button"
            className="player-view__nav-btn"
            aria-label="Previous video"
            onClick={() => goRelative(-1, true)}
          >
            ‹
          </button>
          <span className="player-view__count">
            {String(index + 1).padStart(2, '0')} /{' '}
            {String(mediaPlaylist.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            className="player-view__nav-btn"
            aria-label="Next video"
            onClick={() => goRelative(1, true)}
          >
            ›
          </button>
        </div>
      </header>

      <div className="player-view__stage">
        <div
          className={`player-view__screen${active.portrait ? ' is-portrait' : ''}`}
        >
          <VimeoPlayer
            key={active.id}
            src={active.src}
            title={active.title}
            className={active.portrait ? 'is-phone' : undefined}
            autoPlay={autoPlay}
            onEnded={() => goRelative(1, true)}
          />
        </div>

        <aside className="player-view__queue" aria-label="Up next">
          <p className="player-view__playlist-label">Up next</p>
          <ul>
            {mediaPlaylist.map((clip, i) => {
              const isActive = clip.id === active.id
              return (
                <li key={clip.id}>
                  <button
                    type="button"
                    className={`player-view__track${isActive ? ' is-active' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => selectClip(clip, true)}
                  >
                    <span className="player-view__thumb">
                      <img src={clip.cover} alt="" />
                      {isActive ? (
                        <span className="player-view__now-badge">Now</span>
                      ) : (
                        <span className="player-view__index">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      )}
                    </span>
                    <span className="player-view__track-copy">
                      <strong>{clip.title}</strong>
                      <em>{clip.subtitle}</em>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {active.projectId ? (
            <button
              type="button"
              className="player-view__case"
              onClick={() => onOpenProject(active.projectId!)}
            >
              Open case study
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
