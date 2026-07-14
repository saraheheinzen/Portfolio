import { useEffect, useRef, useState } from 'react'
import {
  DID_YOU_KNOW_TIPS,
  type DidYouKnowId,
  type DidYouKnowTip,
} from '../data/didYouKnow'

const AUTO_DISMISS_MS = 10_000
const EXIT_MS = 280

interface DidYouKnowToastProps {
  tipId: DidYouKnowId | null
  /** Bumps when the same tip should reappear. */
  tipKey?: number
  reducedMotion?: boolean
  onDismiss: () => void
}

export function DidYouKnowToast({
  tipId,
  tipKey = 0,
  reducedMotion = false,
  onDismiss,
}: DidYouKnowToastProps) {
  const [tip, setTip] = useState<DidYouKnowTip | null>(null)
  const [visible, setVisible] = useState(false)
  const dismissTimer = useRef<number | null>(null)
  const exitTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!tipId) return
    const next = DID_YOU_KNOW_TIPS[tipId]
    if (!next) return

    if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
    if (exitTimer.current) window.clearTimeout(exitTimer.current)

    setTip(next)
    setVisible(false)

    // Two frames so the toast paints off-screen before sliding in.
    let enterFrame2 = 0
    const enterFrame1 = window.requestAnimationFrame(() => {
      enterFrame2 = window.requestAnimationFrame(() => setVisible(true))
    })

    dismissTimer.current = window.setTimeout(() => {
      setVisible(false)
      exitTimer.current = window.setTimeout(
        () => {
          setTip(null)
          onDismiss()
        },
        reducedMotion ? 0 : EXIT_MS,
      )
    }, AUTO_DISMISS_MS)

    return () => {
      window.cancelAnimationFrame(enterFrame1)
      window.cancelAnimationFrame(enterFrame2)
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
      if (exitTimer.current) window.clearTimeout(exitTimer.current)
    }
  }, [tipId, tipKey, onDismiss, reducedMotion])

  if (!tip) return null

  const dismiss = () => {
    if (dismissTimer.current) window.clearTimeout(dismissTimer.current)
    if (exitTimer.current) window.clearTimeout(exitTimer.current)
    setVisible(false)
    exitTimer.current = window.setTimeout(
      () => {
        setTip(null)
        onDismiss()
      },
      reducedMotion ? 0 : EXIT_MS,
    )
  }

  return (
    <aside
      className={`dyk-toast${visible ? ' is-visible' : ''}${
        reducedMotion ? ' is-reduced' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label={`${tip.title}. Did you know? ${tip.body}`}
    >
      <div className="dyk-toast__chrome">
        <span className="dyk-toast__badge" aria-hidden="true">
          !
        </span>
        <p className="dyk-toast__eyebrow">Did you know?</p>
        <button
          type="button"
          className="dyk-toast__close"
          aria-label="Dismiss notification"
          onClick={dismiss}
        >
          ×
        </button>
      </div>
      <div className="dyk-toast__body">
        <p className="dyk-toast__title">
          <span aria-hidden="true">{tip.emoji}</span> {tip.title}
        </p>
        <p className="dyk-toast__copy">{tip.body}</p>
      </div>
    </aside>
  )
}
