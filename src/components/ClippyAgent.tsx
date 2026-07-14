import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  askClippy,
  CLIPPY_STARTER_CHIPS,
} from '../lib/clippyAgent'
import type { ClippyAction } from '../data/clippyKnowledge'

interface Message {
  id: string
  role: 'user' | 'clippy'
  text: string
}

interface ClippyAgentProps {
  onAction?: (action: ClippyAction) => void
  onOpen?: () => void
}

function ClippyFace({ mood }: { mood: 'idle' | 'talk' | 'think' }) {
  return (
    <svg
      className={`clippy-face clippy-face--${mood}`}
      viewBox="0 0 64 72"
      width="56"
      height="64"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="clippy-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7f3ef" />
          <stop offset="55%" stopColor="#d8d2e0" />
          <stop offset="100%" stopColor="#b8b0c4" />
        </linearGradient>
      </defs>
      {/* Paperclip body */}
      <path
        d="M28 8c-8 0-14 6.5-14 14.5v24c0 7.5 6 13.5 13.5 13.5S41 53.5 41 46V24.5c0-4.7-3.8-8.5-8.5-8.5S24 19.8 24 24.5v18c0 2.5 2 4.5 4.5 4.5S33 45 33 42.5v-16"
        fill="none"
        stroke="url(#clippy-metal)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 8c-8 0-14 6.5-14 14.5v24c0 7.5 6 13.5 13.5 13.5S41 53.5 41 46V24.5c0-4.7-3.8-8.5-8.5-8.5S24 19.8 24 24.5v18c0 2.5 2 4.5 4.5 4.5S33 45 33 42.5v-16"
        fill="none"
        stroke="#2c2a32"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Eyes */}
      <circle className="clippy-eye clippy-eye--l" cx="22" cy="30" r="3.2" fill="#2c2a32" />
      <circle className="clippy-eye clippy-eye--r" cx="34" cy="30" r="3.2" fill="#2c2a32" />
      <circle cx="23.1" cy="28.9" r="1" fill="#fffaf7" />
      <circle cx="35.1" cy="28.9" r="1" fill="#fffaf7" />
      {/* Brow / mouth */}
      <path
        className="clippy-brow"
        d="M18 24h8M30 24h8"
        stroke="#2c2a32"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        className="clippy-mouth"
        d="M24 38c2 2.2 6 2.2 8 0"
        fill="none"
        stroke="#2c2a32"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Accent blush */}
      <ellipse cx="17" cy="34" rx="3" ry="1.6" fill="#ffb498" opacity="0.55" />
      <ellipse cx="39" cy="34" rx="3" ry="1.6" fill="#ffb498" opacity="0.55" />
    </svg>
  )
}

let msgSeq = 0
function nextId() {
  msgSeq += 1
  return `m-${msgSeq}`
}

export function ClippyAgent({ onAction, onOpen }: ClippyAgentProps) {
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(true)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingAction, setPendingAction] = useState<ClippyAction | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(CLIPPY_STARTER_CHIPS)
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      role: 'clippy',
      text: "It looks like you’re browsing a portfolio! I’m Clippy — ask me about Sarah, her projects, or how this desktop works.",
    },
  ])
  const panelId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const openPanel = () => {
    setOpen(true)
    onOpen?.()
  }

  useEffect(() => {
    if (!open) return
    setNudge(false)
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
        return pendingAction.category === 'youtube'
          ? 'Open YouTube'
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
    <div className={`clippy${open ? ' is-open' : ''}`} ref={rootRef}>
      {open ? (
        <section
          className="clippy-panel"
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="Clippy portfolio assistant"
        >
          <header className="clippy-panel__head">
            <div className="clippy-panel__identity">
              <ClippyFace mood={busy ? 'think' : 'talk'} />
              <div>
                <p className="clippy-panel__eyebrow">Office Assistant</p>
                <h2 className="clippy-panel__title">Clippy</h2>
              </div>
            </div>
            <button
              type="button"
              className="clippy-panel__close"
              aria-label="Close Clippy"
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
              Ask Clippy
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

      {nudge && !open ? (
        <button
          type="button"
          className="clippy-nudge"
          onClick={openPanel}
        >
          Need help finding something?
        </button>
      ) : null}

      <button
        type="button"
        className={`clippy-fab${open ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? 'Hide Clippy' : 'Talk to Clippy'}
        onClick={() => {
          if (open) setOpen(false)
          else openPanel()
        }}
      >
        <ClippyFace mood={open ? 'talk' : 'idle'} />
        <span className="clippy-fab__label">Clippy</span>
      </button>
    </div>
  )
}
