import {
  buildKnowledge,
  parseClippyAction,
  type ClippyAction,
  type KnowledgeChunk,
} from '../data/clippyKnowledge'
import { about, contact } from '../data/content'

export interface ClippyReply {
  text: string
  action?: ClippyAction
  suggestions?: string[]
  source?: 'llm' | 'local'
}

export interface ClippyChatTurn {
  role: 'user' | 'clippy'
  text: string
}

const knowledge = buildKnowledge()

const GREETINGS = /\b(hi|hello|hey|yo|howdy|sup|good\s*(morning|afternoon|evening))\b/i
const THANKS = /\b(thanks|thank you|thx|appreciate)\b/i
const HELP = /^(help|\?|what can you|what do you|commands?)\b/i

function normalize(q: string) {
  return q
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(q: string) {
  return normalize(q)
    .split(' ')
    .filter((t) => t.length > 1 && !STOP.has(t))
}

const STOP = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'with',
  'about',
  'me',
  'you',
  'your',
  'her',
  'his',
  'do',
  'does',
  'did',
  'can',
  'could',
  'would',
  'should',
  'what',
  'who',
  'where',
  'when',
  'why',
  'how',
  'tell',
  'show',
  'please',
  'some',
  'any',
  'this',
  'that',
  'from',
  'into',
  'more',
  'info',
  'information',
])

function scoreChunk(chunk: KnowledgeChunk, toks: string[], raw: string): number {
  let score = 0
  const hay = `${chunk.topic} ${chunk.keywords.join(' ')} ${chunk.text}`.toLowerCase()

  for (const t of toks) {
    if (chunk.keywords.includes(t)) score += 4
    else if (hay.includes(t)) score += 1.5
  }

  if (/\b(who is|who're|who's|about sarah|tell me about)\b/.test(raw) && chunk.id === 'who') {
    score += 12
  }
  if (/\b(email|contact|reach|hire)\b/.test(raw) && chunk.id === 'contact') {
    score += 10
  }
  if (/\b(skill|tool|figma|software)\b/.test(raw) && chunk.id === 'skills') {
    score += 8
  }
  if (
    /\b(how (do|does|to)|navigate|portfolio|desktop|site|clippy)\b/.test(raw) &&
    chunk.id === 'portfolio-os'
  ) {
    score += 8
  }
  if (/\bfeatured\b/.test(raw) && chunk.id === 'featured') {
    score += 8
  }

  return score
}

function clippyVoice(body: string, topic?: string): string {
  const openers = [
    'It looks like you want to know more…',
    'Ooh, I know this one!',
    'Happy to help with that.',
    'Here’s what I’ve got from the desktop briefing notes:',
  ]
  const opener = openers[Math.floor(Math.random() * openers.length)]
  const label = topic ? `\n\n✦ ${topic}\n` : '\n\n'
  return `${opener}${label}${body}`
}

export function defaultSuggestions(action?: ClippyAction): string[] {
  const base = [
    'Who is Sarah?',
    'Show Browser',
    'How do I use this site?',
    'How can I contact her?',
  ]
  if (action?.type === 'openProject') {
    return ['Who is Sarah?', 'Show Browser', 'What skills does she use?', 'Contact']
  }
  return base
}

