import type { A11yToggleKey } from '../hooks/useExploreMode'
import type { ProjectCategory } from '../data/content'

export type { A11yToggleKey }

export type VoiceAction =
  | { type: 'openFolder'; category: ProjectCategory }
  | { type: 'openBrowser' }
  | { type: 'openAbout' }
  | { type: 'openContact' }
  | { type: 'openWelcome' }
  | { type: 'openTerminal' }
  | { type: 'openStart' }
  | { type: 'focusDock' }
  | { type: 'setMagnifier'; on: boolean }
  | { type: 'toggleA11y'; key: A11yToggleKey }
  | { type: 'closeWindow' }
  | { type: 'throwBall'; direction?: 'left' | 'right' | 'up' }
  | { type: 'help' }

export interface MatchedVoiceCommand {
  label: string
  action: VoiceAction
}

const HELP_HINT =
  'Try “open games”, “throw ball”, “show about”, “mute”, “go to dock”, or “stop listening”.'

interface CommandSpec {
  phrases: string[]
  label: string
  action: VoiceAction
}

const COMMANDS: CommandSpec[] = [
  {
    phrases: ['open games', 'show games', 'open steam', 'steam library'],
    label: 'Opening Games',
    action: { type: 'openFolder', category: 'games' },
  },
  {
    phrases: [
      'open media player',
      'show media player',
      'open player',
      'media library',
      'open youtube',
      'show youtube',
    ],
    label: 'Opening Media Player',
    action: { type: 'openFolder', category: 'player' },
  },
  {
    phrases: ['open browser', 'show browser', 'open portfolio', 'show work'],
    label: 'Opening Browser',
    action: { type: 'openBrowser' },
  },
  {
    phrases: ['open about', 'show about', 'about me', 'open about me'],
    label: 'Opening About',
    action: { type: 'openAbout' },
  },
  {
    phrases: ['open contact', 'show contact', 'contact me', "let's chat"],
    label: 'Opening Contact',
    action: { type: 'openContact' },
  },
  {
    phrases: ['open welcome', 'show welcome', 'open notes', 'show notes'],
    label: 'Opening Welcome',
    action: { type: 'openWelcome' },
  },
  {
    phrases: [
      'open terminal',
      'show terminal',
      'open console',
      'show console',
      'open sarahos',
      'boot sarahos',
      'open system',
      'system information',
    ],
    label: 'Opening Terminal',
    action: { type: 'openTerminal' },
  },
  {
    phrases: ['open start', 'start menu', 'open start menu'],
    label: 'Opening Start',
    action: { type: 'openStart' },
  },
  {
    phrases: ['go to dock', 'show dock', 'focus dock', 'focus taskbar'],
    label: 'Focusing dock',
    action: { type: 'focusDock' },
  },
  {
    phrases: [
      'magnifier on',
      'turn on magnifier',
      'enable magnifier',
      'open magnifier',
    ],
    label: 'Magnifier on',
    action: { type: 'setMagnifier', on: true },
  },
  {
    phrases: [
      'magnifier off',
      'turn off magnifier',
      'disable magnifier',
      'close magnifier',
    ],
    label: 'Magnifier off',
    action: { type: 'setMagnifier', on: false },
  },
  {
    phrases: ['dark mode', 'toggle dark mode', 'night mode'],
    label: 'Toggling dark mode',
    action: { type: 'toggleA11y', key: 'darkMode' },
  },
  {
    phrases: ['high contrast', 'toggle high contrast'],
    label: 'Toggling high contrast',
    action: { type: 'toggleA11y', key: 'highContrast' },
  },
  {
    phrases: ['narrator on', 'narrator off', 'toggle narrator', 'start narrator'],
    label: 'Toggling narrator',
    action: { type: 'toggleA11y', key: 'narrator' },
  },
  {
    phrases: [
      'head control',
      'toggle head control',
      'eye control',
      'toggle eye control',
    ],
    label: 'Toggling head control',
    action: { type: 'toggleA11y', key: 'headControl' },
  },
  {
    phrases: ['dwell cursor', 'toggle dwell', 'dwell click'],
    label: 'Toggling dwell cursor',
    action: { type: 'toggleA11y', key: 'dwellCursor' },
  },
  {
    phrases: ['reduced motion', 'toggle reduced motion'],
    label: 'Toggling reduced motion',
    action: { type: 'toggleA11y', key: 'reducedMotion' },
  },
  {
    phrases: [
      'stop listening',
      'voice access off',
      'turn off voice',
      'stop voice',
      'disable voice access',
    ],
    label: 'Stopping Voice Access',
    action: { type: 'toggleA11y', key: 'voiceAccess' },
  },
  {
    phrases: ['close window', 'close that', 'close this'],
    label: 'Closing window',
    action: { type: 'closeWindow' },
  },
  {
    phrases: ['throw ball left', 'toss ball left', 'fetch left'],
    label: 'Throwing ball left',
    action: { type: 'throwBall', direction: 'left' },
  },
  {
    phrases: ['throw ball right', 'toss ball right', 'fetch right'],
    label: 'Throwing ball right',
    action: { type: 'throwBall', direction: 'right' },
  },
  {
    phrases: ['throw ball up', 'toss ball up', 'fetch up'],
    label: 'Throwing ball up',
    action: { type: 'throwBall', direction: 'up' },
  },
  {
    phrases: [
      'throw ball',
      'throw the ball',
      'toss the ball',
      'play fetch',
      'fetch',
    ],
    label: 'Throwing ball',
    action: { type: 'throwBall', direction: 'right' },
  },
  {
    phrases: ['help', 'what can i say', 'voice help', 'list commands'],
    label: HELP_HINT,
    action: { type: 'help' },
  },
]

export function normalizeTranscript(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Match the first command whose phrase appears in the transcript. */
export function matchVoiceCommand(
  transcript: string,
): MatchedVoiceCommand | null {
  const text = normalizeTranscript(transcript)
  if (!text) return null

  let best: { score: number; match: MatchedVoiceCommand } | null = null

  for (const cmd of COMMANDS) {
    for (const phrase of cmd.phrases) {
      if (!text.includes(phrase)) continue
      const score = phrase.length
      if (!best || score > best.score) {
        best = {
          score,
          match: { label: cmd.label, action: cmd.action },
        }
      }
    }
  }

  return best?.match ?? null
}

export const VOICE_LISTEN_HINT = HELP_HINT
