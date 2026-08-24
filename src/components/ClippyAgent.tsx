import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  askClippy,
  CLIPPY_STARTER_CHIPS,
} from '../lib/clippyAgent'
import type { ClippyAction } from '../data/clippyKnowledge'
import {
  DID_YOU_KNOW_TIPS,
  type DidYouKnowId,
  type DidYouKnowTip,
} from '../data/didYouKnow'
import { usePointerDrag } from '../hooks/usePointerDrag'
import { useFinnleyBall, type ThrowDirection } from '../hooks/useFinnleyBall'

const DYK_AUTO_DISMISS_MS = 10_000
const DYK_EXIT_MS = 280

interface Message {
  id: string
  role: 'user' | 'clippy'
  text: string
}

interface ClippyAgentProps {
  onAction?: (action: ClippyAction) => void
  onOpen?: () => void
  reducedMotion?: boolean
  registerThrowBall?: (throwBall: (direction?: ThrowDirection) => void) => void
  didYouKnowId?: DidYouKnowId | null
  /** Bumps when the same tip should reappear. */
  didYouKnowKey?: number
  onDismissDidYouKnow?: () => void
}

interface ThrowMenuState {
  x: number
  y: number
}

const THROW_MENU_ITEMS: { direction: ThrowDirection; label: string }[] = [
  { direction: 'left', label: 'Throw left' },
  { direction: 'up', label: 'Throw up' },
  { direction: 'right', label: 'Throw right' },
]

function FinnleyFace({ mood }: { mood: 'idle' | 'talk' | 'think' }) {
  return (
    <img
      className={`clippy-face clippy-face--${mood}`}
      src="/icons/finnley.png"
      alt=""
      width={80}
      height={96}
      draggable={false}
      aria-hidden="true"
    />
  )
}

let msgSeq = 0
function nextId() {
  msgSeq += 1
  return `m-${msgSeq}`
}

const FINNLEY_FAB_W = 80
const CLIPPY_MARGIN = 8

/** Bottom-right corner, above the dock. */
function defaultClippyPos() {
  return {
    x: Math.max(CLIPPY_MARGIN, window.innerWidth - FINNLEY_FAB_W - 24),
    bottom: 90,
  }
}

function bubbleShiftLeft(posX: number, bubbleW: number) {
  const anchorShift = FINNLEY_FAB_W - bubbleW
  const edgeShift = window.innerWidth - CLIPPY_MARGIN - bubbleW - posX
  return Math.min(0, anchorShift, edgeShift)
}

