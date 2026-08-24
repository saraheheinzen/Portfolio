import {
  about,
  caseStudies,
  categories,
  contact,
  projects,
  type Project,
} from './content'

export type ClippyAction =
  | { type: 'openAbout' }
  | { type: 'openContact' }
  | { type: 'openFeatured' }
  | { type: 'openWelcome' }
  | { type: 'openTerminal' }
  | { type: 'openBrowser'; projectId?: string }
  | { type: 'openFolder'; category: Project['category'] }
  | { type: 'openProject'; projectId: string }

export interface KnowledgeChunk {
  id: string
  topic: string
  keywords: string[]
  text: string
  action?: ClippyAction
}

function projectKeywords(p: Project): string[] {
  const words = [
    p.id,
    p.title,
    p.category,
    p.tags,
    ...p.summary.split(/\W+/),
    ...(p.highlights ?? []).flatMap((h) => h.split(/\W+/)),
  ]
  return words.map((w) => w.toLowerCase()).filter((w) => w.length > 2)
}

function caseStudyBlurb(projectId: string): string {
  const cs = caseStudies[projectId]
  if (!cs) return ''
  const bits: string[] = []
  if (cs.company) bits.push(`Company: ${cs.company}.`)
  if (cs.intro) bits.push(cs.intro)
  if (cs.meta?.length) {
    bits.push(
      cs.meta.map((m) => `${m.label}: ${m.value.replace(/\n/g, ' ')}`).join(' · '),
    )
  }
  for (const section of cs.sections ?? []) {
    const texts = (section.blocks ?? [])
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text!)
    if (section.title && texts.length) {
      bits.push(`${section.title}: ${texts.join(' ').slice(0, 420)}`)
    }
  }
  return bits.join('\n').slice(0, 1400)
}

const FOLDERS: Project['category'][] = [
  'games',
  'product',
  'prototyping',
  'player',
]

/** Validate model/client action payloads before opening windows. */
export function parseClippyAction(raw: unknown): ClippyAction | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const a = raw as Record<string, unknown>
  switch (a.type) {
    case 'openAbout':
    case 'openContact':
    case 'openFeatured':
    case 'openWelcome':
    case 'openTerminal':
      return { type: a.type }
    case 'openBrowser':
      if (a.projectId === undefined || typeof a.projectId === 'string') {
        return {
          type: 'openBrowser',
          ...(typeof a.projectId === 'string' ? { projectId: a.projectId } : {}),
        }
      }
      return undefined
    case 'openFolder':
      if (typeof a.category === 'string' && FOLDERS.includes(a.category as Project['category'])) {
        return { type: 'openFolder', category: a.category as Project['category'] }
      }
      return undefined
    case 'openProject':
      if (typeof a.projectId === 'string' && projects.some((p) => p.id === a.projectId)) {
        return { type: 'openProject', projectId: a.projectId }
      }
      return undefined
    default:
      return undefined
  }
}

