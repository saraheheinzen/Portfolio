import { useEffect, useRef, useState } from 'react'
import { HYPERFOCUS_ACHIEVEMENT } from '../data/achievements'

const AUTO_DISMISS_MS = 9_000

interface AchievementToastProps {
  visible: boolean
  /** Bumps when the unlock should re-play. */
  unlockKey?: number
  reducedMotion?: boolean
  onDismiss: () => void
}

function AchievementIcon() {
  return (
    <svg
      className="steam-ach__icon-art"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="steam-ach-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d5a73" />
          <stop offset="100%" stopColor="#1b2838" />
        </linearGradient>
        <linearGradient id="steam-ach-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#66c0f4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2a475e" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="4" fill="url(#steam-ach-face)" />
      <path
        d="M32 10c-7.2 0-13 5.8-13 13 0 4.6 2.4 8.6 6 10.9V38h14v-4.1c3.6-2.3 6-6.3 6-10.9 0-7.2-5.8-13-13-13zm-6 32h12v4H26v-4zm-2 6h16v4H24v-4z"
        fill="url(#steam-ach-shine)"
      />
      <circle cx="32" cy="23" r="7" fill="#c7d5e0" opacity="0.35" />
    </svg>
  )
}

export function AchievementToast({
  visible: shouldShow,
  unlockKey = 0,
  reducedMotion = false,
  onDismiss,
}: AchievementToastProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const dismissTimer = useRef<number | null>(null)
  const exitTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!shouldShow) return

    if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
    if (exitTimer.current) window.clearTimeout(exitTimer.current)

    setMounted(true)
    // Next frame so the enter transition can run.
    const enter = window.requestAnimationFrame(() => setVisible(true))

    dismissTimer.current = window.setTimeout(() => {
      setVisible(false)
      exitTimer.current = window.setTimeout(
        () => {
          setMounted(false)
          onDismiss()
        },
        reducedMotion ? 0 : 280,
      )
    }, AUTO_DISMISS_MS)

    return () => {
      window.cancelAnimationFrame(enter)
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
      if (exitTimer.current) window.clearTimeout(exitTimer.current)
    }
  }, [shouldShow, unlockKey, onDismiss, reducedMotion])

  if (!mounted) return null

  const ach = HYPERFOCUS_ACHIEVEMENT

  const dismiss = () => {
    if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
    if (exitTimer.current) window.clearTimeout(exitTimer.current)
    setVisible(false)
    exitTimer.current = window.setTimeout(
      () => {
        setMounted(false)
        onDismiss()
      },
      reducedMotion ? 0 : 280,
    )
  }

  return (
    <aside
      className={`steam-ach${visible ? ' is-visible' : ''}${
        reducedMotion ? ' is-reduced' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label={`Achievement unlocked. ${ach.name}. ${ach.description}${
        ach.note ? ` ${ach.note}` : ''
      }`}
    >
      <div className="steam-ach__icon">
        <AchievementIcon />
      </div>
      <div className="steam-ach__body">
        <p className="steam-ach__eyebrow">Achievement Unlocked!</p>
        <p className="steam-ach__name">{ach.name}</p>
        <p className="steam-ach__copy">{ach.description}</p>
        {ach.note ? <p className="steam-ach__note">{ach.note}</p> : null}
      </div>
      <button
        type="button"
        className="steam-ach__close"
        aria-label="Dismiss achievement"
        onClick={dismiss}
      >
        ×
      </button>
    </aside>
  )
}
