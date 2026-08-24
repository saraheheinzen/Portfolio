import { useCallback, useEffect, useRef, useState } from 'react'
import {
  matchVoiceCommand,
  VOICE_LISTEN_HINT,
  type MatchedVoiceCommand,
} from '../lib/voiceCommands'

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((ev: Event) => void) | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: Event & { error: string }) => void) | null
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function isMutePhrase(text: string) {
  return /\b(mute|mute mic|mute microphone|pause listening|stop listening temporarily)\b/.test(
    text,
  )
}

export type VoiceStatus =
  | 'unsupported'
  | 'starting'
  | 'listening'
  | 'muted'
  | 'denied'
  | 'error'
  | 'idle'

const COMMAND_COOLDOWN_MS = 1400
const MUTED_HINT = 'Muted. Unmute to listen again.'

export function useVoiceAccess(
  enabled: boolean,
  onCommand: (match: MatchedVoiceCommand) => void,
) {
  const [status, setStatus] = useState<VoiceStatus>(() =>
    getSpeechRecognitionCtor() ? 'idle' : 'unsupported',
  )
  const [heard, setHeard] = useState(VOICE_LISTEN_HINT)
  const [hearing, setHearing] = useState(false)
  const [muted, setMuted] = useState(false)
  const onCommandRef = useRef(onCommand)
  const lastCommandAt = useRef(0)
  const lastPhrase = useRef('')
  const stopRestart = useRef(false)
  const muteRef = useRef<() => void>(() => {})

  useEffect(() => {
    onCommandRef.current = onCommand
  }, [onCommand])

  useEffect(() => {
    if (!enabled) {
      setMuted(false)
    }
  }, [enabled])

  const listening = enabled && !muted

  useEffect(() => {
    if (!listening) {
      stopRestart.current = true
      setHearing(false)
      if (!enabled) {
        setHeard(VOICE_LISTEN_HINT)
        setStatus(getSpeechRecognitionCtor() ? 'idle' : 'unsupported')
      } else if (muted) {
        setHeard(MUTED_HINT)
        setStatus('muted')
      }
      return
    }

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setStatus('unsupported')
      setHeard('Voice recognition isn’t available in this browser.')
      return
    }

    let active = true
    stopRestart.current = false
    let restartTimer = 0
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    const scheduleRestart = () => {
      if (!active || stopRestart.current) return
      window.clearTimeout(restartTimer)
      restartTimer = window.setTimeout(() => {
        if (!active || stopRestart.current) return
        try {
          recognition.start()
        } catch {
          /* already started */
        }
      }, 280)
    }

    recognition.onstart = () => {
      if (!active) return
      setStatus('listening')
      setHeard(VOICE_LISTEN_HINT)
    }

    recognition.onerror = (event) => {
      if (!active) return
      const err = event.error
      if (err === 'no-speech' || err === 'aborted') return
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        stopRestart.current = true
        setStatus('denied')
        setHeard('Microphone permission is blocked for Voice Access.')
        setHearing(false)
        return
      }
      setStatus('error')
      setHeard('Voice Access hit a snag. Try toggling it again.')
      setHearing(false)
    }

    recognition.onresult = (event) => {
      if (!active) return

      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0]?.transcript?.trim() ?? ''
        if (!text) continue
        if (result.isFinal) finalText += `${text} `
        else interim += `${text} `
      }

      if (interim) {
        setHearing(true)
        setHeard(`Hearing “${interim.trim()}”…`)
      }

      const transcript = finalText.trim()
      if (!transcript) return

      setHearing(false)
      setHeard(`Heard “${transcript}”`)

      const normalized = transcript.toLowerCase()
      if (isMutePhrase(normalized)) {
        setHeard('Muted')
        muteRef.current()
        return
      }

      const match = matchVoiceCommand(transcript)
      if (!match) {
        setHeard(`Heard “${transcript}.” Say “help” for commands.`)
        return
      }

      const now = Date.now()
      const phraseKey = `${match.label}|${normalized}`
      if (
        phraseKey === lastPhrase.current &&
        now - lastCommandAt.current < COMMAND_COOLDOWN_MS
      ) {
        return
      }
      lastPhrase.current = phraseKey
      lastCommandAt.current = now
      setHeard(match.label)
      onCommandRef.current(match)
    }

    recognition.onend = () => {
      if (!active) return
      scheduleRestart()
    }

    setStatus('starting')
    setHeard('Starting microphone…')
    try {
      recognition.start()
    } catch {
      scheduleRestart()
    }

    return () => {
      active = false
      stopRestart.current = true
      window.clearTimeout(restartTimer)
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      try {
        recognition.abort()
      } catch {
        try {
          recognition.stop()
        } catch {
          /* ignore */
        }
      }
    }
  }, [listening, enabled, muted])

  const mute = useCallback(() => {
    setMuted(true)
  }, [])

  const unmute = useCallback(() => {
    setMuted(false)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev)
  }, [])

  useEffect(() => {
    muteRef.current = mute
  }, [mute])

  return { status, heard, hearing, muted, mute, unmute, toggleMute }
}