export function ClippyAgent({
  onAction,
  onOpen,
  reducedMotion = false,
  registerThrowBall,
  didYouKnowId = null,
  didYouKnowKey = 0,
  onDismissDidYouKnow,
}: ClippyAgentProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingAction, setPendingAction] = useState<ClippyAction | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(CLIPPY_STARTER_CHIPS)
  const [pos, setPos] = useState(defaultClippyPos)
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'clippy',
      text: "It looks like you’re browsing a portfolio! I’m Finnley, ask me about Sarah, her projects, or how this desktop works.",
    },
  ])
  const panelId = useId()
  const throwMenuId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const ballButtonRef = useRef<HTMLButtonElement>(null)
  const throwMenuRef = useRef<HTMLDivElement>(null)
  const [throwMenu, setThrowMenu] = useState<ThrowMenuState | null>(null)
  const [dykTip, setDykTip] = useState<DidYouKnowTip | null>(null)
  const [dykVisible, setDykVisible] = useState(false)
  const dykDismissTimer = useRef<number | null>(null)
  const dykExitTimer = useRef<number | null>(null)

  const { dragging, onPointerDown, suppressClick } = usePointerDrag({
    x: pos.x,
    y: pos.bottom,
    invertY: true,
    onMove: (x, bottom) => setPos({ x, bottom }),
    getBounds: () => {
      const dock = 72
      const margin = CLIPPY_MARGIN
      const panelW = Math.min(360, window.innerWidth - 28)
      const h = rootRef.current?.offsetHeight ?? 110
      const contentW =
        open && pos.x + panelW > window.innerWidth - margin
          ? FINNLEY_FAB_W
          : open
            ? panelW
            : FINNLEY_FAB_W
      return {
        minX: margin,
        minY: dock + margin,
        maxX: Math.max(margin, window.innerWidth - contentW - margin),
        maxY: Math.max(dock + margin, window.innerHeight - h - margin),
      }
    },
  })

  const {
    ball,
    ballDragging,
    chasing,
    facingLeft,
    onBallPointerDown,
    throwBall,
  } = useFinnleyBall({
    finnleyPos: pos,
    onFinnleyMove: setPos,
    finnleyDragging: dragging,
    reducedMotion,
  })

  const closeThrowMenu = useCallback(() => setThrowMenu(null), [])

  const openThrowMenu = useCallback(
    (anchor: HTMLElement, clientX?: number, clientY?: number) => {
      const rect = anchor.getBoundingClientRect()
      setThrowMenu({
        x: clientX ?? rect.left,
        y: clientY ?? rect.bottom + 6,
      })
    },
    [],
  )

  const throwAndClose = useCallback(
    (direction: ThrowDirection) => {
      throwBall(direction)
      closeThrowMenu()
    },
    [closeThrowMenu, throwBall],
  )

  useEffect(() => {
    registerThrowBall?.(throwBall)
    return () => registerThrowBall?.(() => {})
  }, [registerThrowBall, throwBall])

  useEffect(() => {
    if (!throwMenu) return
    const t = window.setTimeout(() => {
      throwMenuRef.current
        ?.querySelector<HTMLButtonElement>('button')
        ?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [throwMenu])

  useEffect(() => {
    if (!throwMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeThrowMenu()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (throwMenuRef.current?.contains(e.target as Node)) return
      closeThrowMenu()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [closeThrowMenu, throwMenu])

  const onBallContextMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    openThrowMenu(e.currentTarget, e.clientX, e.clientY)
  }

  const onBallKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault()
      openThrowMenu(e.currentTarget)
      return
    }
    if (throwMenu) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      throwBall('left')
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      throwBall('right')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      throwBall('up')
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      throwBall('right')
    }
  }

  const onFabContextMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    openThrowMenu(e.currentTarget, e.clientX, e.clientY)
  }

  const onFabKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault()
      e.stopPropagation()
      openThrowMenu(e.currentTarget)
    }
  }

  const dismissDykTip = useCallback(() => {
    if (dykDismissTimer.current) window.clearTimeout(dykDismissTimer.current)
    if (dykExitTimer.current) window.clearTimeout(dykExitTimer.current)
    setDykVisible(false)
    dykExitTimer.current = window.setTimeout(
      () => {
        setDykTip(null)
        onDismissDidYouKnow?.()
      },
      reducedMotion ? 0 : DYK_EXIT_MS,
    )
  }, [onDismissDidYouKnow, reducedMotion])

  useEffect(() => {
    if (!didYouKnowId) return
    const next = DID_YOU_KNOW_TIPS[didYouKnowId]
    if (!next) return

    if (dykDismissTimer.current) window.clearTimeout(dykDismissTimer.current)
    if (dykExitTimer.current) window.clearTimeout(dykExitTimer.current)

    setDykTip(next)
    setDykVisible(false)

    let enterFrame2 = 0
    const enterFrame1 = window.requestAnimationFrame(() => {
      enterFrame2 = window.requestAnimationFrame(() => setDykVisible(true))
    })

    dykDismissTimer.current = window.setTimeout(() => {
      dismissDykTip()
    }, DYK_AUTO_DISMISS_MS)

    return () => {
      window.cancelAnimationFrame(enterFrame1)
      window.cancelAnimationFrame(enterFrame2)
      if (dykDismissTimer.current) window.clearTimeout(dykDismissTimer.current)
      if (dykExitTimer.current) window.clearTimeout(dykExitTimer.current)
    }
  }, [didYouKnowId, didYouKnowKey, dismissDykTip])

  const finnleyMood: 'idle' | 'talk' | 'think' =
    busy ? 'think' : chasing || open || dykVisible ? 'talk' : 'idle'
  const ballRolling = chasing || Math.hypot(ball.vx, ball.vy) > 0.35

  const panelWidth = Math.min(360, window.innerWidth - 28)
  const tipWidth = Math.min(280, window.innerWidth - 40)
  const panelShift =
    open && pos.x + panelWidth > window.innerWidth - CLIPPY_MARGIN
      ? bubbleShiftLeft(pos.x, panelWidth)
      : 0
  const tipShift =
    dykTip && pos.x + tipWidth > window.innerWidth - CLIPPY_MARGIN
      ? bubbleShiftLeft(pos.x, tipWidth)
      : 0

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const dock = 72
    const margin = CLIPPY_MARGIN
    const panelW = Math.min(360, window.innerWidth - 28)
    const h = el.offsetHeight
    const contentW =
      open && pos.x + panelW > window.innerWidth - margin
        ? FINNLEY_FAB_W
        : open
          ? panelW
          : FINNLEY_FAB_W
    const maxX = Math.max(margin, window.innerWidth - contentW - margin)
    const maxBottom = Math.max(dock + margin, window.innerHeight - h - margin)
    setPos((prev) => ({
      x: Math.min(maxX, Math.max(margin, prev.x)),
      bottom: Math.min(maxBottom, Math.max(dock + margin, prev.bottom)),
    }))
  }, [open])

  const openPanel = () => {
    setOpen(true)
    onOpen?.()
  }

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, busy, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const ask = (question: string) => {
    const q = question.trim()
    if (!q || busy) return
    setPendingAction(null)
    const history = messages.map((m) => ({ role: m.role, text: m.text }))
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: q }])
    setInput('')
    setBusy(true)

    void askClippy(q, history)
      .then((reply) => {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'clippy', text: reply.text },
        ])
        setPendingAction(reply.action ?? null)
        setSuggestions(
          reply.suggestions?.length ? reply.suggestions : CLIPPY_STARTER_CHIPS,
        )
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'clippy',
            text: 'Something glitched on my way to the server. Try again in a moment?',
          },
        ])
      })
      .finally(() => setBusy(false))
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  const runAction = () => {
    if (!pendingAction || !onAction) return
    onAction(pendingAction)
  }

  const actionLabel = (() => {
    if (!pendingAction) return null
    switch (pendingAction.type) {
      case 'openAbout':
        return 'Open About Me'
      case 'openContact':
        return 'Open Contact'
      case 'openFeatured':
        return 'Open Browser'
      case 'openWelcome':
        return 'Open Sticky'
      case 'openTerminal':
        return 'Open Terminal'
      case 'openBrowser':
        return 'Open Browser'
      case 'openFolder':
        return pendingAction.category === 'player'
          ? 'Open Media Player'
          : pendingAction.category === 'games'
            ? 'Open Games'
            : pendingAction.category === 'product' ||
                pendingAction.category === 'prototyping'
              ? 'Open Browser'
              : `Open ${pendingAction.category}`
      case 'openProject':
        return 'Open this project'
      default:
        return 'Open on desktop'
    }
  })()

  return (
    <>
      {throwMenu ? (
        <div
          ref={throwMenuRef}
          id={throwMenuId}
          className="finnley-throw-menu"
          role="menu"
          aria-label="Throw the ball"
          style={{ left: throwMenu.x, top: throwMenu.y }}
        >
          {THROW_MENU_ITEMS.map((item) => (
            <button
              key={item.direction}
              type="button"
              role="menuitem"
              className="finnley-throw-menu__item"
              onClick={() => throwAndClose(item.direction)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={`clippy${open ? ' is-open' : ''}${dragging ? ' is-dragging' : ''}${chasing ? ' is-chasing' : ''}`}
        ref={rootRef}
        style={{ left: pos.x, bottom: pos.bottom }}
        onPointerDown={onPointerDown}
      >
      {dykTip ? (
        <aside
          className={`clippy-tip-bubble${dykVisible ? ' is-visible' : ''}${
            reducedMotion ? ' is-reduced' : ''
          }`}
          style={{ marginLeft: tipShift }}
          role="status"
          aria-live="polite"
          aria-label={`${dykTip.title}. Did you know? ${dykTip.body}`}
        >
          <button
            type="button"
            className="clippy-tip-bubble__close"
            aria-label="Dismiss tip"
            onClick={dismissDykTip}
          >
            ×
          </button>
          <p className="clippy-tip-bubble__eyebrow">Did you know?</p>
          <p className="clippy-tip-bubble__title">
            <span aria-hidden="true">{dykTip.emoji}</span> {dykTip.title}
          </p>
          <p className="clippy-tip-bubble__copy">{dykTip.body}</p>
        </aside>
      ) : null}
      {open ? (
        <section
          className="clippy-panel"
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="Finnley portfolio assistant"
          style={{ marginLeft: panelShift }}
          >
          <header className="clippy-panel__head">
            <div className="clippy-panel__identity">
              <FinnleyFace mood={finnleyMood} />
              <div className="clippy-panel__meta">
                <p className="clippy-panel__eyebrow">Office Assistant</p>
                <h2 className="clippy-panel__title">Finnley</h2>
                <button
                  type="button"
                  className="clippy-panel__throw-pill"
                  title="Throw the ball"
                  aria-label="Throw the ball"
                  aria-haspopup="menu"
                  aria-expanded={throwMenu != null}
                  aria-controls={throwMenu ? throwMenuId : undefined}
                  onClick={(e) => openThrowMenu(e.currentTarget)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    openThrowMenu(e.currentTarget, e.clientX, e.clientY)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
                      e.preventDefault()
                      openThrowMenu(e.currentTarget)
                    } else if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openThrowMenu(e.currentTarget)
                    }
                  }}
                >
                  <span className="clippy-panel__throw-pill-icon" aria-hidden="true" />
                  Throw
                </button>
              </div>
            </div>
            <button
              type="button"
              className="clippy-panel__close"
              aria-label="Close Finnley"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="clippy-panel__messages" ref={listRef} tabIndex={0}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`clippy-bubble clippy-bubble--${m.role}`}
              >
                {m.text.split('\n').map((line, i) => (
                  <p key={`${m.id}-${i}`}>{line || '\u00a0'}</p>
                ))}
              </div>
            ))}
            {busy ? (
              <div className="clippy-bubble clippy-bubble--clippy is-typing" aria-live="polite">
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>

          {actionLabel && pendingAction ? (
            <div className="clippy-panel__action-row">
              <button type="button" className="clippy-action" onClick={runAction}>
                {actionLabel}
              </button>
            </div>
          ) : null}

          {!busy && suggestions.length ? (
            <div className="clippy-panel__chips" aria-label="Suggested questions">
              {suggestions.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="clippy-chip"
                  onClick={() => ask(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          <form className="clippy-panel__form" onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor={`${panelId}-input`}>
              Ask Finnley
            </label>
            <input
              id={`${panelId}-input`}
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Sarah or this portfolio…"
              autoComplete="off"
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              Ask
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className={`clippy-fab${open ? ' is-active' : ''}`}
        title="Finnley"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup={open ? undefined : 'menu'}
        aria-label={open ? 'Hide Finnley' : 'Talk to Finnley. Shift+F10 to throw the ball.'}
        onClick={() => {
          if (suppressClick()) return
          if (open) setOpen(false)
          else openPanel()
        }}
        onContextMenu={onFabContextMenu}
        onKeyDown={onFabKeyDown}
      >
        <span className={`clippy-fab__sprite${facingLeft ? ' is-facing-left' : ''}`}>
          <FinnleyFace mood={finnleyMood} />
        </span>
      </button>

      <button
        ref={ballButtonRef}
        type="button"
        className={`finnley-ball${ballDragging ? ' is-dragging' : ''}${ballRolling ? ' is-rolling' : ''}`}
        style={{ left: ball.x - pos.x, bottom: ball.bottom - pos.bottom }}
        title="Throw the ball"
        aria-label="Ball for Finnley. Drag or flick to throw. Arrow keys or Enter also throw. Right-click or Shift+F10 for menu."
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp Enter"
        aria-haspopup="menu"
        aria-expanded={throwMenu != null}
        aria-controls={throwMenu ? throwMenuId : undefined}
        onPointerDown={onBallPointerDown}
        onContextMenu={onBallContextMenu}
        onKeyDown={onBallKeyDown}
        onDoubleClick={() => throwBall('right')}
      />
      </div>
    </>
  )
}
