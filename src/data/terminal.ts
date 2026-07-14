import { about, contact, getFeaturedProjects } from './content'

/** SarahOS terminal — boot copy, help, and easter-egg replies. */
export const terminal = {
  osName: 'SarahOS',
  version: 'v30.0',
  prompt: '> boot SarahOS',
  pressEnter: 'Press ENTER to continue...',
  bootSteps: [
    { kind: 'echo' as const, text: '> boot SarahOS' },
    {
      kind: 'progress' as const,
      label: 'Loading design system',
      dots: 21,
      status: 'Done',
    },
    {
      kind: 'progress' as const,
      label: 'Initializing curiosity',
      dots: 20,
      status: 'Done',
    },
    {
      kind: 'progress' as const,
      label: 'Connecting diverse perspectives',
      dots: 11,
      status: 'Done',
    },
    {
      kind: 'progress' as const,
      label: 'Accessibility services',
      dots: 20,
      status: 'Enabled',
    },
    {
      kind: 'progress' as const,
      label: 'Prototype engine',
      dots: 26,
      status: 'Running',
    },
    {
      kind: 'progress' as const,
      label: 'Empathy module',
      dots: 28,
      status: 'Online',
    },
    { kind: 'blank' as const },
    { kind: 'echo' as const, text: 'Launching SarahOS...' },
    { kind: 'blank' as const },
  ],
  welcomes: ['Welcome back.', 'System ready.'],
  fortunes: [
    'If users keep making the same mistake, it\'s probably the design.',
    'Edge cases are often just people we forgot to design for.',
    'Curiosity scales better than assumptions.',
    'Every bug is someone else\'s lived experience.',
  ],
  helpCommands: [
    'about',
    'projects',
    'games',
    'resume',
    'contact',
    'coffee',
    'inspire',
    'clear',
  ],
}

export type TerminalAction =
  | { type: 'openAbout' }
  | { type: 'openBrowser' }
  | { type: 'openGames' }
  | { type: 'openContact' }

export interface TerminalResult {
  lines: string[]
  clear?: boolean
  action?: TerminalAction
}

function featuredProjectLines() {
  const featured = getFeaturedProjects()
  if (!featured.length) {
    return ['No projects indexed. Try the Browser app.']
  }
  return [
    'Featured work:',
    ...featured.map((p) => `  • ${p.title} — ${p.summary}`),
    '',
    'Opening Browser…',
  ]
}

export function runTerminalCommand(raw: string): TerminalResult {
  const input = raw.trim().replace(/\s+/g, ' ')
  const lower = input.toLowerCase()

  if (!input) return { lines: [] }

  if (lower === 'help') {
    return {
      lines: [
        'Available commands',
        '',
        ...terminal.helpCommands.map((cmd) => `  ${cmd}`),
        '',
        'Tip: try whoami, fortune, or design.',
      ],
    }
  }

  if (lower === 'clear' || lower === 'cls') {
    return { lines: [], clear: true }
  }

  if (lower === 'about') {
    return {
      lines: [
        about.name,
        about.title,
        about.company,
        '',
        about.bio[0] ?? '',
        '',
        'Opening About Me…',
      ],
      action: { type: 'openAbout' },
    }
  }

  if (lower === 'projects') {
    return {
      lines: featuredProjectLines(),
      action: { type: 'openBrowser' },
    }
  }

  if (lower === 'games') {
    return {
      lines: [
        'Launching Games library…',
        'Get Goating, Skiddy Kitty, and more await.',
      ],
      action: { type: 'openGames' },
    }
  }

  if (lower === 'resume') {
    return {
      lines: [
        `${about.name} — ${about.title}`,
        about.company,
        '',
        ...about.bio.slice(0, 2),
        '',
        `Companies: ${about.companies.map((c) => c.name).join(', ')}`,
        '',
        'Opening About Me…',
      ],
      action: { type: 'openAbout' },
    }
  }

  if (lower === 'contact') {
    return {
      lines: [
        `Email: ${contact.email}`,
        contact.note,
        '',
        'Opening Contact…',
      ],
      action: { type: 'openContact' },
    }
  }

  if (lower === 'coffee') {
    return {
      lines: [
        'Coffee levels acceptable.',
        '',
        'Productivity increased by 18%.',
        '',
        '☕',
      ],
    }
  }

  if (lower === 'inspire') {
    return {
      lines: [
        'Inspiration online.',
        '',
        'Start with a real person.',
        'Then invent the interface.',
      ],
    }
  }

  if (lower === 'whoami') {
    return {
      lines: [
        about.name,
        '',
        about.title,
        '',
        'Current status:',
        'Building things for humans.',
      ],
    }
  }

  if (lower === 'fortune') {
    const pick =
      terminal.fortunes[Math.floor(Math.random() * terminal.fortunes.length)]
    return { lines: [pick] }
  }

  if (lower === 'sudo hire sarah' || lower === 'sudo hire sarah heinzen') {
    return {
      lines: ['Permission granted.', '', 'Nice choice.', '', '😂'],
    }
  }

  if (lower === 'makeitpop' || lower === 'make it pop') {
    return {
      lines: [
        'Error:',
        '',
        'Unable to locate "pop."',
        '',
        'Did you mean "improve usability"?',
      ],
    }
  }

  if (lower === 'averageuser' || lower === 'average user') {
    return {
      lines: [
        'Error:',
        '',
        'No average user found.',
        '',
        'Try again with a real human.',
      ],
    }
  }

  if (lower === 'design') {
    return {
      lines: [
        'Loading...',
        '',
        'People first.',
        '',
        'Technology second.',
        '',
        'Always.',
      ],
    }
  }

  if (lower === 'why') {
    return {
      lines: ['Because "good enough"', 'usually isn\'t.'],
    }
  }

  return {
    lines: [
      `command not found: ${input}`,
      'Type help for available commands.',
    ],
  }
}
