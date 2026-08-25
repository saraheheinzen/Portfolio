import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import Player from '@vimeo/player'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Convert player/share URLs into a page URL oEmbed accepts (keeps privacy hash). */
function toVimeoPageUrl(src: string) {
  try {
    const url = new URL(src)
    const parts = url.pathname.split('/').filter(Boolean)
    const videoIdx = parts.indexOf('video')
    const id = videoIdx >= 0 ? parts[videoIdx + 1] : parts[0]
    if (!id || !/^\d+$/.test(id)) return src
    const hash =
      url.searchParams.get('h') ??
      (videoIdx < 0 && parts[1] && !/^\d+$/.test(parts[1]) ? parts[1] : null)
    return hash
      ? `https://vimeo.com/${id}/${hash}`
      : `https://vimeo.com/${id}`
  } catch {
    return src
  }
}

interface VimeoPlayerProps {
  src: string
  title: string
  label?: string
  className?: string
  compact?: boolean
  autoPlay?: boolean
  onEnded?: () => void
}

export function VimeoPlayer({
  src,
  title,
  label,
  className = '',
  compact = false,
  autoPlay = false,
  onEnded,
}: VimeoPlayerProps) {
  const screenRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const scrubbing = useRef(false)
  const playingRef = useRef(false)
  const durationRef = useRef(0)
  const onEndedRef = useRef(onEnded)
  const autoPlayRef = useRef(autoPlay)

  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)

  const progress = duration > 0 ? Math.min(1, current / duration) : 0

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    autoPlayRef.current = autoPlay
  }, [autoPlay])

  useEffect(() => {
    const screen = screenRef.current
    if (!screen) return

    // Disposable host so Player.destroy() / late oEmbed can't yank React's DOM
    // (Strict Mode remounts effects and destroy() removes iframes it created).
    const host = document.createElement('div')
    host.className = 'media-player__embed'
    screen.insertBefore(host, screen.firstChild)

    const player = new Player(host, {
      url: toVimeoPageUrl(src) as `https://vimeo.com/${string}`,
      controls: false,
      title: false,
      byline: false,
      portrait: false,
      playsinline: true,
      dnt: true,
      responsive: false,
    })
    playerRef.current = player
    setReady(false)
    setPlaying(false)
    playingRef.current = false
    setCurrent(0)
    setDuration(0)
    durationRef.current = 0
    setMuted(false)

    let alive = true

    const decorateIframe = () => {
      const iframe = host.querySelector('iframe')
      if (!iframe) return
      iframe.title = title
      iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture')
      iframe.allowFullscreen = true
    }

    const onPlay = () => {
      if (!alive) return
      playingRef.current = true
      setPlaying(true)
    }
    const onPause = () => {
      if (!alive) return
      playingRef.current = false
      setPlaying(false)
    }
    const handleEnded = () => {
      if (!alive) return
      playingRef.current = false
      setPlaying(false)
      onEndedRef.current?.()
    }
    const onTime = (data: { seconds: number }) => {
      if (!alive || scrubbing.current) return
      setCurrent(data.seconds)
    }

    player.on('play', onPlay)
    player.on('pause', onPause)
    player.on('ended', handleEnded)
    player.on('timeupdate', onTime)

    player
      .ready()
      .then(() => {
        decorateIframe()
        return player.getDuration()
      })
      .then((d) => {
        if (!alive) return
        durationRef.current = d
        setDuration(d)
        setReady(true)
        if (autoPlayRef.current) {
          void player.play().catch(() => {
            void player.setMuted(true).then(() => {
              if (alive) setMuted(true)
              return player.play()
            })
          })
        }
      })
      .catch(() => {
        if (alive) setReady(true)
      })

    return () => {
      alive = false
      player.off('play', onPlay)
      player.off('pause', onPause)
      player.off('ended', handleEnded)
      player.off('timeupdate', onTime)
      playerRef.current = null
      void player.destroy().finally(() => {
        host.remove()
      })
    }
  }, [src, title])

  // Call play()/pause() immediately from the click handler — awaiting first
  // drops the user gesture and browsers block unmuted playback.
  const togglePlay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (playingRef.current) {
      void player.pause()
      return
    }
    void player.play().catch(() => {
      // Last resort if the gesture was stripped: muted play still starts video.
      void player.setMuted(true).then(() => player.play())
    })
  }, [])

  const toggleMute = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    setMuted((prev) => {
      const next = !prev
      void player.setMuted(next)
      return next
    })
  }, [])

  const seekToClientX = useCallback((clientX: number) => {
    const player = playerRef.current
    const track = trackRef.current
    const total = durationRef.current
    if (!player || !track || total <= 0) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const next = ratio * total
    setCurrent(next)
    void player.setCurrentTime(next)
  }, [])

  const onTrackPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      scrubbing.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      void seekToClientX(e.clientX)
    },
    [seekToClientX],
  )

  const onTrackPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!scrubbing.current) return
      void seekToClientX(e.clientX)
    },
    [seekToClientX],
  )

  const onTrackPointerUp = useCallback(() => {
    scrubbing.current = false
  }, [])

  return (
    <div
      className={`media-player${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="media-player__screen" ref={screenRef}>
        <button
          type="button"
          className="media-player__hit"
          aria-label={playing ? 'Pause video' : 'Play video'}
          onClick={togglePlay}
        />
      </div>
      <div className="media-player__chrome">
        <div className="media-player__transport">
          <button
            type="button"
            className="media-player__btn"
            aria-label={playing ? 'Pause' : 'Play'}
            disabled={!ready}
            onClick={togglePlay}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <div
            ref={trackRef}
            className="media-player__track"
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            tabIndex={0}
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={onTrackPointerUp}
            onPointerCancel={onTrackPointerUp}
            onKeyDown={(e) => {
              if (!duration) return
              const step = e.shiftKey ? 5 : 2
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault()
                void seekToClientX(
                  (trackRef.current?.getBoundingClientRect().left ?? 0) +
                    ((current + step) / duration) *
                      (trackRef.current?.offsetWidth ?? 0),
                )
              }
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault()
                void seekToClientX(
                  (trackRef.current?.getBoundingClientRect().left ?? 0) +
                    ((current - step) / duration) *
                      (trackRef.current?.offsetWidth ?? 0),
                )
              }
            }}
          >
            <span
              className="media-player__fill"
              style={{ width: `${progress * 100}%` }}
            />
            <span
              className="media-player__knob"
              style={{ left: `${progress * 100}%` }}
            />
          </div>
          <span className="media-player__time">
            {label ?? formatTime(current)}
          </span>
          <button
            type="button"
            className="media-player__btn media-player__btn--mute"
            aria-label={muted ? 'Unmute' : 'Mute'}
            aria-pressed={muted}
            disabled={!ready}
            onClick={toggleMute}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </div>
  )
}