export function buildKnowledge(): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [
    {
      id: 'who',
      topic: 'About Sarah',
      keywords: [
        'who',
        'sarah',
        'heinzen',
        'about',
        'bio',
        'designer',
        'role',
        'job',
        'work',
        'microsoft',
        'inclusive',
        'accessibility',
        'intro',
        'herself',
      ],
      text: [
        `${about.name} is a ${about.title} at ${about.company}.`,
        ...about.bio,
      ].join('\n\n'),
      action: { type: 'openAbout' },
    },
    {
      id: 'companies',
      topic: 'Companies',
      keywords: [
        'company',
        'companies',
        'microsoft',
        'spatial',
        'neato',
        'xbox',
        'worked',
        'employer',
        'experience',
        'resume',
        'career',
      ],
      text: `Sarah has worked with ${about.companies.map((c) => c.name).join(', ')}. Open About Me for links and the fuller story.`,
      action: { type: 'openAbout' },
    },
    {
      id: 'skills',
      topic: 'Skills & tools',
      keywords: [
        'skill',
        'skills',
        'tool',
        'tools',
        'figma',
        'after',
        'effects',
        'cinema',
        'software',
        'stack',
        'design',
        'motion',
        '3d',
        'development',
        'unity',
        'c#',
        'csharp',
        'cursor',
        'claude',
        'vibe',
        'coding',
      ],
      text: about.skills
        .map((s) => `${s.label}: ${s.detail}`)
        .join('\n'),
      action: { type: 'openAbout' },
    },
    {
      id: 'terminal',
      topic: 'SarahOS terminal',
      keywords: [
        'terminal',
        'console',
        'sarahos',
        'boot',
        'command',
        'commands',
        'help',
        'whoami',
        'fortune',
        'coffee',
        'sudo',
        'cli',
      ],
      text: [
        'Open Terminal for a SarahOS boot sequence and playful commands.',
        'Try help, whoami, fortune, coffee, design, why, or sudo hire sarah.',
        'about, projects, games, resume, and contact open matching desktop apps.',
      ].join('\n'),
      action: { type: 'openTerminal' },
    },
    {
      id: 'contact',
      topic: 'Contact',
      keywords: [
        'contact',
        'email',
        'reach',
        'hire',
        'speak',
        'speaking',
        'message',
        'hello',
        'mail',
        'get in touch',
      ],
      text: `You can email Sarah at ${contact.email}. ${contact.note}`,
      action: { type: 'openContact' },
    },
    {
      id: 'portfolio-os',
      topic: 'How this portfolio works',
      keywords: [
        'portfolio',
        'desktop',
        'window',
        'navigate',
        'how',
        'site',
        'os',
        'dock',
        'launcher',
        'icon',
        'explore',
        'help',
        'clippy',
        'accessibility',
        'magnifier',
      ],
      text: [
        'This portfolio is a pastel desktop OS. Double-click desktop icons or use the bottom dock launcher to open windows.',
        'Apps: Games (Steam library), Browser (knowledge base with Featured, Product Design, Games, Inclusive Design, Speaking, and Blog), Media Player (motion library), and Terminal (SarahOS console). Welcome opens a sticky note you can drag around.',
        'Accessibility tools live in the dock settings (contrast, dark mode, text scale, color filters, magnifier, and more).',
        "I'm Finnley, Sarah's dog, and the namesake for this assistant. Ask me about Sarah, her projects, contact, or how to get around.",
      ].join('\n\n'),
      action: { type: 'openWelcome' },
    },
    {
      id: 'why-desktop',
      topic: 'Why a desktop?',
      keywords: [
        'why',
        'desktop',
        'site',
        'portfolio',
        'os',
        'windows',
        'metaphor',
        'theme',
        'concept',
        'human',
        'interaction',
        'interactive',
        'secret',
        'confidential',
        'nda',
        'microsoft',
        'share',
        'instead',
        'choose',
        'chose',
        'format',
      ],
      text: [
        'Why is this site a desktop? Two big reasons:',
        'Sarah wanted a portfolio you can actually poke around in: windows, dock, clippy, dwell/head/voice controls, so human interaction and inclusive input aren’t just described, they’re demonstrated.',
        'And a lot of her day-to-day Microsoft work is confidential, so she can’t share secret Microsoft things here. The desktop is a playful vessel for the work she *can* show, plus personality and craft.',
      ].join('\n\n'),
      action: { type: 'openWelcome' },
    },
    {
      id: 'browser-app',
      topic: 'Browser',
      keywords: [
        'browser',
        'chrome',
        'tabs',
        'product',
        'prototyping',
        'case',
        'study',
        'web',
        'featured',
        'pinned',
        'knowledge',
        'blog',
        'speaking',
        'inclusive',
        'guidelines',
      ],
      text: 'The Browser is the knowledge base. Pinned tabs: Featured, Product Design, Games, Inclusive Design (Microsoft Inclusive Design site), Speaking, and Blog. Open a section to browse work or read longer pages.',
      action: { type: 'openBrowser' },
    },
    {
      id: 'featured',
      topic: 'Featured work',
      keywords: ['featured', 'highlight', 'best', 'top', 'favorite', 'showcase', 'pinned'],
      text: `Featured work includes: ${projects
        .filter((p) => p.featured)
        .map((p) => p.title)
        .join(', ')}.`,
      action: { type: 'openBrowser', projectId: 'featured' },
    },
    {
      id: 'inclusive-guide',
      topic: 'Inclusive Design',
      keywords: [
        'inclusive design',
        'guidelines',
        'hig',
        'principles',
        'a11y guide',
        'how to design',
        'microsoft inclusive',
      ],
      text: 'The Inclusive Design tab in the Browser opens Microsoft Inclusive Design (inclusive.microsoft.design): principles, tools, and lived-experience stories.',
      action: { type: 'openBrowser', projectId: 'inclusive' },
    },
    {
      id: 'finnley',
      topic: 'Finnley',
      keywords: [
        'finnley',
        'finley',
        'dog',
        'puppy',
        'pup',
        'pet',
        'pets',
        'assistant',
        'mascot',
        'fetch',
        'ball',
        'who',
      ],
      text: [
        'Finnley is Sarah’s dog, her real-life pup, not just a mascot.',
        'This little desktop assistant is named after him. You’ll find him on the desktop: click to chat, drag him around, or throw the ball and watch him chase it.',
        'It looks like you might want to meet the original Finnley. Sarah’s probably happy to talk about him in Contact.',
      ].join('\n\n'),
    },
    {
      id: 'hobbies',
      topic: 'Free time',
      keywords: [
        'hobby',
        'hobbies',
        'free',
        'time',
        'fun',
        'games',
        'personal',
        'outside',
      ],
      text: about.bio[2] ?? about.bio[about.bio.length - 1],
      action: { type: 'openAbout' },
    },
  ]

  for (const [id, cat] of Object.entries(categories) as Array<
    [Project['category'], (typeof categories)[Project['category']]]
  >) {
    const list = projects.filter((p) => p.category === id)
    const action: ClippyAction =
      id === 'product' || id === 'prototyping'
        ? { type: 'openBrowser', projectId: 'product' }
        : { type: 'openFolder', category: id }
    chunks.push({
      id: `folder-${id}`,
      topic: cat.label,
      keywords: [
        id,
        cat.label.toLowerCase(),
        ...cat.description.split(/\W+/).map((w) => w.toLowerCase()),
        ...list.flatMap((p) => [p.id, ...p.title.toLowerCase().split(/\W+/)]),
      ].filter((w) => w.length > 2),
      text: `${cat.label}: ${cat.description}\n\nProjects: ${list.map((p) => p.title).join(', ') || 'none listed yet'}.${
        id === 'product' || id === 'prototyping'
          ? '\n\nThese open under Product Design in the Browser knowledge base.'
          : ''
      }`,
      action,
    })
  }

  for (const p of projects) {
    const cs = caseStudyBlurb(p.id)
    chunks.push({
      id: `project-${p.id}`,
      topic: p.title,
      keywords: projectKeywords(p),
      text: [
        `${p.title} (${categories[p.category].label})`,
        p.summary,
        p.description,
        p.highlights?.length ? `Highlights: ${p.highlights.join('; ')}` : '',
        p.externalUrl ? `External link: ${p.externalUrl}` : '',
        p.locked ? 'Marked as a locked case study on the desktop.' : '',
        cs,
      ]
        .filter(Boolean)
        .join('\n\n'),
      action: { type: 'openProject', projectId: p.id },
    })
  }

  return chunks
}
