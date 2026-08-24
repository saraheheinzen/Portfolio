import {
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  caseStudies,
  getProject,
  splitProjectTags,
  type CaseStudy,
  type CaseStudyBlock,
  type Project,
} from '../data/content'
import {
  getCaseStudyPassword,
  isCaseStudiesUnlocked,
  tryUnlockCaseStudies,
} from '../lib/caseStudyUnlock'
import { VimeoPlayer } from './VimeoPlayer'

interface ProjectViewProps {
  projectId: string
}

type BlockGroup =
  | { kind: 'text'; text: string; fullWidth?: boolean }
  | { kind: 'media'; items: CaseStudyBlock[]; columns: number }

function groupBlocks(
  blocks: CaseStudyBlock[],
  layout: string,
): BlockGroup[] {
  const groups: BlockGroup[] = []
  let mediaBuf: CaseStudyBlock[] = []
  const isGallery = layout === 'gallery'

  const flushMedia = () => {
    if (!mediaBuf.length) return

    if (isGallery) {
      for (let i = 0; i < mediaBuf.length; i += 4) {
        const chunk = mediaBuf.slice(i, i + 4)
        groups.push({
          kind: 'media',
          items: chunk,
          columns: chunk.length,
        })
      }
      mediaBuf = []
      return
    }

    if (layout === 'carousel') {
      groups.push({
        kind: 'media',
        items: mediaBuf,
        columns: mediaBuf.length,
      })
      mediaBuf = []
      return
    }

    if (layout === 'stack-row') {
      // All consecutive media after text become one flexible row
      groups.push({
        kind: 'media',
        items: mediaBuf,
        columns: mediaBuf.length,
      })
      mediaBuf = []
      return
    }

    let i = 0
    while (i < mediaBuf.length) {
      const cur = mediaBuf[i]
      const rowId = cur.row
      if (rowId == null) {
        groups.push({ kind: 'media', items: [cur], columns: 1 })
        i += 1
        continue
      }
      const pack: CaseStudyBlock[] = [cur]
      let j = i + 1
      while (j < mediaBuf.length && mediaBuf[j].row === rowId) {
        pack.push(mediaBuf[j])
        j += 1
      }
      groups.push({
        kind: 'media',
        items: pack,
        columns: Math.min(4, pack.length),
      })
      i = j
    }
    mediaBuf = []
  }

  for (const block of blocks) {
    if (block.type === 'text' && block.text) {
      flushMedia()
      groups.push({
        kind: 'text',
        text: block.text,
        fullWidth: block.fullWidth,
      })
      continue
    }
    if (
      (block.type === 'image' && block.src) ||
      (block.type === 'video' && block.src)
    ) {
      mediaBuf.push(block)
    }
  }
  flushMedia()
  return groups
}

function toRows(
  groups: BlockGroup[],
  layout: string,
): Array<{ mode: 'stack' | 'split' | 'split-media-first'; items: BlockGroup[] }> {
  if (layout === 'horizontal-media-first') {
    const rows: Array<{
      mode: 'stack' | 'split' | 'split-media-first'
      items: BlockGroup[]
    }> = []
    let i = 0
    while (i < groups.length) {
      const cur = groups[i]
      const next = groups[i + 1]
      if (
        cur?.kind === 'media' &&
        cur.columns === 1 &&
        next?.kind === 'text'
      ) {
        rows.push({ mode: 'split-media-first', items: [cur, next] })
        i += 2
        continue
      }
      rows.push({ mode: 'stack', items: [cur] })
      i += 1
    }
    return rows
  }

  if (layout === 'horizontal') {
    const rows: Array<{
      mode: 'stack' | 'split' | 'split-media-first'
      items: BlockGroup[]
    }> = []
    let i = 0
    while (i < groups.length) {
      const cur = groups[i]
      const next = groups[i + 1]
      if (
        cur?.kind === 'text' &&
        !cur.fullWidth &&
        next?.kind === 'media' &&
        next.columns === 1
      ) {
        rows.push({ mode: 'split', items: [cur, next] })
        i += 2
        continue
      }
      rows.push({ mode: 'stack', items: [cur] })
      i += 1
    }
    return rows
  }

  return groups.map((g) => ({ mode: 'stack' as const, items: [g] }))
}

function formatBodyText(text: string): ReactNode {
  const lines = text.split('\n')
  const first = lines[0]?.trim() ?? ''
  if (/^(20\d{2})$/i.test(first)) {
    if (lines.length === 1) {
      return <strong className="project-view__year">{first}</strong>
    }
    return (
      <>
        <strong className="project-view__year">{first}</strong>
        {lines.slice(1).join('\n').replace(/^\n/, '')}
      </>
    )
  }
  return text
}

