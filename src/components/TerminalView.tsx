import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  runTerminalCommand,
  terminal,
  type TerminalAction,
} from '../data/terminal'

interface TerminalViewProps {
  reducedMotion?: boolean
  onAction?: (action: TerminalAction) => void
}

type Phase = 'awaiting' | 'booting' | 'ready'

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function pickWelcome() {
  return terminal.welcomes[
    Math.floor(Math.random() * terminal.welcomes.length)
  ]
}

export function TerminalView({
  reducedMotion = false,
  onAction,
}: TerminalViewProps) {
  const [phase, setPhase] = useState<Phase>('awaiting')
  const [lines, setLines] = useState<string[]>([
    `${terminal.osName} ${terminal.version}`,
    '',
    terminal.prompt,
    '',
  ])
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const bootGen = useRef(0)

  useEffect(() => {
    if (phase === 'awaiting') rootRef.current?.focus()
  }, [phase])

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [lines, phase, reducedMotion])

  useEffect(() => {
    if (phase !== 'ready') return
    inputRef.current?.focus()
  }, [phase])

  useEffect(() => () => {
    bootGen.current += 1
  }, [])

  const append = (next: string | string[]) => {
    setLines((prev) => prev.concat(next))
  }

  const runBoot = async () => {
    const gen = ++bootGen.current
    setPhase('booting')
    setLines([`${terminal.osName} ${terminal.version}`, ''])

    const stillActive = () => bootGen.current === gen

    for (const step of terminal.bootSteps) {
      if (!stillActive()) return

      if (step.kind === 'blank') {
        append('')
        if (!reducedMotion) await sleep(120)
        continue
      }

      if (step.kind === 'echo') {
        append(step.text)
        if (!reducedMotion) await sleep(280)
        continue
      }

      if (step.kind === 'progress') {
        if (reducedMotion) {
          append(
            `${step.label}${'.'.repeat(step.dots)}${step.status}`,
          )
          continue
        }

        const base = step.label
        append(base)
        for (let i = 1; i <= step.dots; i += 1) {
          if (!stillActive()) return
          await sleep(18 + (i % 5 === 0 ? 24 : 0))
          setLines((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = `${base}${'.'.repeat(i)}`
            return copy
          })
        }
        if (!stillActive()) return
        await sleep(90)
        setLines((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] =
            `${base}${'.'.repeat(step.dots)}${step.status}`
          return copy
        })
        await sleep(160)
      }
    }

    if (!stillActive()) return
    append(pickWelcome())
    append('')
    append('Available commands')
    append('')
    for (const cmd of terminal.helpCommands) {
      append(`  ${cmd}`)
    }
    append('')
    append('Tip: type help anytime, or try whoami, fortune, or design.')
    append('')
    setPhase('ready')
  }

  const beginBoot = () => {
    if (phase !== 'awaiting') return
    void runBoot()
  }

  const submitCommand = (raw: string) => {
    const command = raw.trim()
    append(`> ${command || ''}`)
    if (!command) {
      setDraft('')
      return
    }

    setHistory((prev) => [...prev, command])
    setHistoryIndex(-1)

    const result = runTerminalCommand(command)
    if (result.clear) {
      setLines([`${terminal.osName} ${terminal.version}`, ''])
    } else if (result.lines.length) {
      append(['', ...result.lines, ''])
    } else {
      append('')
    }

    if (result.action) onAction?.(result.action)
    setDraft('')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (phase !== 'ready') return
    submitCommand(draft)
  }

  const onPromptKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const next =
        historyIndex < 0
          ? history.length - 1
          : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setDraft(history[next] ?? '')
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex < 0) return
      const next = historyIndex + 1
      if (next >= history.length) {
        setHistoryIndex(-1)
        setDraft('')
      } else {
        setHistoryIndex(next)
        setDraft(history[next] ?? '')
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className="terminal-view"
      role="application"
      aria-label="SarahOS terminal"
      onClick={() => {
        if (phase === 'ready') inputRef.current?.focus()
        else if (phase === 'awaiting') beginBoot()
      }}
      onKeyDown={(e) => {
        if (phase === 'awaiting' && e.key === 'Enter') {
          e.preventDefault()
          beginBoot()
        }
      }}
      tabIndex={phase === 'awaiting' ? 0 : -1}
    >
      <div className="terminal-view__chrome" aria-hidden="true">
        <span>{terminal.osName}</span>
        <span>{terminal.version}</span>
      </div>

      <div
        ref={scrollerRef}
        className="terminal-view__scroll"
        aria-live="polite"
      >
        {lines.map((line, i) => (
          <pre
            key={i}
            className={
              line.startsWith('>')
                ? 'terminal-view__line is-cmd'
                : 'terminal-view__line'
            }
          >
            {line || ' '}
          </pre>
        ))}

        {phase === 'awaiting' ? (
          <button
            type="button"
            className="terminal-view__continue"
            onClick={(e) => {
              e.stopPropagation()
              beginBoot()
            }}
          >
            {terminal.pressEnter}
          </button>
        ) : null}

        {phase === 'ready' ? (
          <form className="terminal-view__prompt" onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor="sarahos-terminal-input">
              Terminal command
            </label>
            <span aria-hidden="true">&gt;</span>
            <input
              id="sarahos-terminal-input"
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onPromptKeyDown}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Terminal command"
            />
            <span className="terminal-view__caret" aria-hidden="true" />
          </form>
        ) : null}

        {phase === 'booting' ? (
          <span className="terminal-view__caret is-boot" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  )
}
