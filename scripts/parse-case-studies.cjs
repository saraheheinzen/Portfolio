const fs = require('fs')
const path = require('path')

const dir = 'webflow-export'
const pages = {
  'spatial-spaces-picker': 'spaces-picker.html',
  'spatial-auto-gallery': 'auto-gallery.html',
  tellsense: 'tellsense.html',
  'neato-hardware': 'clean-center.html',
  'neato-default-screen': 'default-screen.html',
  'xr-prototyping': 'xr-prototypes.html',
  'skiddy-kitty': 'skiddy-kitty.html',
  'neato-animations': 'neato-animations.html',
  'neato-user-testing': 'neato-user-testing.html',
  'notification-center': 'notification-center.html',
  analytics: 'analytics.html',
}

function decode(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function mediaPath(projectId, src) {
  if (!src) return null
  const file = path.basename(src.replace(/\\/g, '/').split('?')[0])
  if (!file || /-p-\d+\./.test(file)) return null
  const full = path.join('public/media', projectId, file)
  if (fs.existsSync(full)) return `/media/${projectId}/${file}`
  const folder = path.join('public/media', projectId)
  if (fs.existsSync(folder)) {
    const found = fs
      .readdirSync(folder)
      .find((f) => f === file || f.replace(/ /g, '-') === file)
    if (found) return `/media/${projectId}/${found}`
  }
  return null
}

function stripTags(html) {
  return decode(
    html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?em>/gi, '').replace(/<[^>]+>/g, ''),
  )
}

function extractVimeoFromIframe(full, nearby) {
  const srcAttr = (full.match(/\ssrc="([^"]+)"/) || [])[1] || ''
  let decoded = srcAttr
  try {
    decoded = decodeURIComponent(srcAttr)
  } catch {
    /* ignore */
  }
  const dm =
    srcAttr.match(/player\.vimeo\.com\/video\/(\d+)(?:\?h=([a-z0-9]+))?/) ||
    decoded.match(/player\.vimeo\.com\/video\/(\d+)(?:\?h=([a-z0-9]+))?/)
  if (!dm) return null
  const src = `https://player.vimeo.com/video/${dm[1]}${dm[2] ? `?h=${dm[2]}` : ''}`
  const portrait = /padding-top:217/.test(nearby)
  return { type: 'video', src, portrait }
}

const studies = {}