/** Normalize • bullets so Challenges / meta read with proper spacing. */
function formatMetaValue(value: string): ReactNode {
  const lines = value
    .split(/\n|(?=•)/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length > 1 && lines.every((l) => l.startsWith('•'))) {
    return (
      <ul className="case-hero__bullets">
        {lines.map((line) => (
          <li key={line}>{line.replace(/^•\s*/, '')}</li>
        ))}
      </ul>
    )
  }
  return value.replace(/•(?=\S)/g, '• ')
}

function MediaItem({
  block,
  title,
}: {
  block: CaseStudyBlock
  title: string
}) {
  const phone = Boolean(block.phone || block.portrait)

  if (block.type === 'image' && block.src) {
    return (
      <figure
        className={`project-view__figure${phone ? ' is-phone' : ''}`}
      >
        <img src={block.src} alt={block.alt ?? ''} loading="lazy" />
      </figure>
    )
  }
  if (block.type === 'video' && block.src) {
    if (phone) {
      return (
        <VimeoPlayer
          className={`is-phone${block.portrait ? ' is-portrait' : ''}`}
          compact
          src={block.src}
          title={`${title} video`}
        />
      )
    }

    return (
      <VimeoPlayer src={block.src} title={`${title} video`} />
    )
  }
  return null
}

