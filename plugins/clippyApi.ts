import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

const FOLDERS = new Set(['games', 'product', 'prototyping', 'player'])

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function parseAction(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object') return null
  const a = raw as Record<string, unknown>
  switch (a.type) {
    case 'openAbout':
    case 'openContact':
    case 'openFeatured':
    case 'openWelcome':
      return { type: a.type }
    case 'openBrowser':
      if (a.projectId === undefined || typeof a.projectId === 'string') {
        return {
          type: 'openBrowser',
          ...(typeof a.projectId === 'string' && a.projectId.trim()
            ? { projectId: a.projectId.trim() }
            : {}),
        }
      }
      return null
    case 'openFolder':
      if (typeof a.category === 'string' && FOLDERS.has(a.category)) {
        return { type: 'openFolder', category: a.category }
      }
      return null
    case 'openProject':
      if (typeof a.projectId === 'string' && a.projectId.trim()) {
        return { type: 'openProject', projectId: a.projectId.trim() }
      }
      return null
    default:
      return null
  }
}

function buildSystemPrompt(context: string): string {
  return [
    "You are Finnley, the cheerful desktop assistant for Sarah Heinzen's Portfolio OS — named after Sarah's dog.",
    "Sarah is a Senior Inclusive Product Designer at Microsoft's Inclusive Tech Lab. Contact: hello@sarahheinzen.com.",
    'Personality: warm, brief, a little playful, office-assistant energy ("It looks like…"). Finnley the assistant is named after Sarah\'s real dog. Never invent employers, projects, awards, or contact details.',
    'Only use facts from the BRIEFING NOTES below. If something is not covered, say you are not sure and suggest Contact or opening Browser.',
    'Keep answers under ~120 words unless the user asks for detail.',
    '',
    'Allowed actions (JSON only, or null). Prefer ones that appear in the briefing notes:',
    '- {"type":"openAbout"}',
    '- {"type":"openContact"}',
    '- {"type":"openWelcome"}',
    '- {"type":"openBrowser"} or {"type":"openBrowser","projectId":"<id>"}',
    '- {"type":"openFeatured"} (alias for Browser home)',
    '- {"type":"openFolder","category":"games"|"product"|"prototyping"|"player"}',
    '- {"type":"openProject","projectId":"<id from briefing notes>"}',
    '',
    'Respond with ONLY valid JSON (no markdown fences):',
    '{"text":"string","action":null or action object,"suggestions":["up to 4 short follow-ups"]}',
    '',
    'BRIEFING NOTES:',
    context || '(no specific notes matched — stay general and honest)',
  ].join('\n')
}

function parseModelPayload(content: string) {
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
      : []
    return {
      text: data.text.trim(),
      action: parseAction(data.action),
      suggestions,
    }
  } catch {
    return null
  }
}

async function callOpenAiCompatible(messages: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { error: 'missing_key' as const }

  const base = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(
    /\/$/,
    '',
  )
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      messages,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    return { error: 'upstream' as const, status: res.status, detail: errText.slice(0, 400) }
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) return { error: 'empty' as const }
  return { content }
}

function createHandler() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.end()
      return
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      sendJson(res, 503, { error: 'LLM not configured', code: 'missing_key' })
      return
    }

    try {
      const raw = await readBody(req)
      const body = JSON.parse(raw || '{}') as {
        question?: unknown
        context?: unknown
        history?: Array<{ role?: unknown; content?: unknown }>
      }

      const question = typeof body.question === 'string' ? body.question.trim() : ''
      if (!question) {
        sendJson(res, 400, { error: 'question is required' })
        return
      }

      const context = typeof body.context === 'string' ? body.context : ''
      const history: ChatMessage[] = Array.isArray(body.history)
        ? body.history
            .filter(
              (m): m is { role: 'user' | 'assistant'; content: string } =>
                (m?.role === 'user' || m?.role === 'assistant') &&
                typeof m.content === 'string' &&
                m.content.trim().length > 0,
            )
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content.trim() }))
        : []

      const messages: ChatMessage[] = [
        { role: 'system', content: buildSystemPrompt(context) },
        ...history,
        { role: 'user', content: question },
      ]

      const result = await callOpenAiCompatible(messages)
      if ('error' in result) {
        if (result.error === 'missing_key') {
          sendJson(res, 503, { error: 'LLM not configured', code: 'missing_key' })
          return
        }
        sendJson(res, 502, {
          error: 'Upstream model error',
          code: result.error,
          detail: 'detail' in result ? result.detail : undefined,
        })
        return
      }

      const parsed = parseModelPayload(result.content)
      if (!parsed) {
        sendJson(res, 200, {
          reply: {
            text: result.content.trim(),
            action: null,
            suggestions: [
              'Who is Sarah?',
              'Show Browser',
              'How do I use this site?',
              'How can I contact her?',
            ],
          },
        })
        return
      }

      sendJson(res, 200, {
        reply: {
          text: parsed.text,
          action: parsed.action,
          suggestions: parsed.suggestions.length
            ? parsed.suggestions
            : [
                'Who is Sarah?',
                'Show Browser',
                'How do I use this site?',
                'How can I contact her?',
              ],
        },
      })
    } catch (err) {
      sendJson(res, 500, {
        error: 'Clippy API failed',
        detail: err instanceof Error ? err.message : String(err),
      })
    }
  }
}

/** Dev + preview middleware: POST /api/clippy → OpenAI-compatible chat. */
export function clippyApiPlugin(): Plugin {
  const attach = (middlewares: Connect.Server) => {
    const handler = createHandler()
    middlewares.use('/api/clippy', (req, res, next) => {
      void handler(req, res).catch(() => next())
    })
  }

  return {
    name: 'clippy-api',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}