for (const [id, page] of Object.entries(pages)) {
  const html = fs.readFileSync(path.join(dir, page), 'utf8')
  const headerMatch = html.match(/<header[\s\S]*?<\/header>/i)
  const header = headerMatch ? headerMatch[0] : ''

  const company = (header.match(/<div class="subheader">([\s\S]*?)<\/div>/) || [])[1]
  const title = (header.match(/<h1 class="header">([\s\S]*?)<\/h1>/) || [])[1]
  const intro = (header.match(/<div class="text-block-8">([\s\S]*?)<\/div>/) || [])[1]

  const meta = []
  const metaRe =
    /<h6 class="subheading2">([\s\S]*?)<\/h6>\s*<p class="paragraph">([\s\S]*?)<\/p>/g
  let mm
  while ((mm = metaRe.exec(header))) {
    meta.push({ label: stripTags(mm[1]), value: stripTags(mm[2]) })
  }

  const heroImgs = [...header.matchAll(/<img[^>]+>/g)].map((x) => x[0])
  let hero = null
  let badge = null
  for (const img of heroImgs) {
    const src = (img.match(/\ssrc="([^"]+)"/) || [])[1]
    const alt = decode((img.match(/\salt="([^"]*)"/) || [])[1] || '')
    const p = mediaPath(id, src)
    if (!p) continue
    if (/hackathon/i.test(src)) badge = { src: p, alt: alt || 'Hackathon badge' }
    else hero = { src: p, alt }
  }

  const toc = []
  const tocRe = /<a href="(#[^"]+)" class="link">([\s\S]*?)<\/a>/g
  while ((mm = tocRe.exec(header))) {
    toc.push({ href: mm[1], label: stripTags(mm[2]) })
  }

  const body = html.replace(/<header[\s\S]*?<\/header>/i, '')
  const parts = body.split(
    /(?=<div id="[^"]*" class="section1"|<section class="tellsensevid"|<div class="section1")/,
  )

  const sections = []
  for (const part of parts.slice(1)) {
    if (part.startsWith('<div class="lower"') || part.startsWith('<script')) continue
    const endIdx = part.search(/<div class="lower"|<script /)
    const slice = endIdx > 0 ? part.slice(0, endIdx) : part

    const idAttr = (slice.match(/^<(?:div|section)[^>]*\sid="([^"]+)"/) || [])[1] || ''
    const isVideoSection = /tellsensevid/.test(slice.slice(0, 120))
    const layout = /class="horizontal"/.test(slice.slice(0, 800))
      ? 'horizontal'
      : 'vertical'
    const titleEl = (slice.match(/<h1 class="subheader">([\s\S]*?)<\/h1>/) || [])[1]

    const blocks = []
    const seenVid = new Set()
    const chunkRe =
      /<div class="body">([\s\S]*?)<\/div>|<img[^>]+>|<iframe[^>]+>/g
    let c
    while ((c = chunkRe.exec(slice))) {
      const full = c[0]
      if (full.startsWith('<div')) {
        const text = stripTags(c[1])
        if (text) blocks.push({ type: 'text', text })
      } else if (full.startsWith('<img')) {
        const src = (full.match(/\ssrc="([^"]+)"/) || [])[1]
        const alt = decode((full.match(/\salt="([^"]*)"/) || [])[1] || '')
        const p = mediaPath(id, src)
        if (p) blocks.push({ type: 'image', src: p, alt })
      } else if (full.startsWith('<iframe')) {
        const nearby = slice.slice(Math.max(0, c.index - 160), c.index)
        const vid = extractVimeoFromIframe(full, nearby)
        if (vid && !seenVid.has(vid.src)) {
          seenVid.add(vid.src)
          blocks.push(vid)
        }
      }
    }

    if (isVideoSection && !blocks.some((b) => b.type === 'video')) {
      const vids = [...slice.matchAll(/player\.vimeo\.com\/video\/(\d+)(?:\?h=([a-z0-9]+))?/g)]
      for (const v of vids) {
        const src = `https://player.vimeo.com/video/${v[1]}${v[2] ? `?h=${v[2]}` : ''}`
        if (!seenVid.has(src)) {
          seenVid.add(src)
          blocks.push({ type: 'video', src, portrait: false })
        }
      }
      if (!blocks.length) {
        const emb = [...slice.matchAll(/vimeo\.com%2Fvideo%2F(\d+)(?:%3Fh%3D([a-z0-9]+))?/g)]
        for (const v of emb) {
          const src = `https://player.vimeo.com/video/${v[1]}${v[2] ? `?h=${v[2]}` : ''}`
          if (!seenVid.has(src)) {
            seenVid.add(src)
            blocks.push({ type: 'video', src, portrait: false })
          }
        }
      }
    }

    if (titleEl || blocks.length) {
      sections.push({
        id: idAttr || undefined,
        title: titleEl ? stripTags(titleEl) : undefined,
        layout,
        blocks,
      })
    }
  }

  studies[id] = {
    company: company ? stripTags(company) : undefined,
    title: title ? stripTags(title) : id,
    intro: intro ? stripTags(intro) : '',
    meta,
    hero: hero || undefined,
    badge: badge || undefined,
    toc: toc.length ? toc : undefined,
    sections,
  }

  console.log(
    id,
    'meta',
    meta.length,
    'sections',
    sections.length,
    'blocks',
    sections.reduce((a, s) => a + s.blocks.length, 0),
  )
}

fs.mkdirSync('src/data', { recursive: true })
fs.writeFileSync(
  'src/data/caseStudies.generated.json',
  JSON.stringify(studies, null, 2),
)
console.log('wrote src/data/caseStudies.generated.json')