/** Top knowledge matches for grounding an LLM or local reply. */
export function retrieveKnowledge(question: string, limit = 5) {
  const raw = normalize(question)
  const toks = tokens(question)
  return knowledge
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, toks, raw) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function formatContext(hits: ReturnType<typeof retrieveKnowledge>): string {
  if (!hits.length) return ''
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] id=${h.chunk.id} topic=${h.chunk.topic}` +
        (h.chunk.action ? ` action=${JSON.stringify(h.chunk.action)}` : '') +
        `\n${h.chunk.text}`,
    )
    .join('\n\n---\n\n')
}

/** Offline / fallback Clippy — keyword retrieval only. */
export function answerClippyLocal(question: string): ClippyReply {
  const raw = question.trim()
  if (!raw) {
    return {
      text: 'Ask me anything about Sarah or this Portfolio OS — projects, skills, contact, or how to poke around.',
      suggestions: defaultSuggestions(),
      source: 'local',
    }
  }

  if (GREETINGS.test(raw) && raw.length < 40) {
    return {
      text: `Hi! I’m Clippy, temporary office assistant for ${about.name}’s Portfolio OS. Ask about her work, open projects, or how to get around the desktop.`,
      suggestions: defaultSuggestions(),
      source: 'local',
    }
  }

  if (THANKS.test(raw) && raw.length < 50) {
    return {
      text: 'You’re welcome! I’ll be down here if you need me. Try not to minimize anything important.',
      suggestions: defaultSuggestions(),
      source: 'local',
    }
  }

  if (HELP.test(raw) || /\bwhat can you (do|help)\b/i.test(raw)) {
    return {
      text: [
        'I can help with:',
        '• Who Sarah is and where she works',
        '• Projects, case studies, and Browser highlights',
        '• Skills and tools',
        '• How this Portfolio OS works',
        `• Contact (${contact.email})`,
        '',
        'Tip: after I answer, I can open the matching window on the desktop.',
      ].join('\n'),
      suggestions: defaultSuggestions(),
      source: 'local',
    }
  }

  const scored = retrieveKnowledge(raw, 3)

  if (!scored.length || scored[0].score < 3) {
    return {
      text: `Hmm, I’m not sure about that. Try asking about ${about.name}, a project like Get Goating or TellSense, her skills, or how to use the desktop. Or open Contact and email ${contact.email}.`,
      suggestions: defaultSuggestions(),
      action: { type: 'openContact' },
      source: 'local',
    }
  }

  const top = scored[0]
  const runner = scored[1]
  let body = top.chunk.text

  if (
    runner &&
    runner.score >= top.score * 0.72 &&
    runner.chunk.id !== top.chunk.id &&
    top.chunk.id.startsWith('project-') &&
    runner.chunk.id.startsWith('project-')
  ) {
    body += `\n\nRelated: ${runner.chunk.topic} — ${runner.chunk.text.split('\n')[1] ?? runner.chunk.text.slice(0, 160)}`
  }

  if (body.length > 900) {
    body = `${body.slice(0, 880).replace(/\s+\S*$/, '')}…`
  }

  return {
    text: clippyVoice(body, top.chunk.topic),
    action: top.chunk.action,
    suggestions: defaultSuggestions(top.chunk.action),
    source: 'local',
  }
}

/** @deprecated use answerClippyLocal or askClippy */
export const answerClippy = answerClippyLocal

function parseModelJson(content: string): ClippyReply | null {
  const trimmed = content.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced?.[1]?.trim() ?? trimmed
  try {
    const data = JSON.parse(candidate) as {
      text?: unknown
      action?: unknown
      suggestions?: unknown
    }
    if (typeof data.text !== 'string' || !data.text.trim()) return null
    const suggestions = Array.isArray(data.suggestions)
      ? data.suggestions.filter((s): s is string => typeof s === 'string').slice(0, 4)
      : defaultSuggestions()
    return {
      text: data.text.trim(),
      action: parseClippyAction(data.action),
      suggestions: suggestions.length ? suggestions : defaultSuggestions(),
      source: 'llm',
    }
  } catch {
    return null
  }
}

async function askClippyLlm(
  question: string,
  history: ClippyChatTurn[],
): Promise<ClippyReply | null> {
  const hits = retrieveKnowledge(question, 6)
  const fallbackAction = hits[0]?.chunk.action

  try {
    const res = await fetch('/api/clippy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        history: history.slice(-8).map((m) => ({
          role: m.role === 'clippy' ? 'assistant' : 'user',
          content: m.text,
        })),
        context: formatContext(hits),
      }),
    })

    if (res.status === 503) return null
    if (!res.ok) return null

    const data = (await res.json()) as { text?: string; content?: string; reply?: ClippyReply }
    if (data.reply?.text) {
      return {
        text: data.reply.text,
        action: parseClippyAction(data.reply.action) ?? fallbackAction,
        suggestions:
          data.reply.suggestions?.length && data.reply.suggestions.length > 0
            ? data.reply.suggestions
            : defaultSuggestions(fallbackAction),
        source: 'llm',
      }
    }

    const rawText = data.text ?? data.content
    if (typeof rawText === 'string') {
      const parsed = parseModelJson(rawText)
      if (parsed) {
        return {
          ...parsed,
          action: parsed.action ?? fallbackAction,
        }
      }
      return {
        text: rawText.trim(),
        action: fallbackAction,
        suggestions: defaultSuggestions(fallbackAction),
        source: 'llm',
      }
    }
    return null
  } catch {
    return null
  }
}

/** Prefer LLM via /api/clippy; fall back to local retrieval. */
export async function askClippy(
  question: string,
  history: ClippyChatTurn[] = [],
): Promise<ClippyReply> {
  const llm = await askClippyLlm(question, history)
  if (llm) {
    // Re-validate action against known projects/folders on the client
    return {
      ...llm,
      action: parseClippyAction(llm.action),
    }
  }
  return answerClippyLocal(question)
}

export const CLIPPY_STARTER_CHIPS = [
  'Who is Sarah?',
  'Browser highlights',
  'TellSense',
  'Get Goating',
  'How does this site work?',
  'Contact',
]