function renderMediaGroup(
  group: Extract<BlockGroup, { kind: 'media' }>,
  title: string,
  variant: 'grid' | 'flex' = 'grid',
) {
  const phoneRow = group.columns >= 3 && variant === 'grid'
  const hasPhone = group.items.some((b) => b.phone || b.portrait)

  if (variant === 'flex') {
    return (
      <div
        className={`project-view__flex-row${hasPhone ? ' has-phone' : ''}`}
      >
        {group.items.map((block, bi) => (
          <MediaItem key={bi} block={block} title={title} />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`project-view__media-row${group.columns > 1 ? ' is-multi' : ' is-full'}${phoneRow ? ' is-phones' : ''}${hasPhone && group.columns === 1 ? ' has-phone' : ''}`}
      data-cols={group.columns}
      style={{ '--cols': group.columns } as CSSProperties}
    >
      {group.items.map((block, bi) => (
        <MediaItem key={bi} block={block} title={title} />
      ))}
    </div>
  )
}

function AsideSection({
  title,
  blocks,
  projectTitle,
}: {
  title?: string
  blocks: CaseStudyBlock[]
  projectTitle: string
}) {
  const left: CaseStudyBlock[] = []
  const right: CaseStudyBlock[] = []
  for (const b of blocks) {
    if (b.aside) right.push(b)
    else left.push(b)
  }

  return (
    <div className="project-view__aside">
      <div className="project-view__aside-main">
        {title ? <h2>{title}</h2> : null}
        {left.map((block, i) => {
          if (block.type === 'text' && block.text) {
            return (
              <p key={i} className="project-view__text">
                {formatBodyText(block.text)}
              </p>
            )
          }
          return <MediaItem key={i} block={block} title={projectTitle} />
        })}
      </div>
      <div className="project-view__aside-media">
        {right.map((block, i) => (
          <MediaItem key={i} block={block} title={projectTitle} />
        ))}
      </div>
    </div>
  )
}

function MediaCarousel({
  items,
  title,
}: {
  items: CaseStudyBlock[]
  title: string
}) {
  const [index, setIndex] = useState(0)
  const count = items.length
  if (!count) return null

  const current = items[Math.min(index, count - 1)]
  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + count) % count)
  }

  return (
    <div className="media-carousel" aria-roledescription="carousel">
      <div className="media-carousel__stage">
        {current?.src ? (
          <img
            key={current.src}
            src={current.src}
            alt={current.alt ?? `${title} animation ${index + 1}`}
            className="media-carousel__frame"
          />
        ) : null}
      </div>
      {count > 1 ? (
        <>
          <button
            type="button"
            className="media-carousel__nav is-prev"
            aria-label="Previous animation"
            onClick={() => go(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="media-carousel__nav is-next"
            aria-label="Next animation"
            onClick={() => go(1)}
          >
            ›
          </button>
          <div className="media-carousel__dots" role="tablist" aria-label="Slides">
            {items.map((item, i) => (
              <button
                key={item.src ?? i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show animation ${i + 1}`}
                className={`media-carousel__dot${i === index ? ' is-active' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function CaseHero({
  study,
  tags,
  projectId,
}: {
  study: CaseStudy
  tags: string
  projectId: string
}) {
  const largeVisual = projectId === 'spatial-spaces-picker'
  const hero = study.hero
  const peachVisual = hero?.accent === 'peach' || projectId === 'skiddy-kitty'
  const heroClass = [
    'case-hero',
    largeVisual ? 'case-hero--large-visual' : '',
    peachVisual ? 'case-hero--peach' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={heroClass}>
      <div className="case-hero__copy">
        {study.company ? (
          <p className="case-hero__company">{study.company}</p>
        ) : null}
        <h1>{study.title}</h1>
        {study.intro ? <p className="case-hero__intro">{study.intro}</p> : null}

        {study.meta?.map((m) => (
          <div key={m.label} className="case-hero__meta">
            <h3>{m.label}</h3>
            <div className="case-hero__meta-value">{formatMetaValue(m.value)}</div>
          </div>
        ))}

        {study.toc?.length ? (
          <div className="case-hero__meta">
            <h3>Index</h3>
            <ol className="case-hero__toc">
              {study.toc.map((item) => (
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <p className="case-hero__tags">
          {splitProjectTags(tags).map((chip) => (
            <span key={chip} className="project-chip">
              {chip}
            </span>
          ))}
        </p>
      </div>
      {hero ? (
        <div
          className={`case-hero__visual${hero.video || hero.phone ? ' is-phone' : ''}`}
        >
          {hero.video ? (
            <VimeoPlayer
              className="is-phone is-portrait"
              compact
              src={hero.src}
              title={`${study.title ?? 'Project'} gameplay`}
            />
          ) : (
            <img src={hero.src} alt={hero.alt ?? ''} />
          )}
        </div>
      ) : null}
    </header>
  )
}

function LockedProjectPanel({
  project,
  onUnlocked,
}: {
  project: Project
  onUnlocked: () => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const passwordConfigured = Boolean(getCaseStudyPassword())

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (tryUnlockCaseStudies(password)) {
      setError(false)
      onUnlocked()
      return
    }
    setError(true)
  }

  return (
    <article className="project-view project-view--locked">
      <div className="project-locked">
        <div className="project-locked__backdrop" aria-hidden="true">
          <img src={project.cover} alt="" />
        </div>
        <div className="project-locked__panel">
          <div className="project-locked__title-row">
            <h1>{project.title}</h1>
            <span className="project-locked__lock">Locked</span>
          </div>
          <p className="project-locked__tags">
            {splitProjectTags(project.tags).map((chip) => (
              <span key={chip} className="project-chip">
                {chip}
              </span>
            ))}
          </p>
          <p className="project-locked__summary">{project.summary}</p>
          <p className="project-locked__note">
            This case study is locked. Enter the password to view the full
            write-up and media.
          </p>
          <form className="project-locked__form" onSubmit={onSubmit}>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(false)
                }}
                aria-invalid={error}
                aria-describedby={
                  error ? 'project-locked-error' : undefined
                }
              />
            </label>
            <button type="submit" disabled={!passwordConfigured}>
              Unlock
            </button>
            {error ? (
              <p
                id="project-locked-error"
                className="project-locked__error"
                role="alert"
              >
                Incorrect password. Try again.
              </p>
            ) : null}
            {!passwordConfigured ? (
              <p className="project-locked__hint" role="status">
                Set <code>VITE_CASE_STUDY_PASSWORD</code> in your{' '}
                <code>.env</code> to enable unlock.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </article>
  )
}

export function ProjectView({ projectId }: ProjectViewProps) {
  const project = getProject(projectId)
  const [unlocked, setUnlocked] = useState(isCaseStudiesUnlocked)

  if (!project) return <p className="project-view__empty">Project not found.</p>

  if (project.locked && !unlocked) {
    return (
      <LockedProjectPanel
        project={project}
        onUnlocked={() => setUnlocked(true)}
      />
    )
  }

  const study = caseStudies[projectId]
  const useCaseHero = Boolean(study?.hero && study.title)

  return (
    <article className="project-view">
      {useCaseHero && study ? (
        <CaseHero study={study} tags={project.tags} projectId={projectId} />
      ) : (
        <>
          <header className="project-view__hero">
            {project.video ? (
              <VimeoPlayer src={project.video} title={project.title} />
            ) : (
              <img src={project.cover} alt="" className="project-view__cover" />
            )}
            <div className="project-view__hero-text">
              <p className="project-view__tags">
                {splitProjectTags(project.tags).map((chip) => (
                  <span key={chip} className="project-chip">
                    {chip}
                  </span>
                ))}
              </p>
              <h1>{project.title}</h1>
              <p>{project.summary}</p>
              {project.externalUrl ? (
                <a
                  className="project-view__cta"
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.externalLabel ?? 'Open external link'}
                </a>
              ) : null}
            </div>
          </header>
          <p className="project-view__desc">{project.description}</p>
        </>
      )}

      {project.externalUrl && useCaseHero ? (
        <p className="project-view__external">
          <a
            className="project-view__cta"
            href={project.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {project.externalLabel ?? 'Open external link'}
          </a>
        </p>
      ) : null}

      {study ? (
        <div className="project-view__case">
          {!useCaseHero ? (
            <>
              {study.company ? (
                <p className="project-view__company">{study.company}</p>
              ) : null}
              {study.intro ? (
                <p className="project-view__intro">{study.intro}</p>
              ) : null}
              {study.meta?.length ? (
                <dl className="project-view__meta">
                  {study.meta.map((m) => (
                    <div key={m.label}>
                      <dt>{m.label}</dt>
                      <dd>{formatMetaValue(m.value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          ) : null}

          {study.sections?.map((section, i) => {
            const layout = section.layout ?? 'vertical'

            if (layout === 'aside') {
              return (
                <section
                  key={`${section.title ?? 'section'}-${i}`}
                  id={section.id}
                  className="project-view__section"
                >
                  <AsideSection
                    title={section.title}
                    blocks={section.blocks}
                    projectTitle={project.title}
                  />
                </section>
              )
            }

            if (layout === 'carousel') {
              const media = section.blocks.filter(
                (b) => b.type === 'image' && b.src,
              )
              const textBlocks = section.blocks.filter(
                (b) => b.type === 'text' && b.text,
              )
              return (
                <section
                  key={`${section.title ?? 'section'}-${i}`}
                  id={section.id}
                  className="project-view__section project-view__section--carousel"
                >
                  {section.title ? <h2>{section.title}</h2> : null}
                  {textBlocks.map((block, ti) => (
                    <p key={ti} className="project-view__text">
                      {formatBodyText(block.text!)}
                    </p>
                  ))}
                  <MediaCarousel items={media} title={project.title} />
                </section>
              )
            }

            const groups = groupBlocks(section.blocks, layout)
            const rows = toRows(groups, layout)

            return (
              <section
                key={`${section.title ?? 'section'}-${i}`}
                id={section.id}
                className="project-view__section"
              >
                {section.title ? <h2>{section.title}</h2> : null}
                <div
                  className={`project-view__blocks project-view__blocks--${layout}`}
                >
                  {rows.map((row, ri) => {
                    if (
                      row.mode === 'split' ||
                      row.mode === 'split-media-first'
                    ) {
                      const text = row.items.find((g) => g.kind === 'text') as
                        | Extract<BlockGroup, { kind: 'text' }>
                        | undefined
                      const media = row.items.find(
                        (g) => g.kind === 'media',
                      ) as Extract<BlockGroup, { kind: 'media' }> | undefined
                      if (!text || !media) return null
                      const phoneSplit = media.items.some(
                        (b) => b.phone || b.portrait,
                      )
                      return (
                        <div
                          key={ri}
                          className={`project-view__split${row.mode === 'split-media-first' ? ' is-media-first' : ''}${phoneSplit ? ' has-phone' : ''}`}
                        >
                          {row.mode === 'split-media-first' ? (
                            <>
                              {renderMediaGroup(media, project.title)}
                              <p className="project-view__text">
                                {formatBodyText(text.text)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="project-view__text">
                                {formatBodyText(text.text)}
                              </p>
                              {renderMediaGroup(media, project.title)}
                            </>
                          )}
                        </div>
                      )
                    }

                    const group = row.items[0]
                    if (group.kind === 'text') {
                      return (
                        <p key={ri} className="project-view__text">
                          {formatBodyText(group.text)}
                        </p>
                      )
                    }
                    return (
                      <div key={ri}>
                        {renderMediaGroup(
                          group,
                          project.title,
                          layout === 'stack-row' ? 'flex' : 'grid',
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        project.highlights?.length ? (
          <ul className="project-view__highlights">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null
      )}
    </article>
  )
}
