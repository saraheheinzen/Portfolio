import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react'
import {
  browserPathForLocation,
  browserSectionForProject,
  browserSections,
  encodeBrowserRoute,
  getBrowserSection,
  getProjectsForBrowserSection,
  resolveBrowserRoute,
  type BrowserSection,
  type BrowserSectionId,
} from '../data/browser'
import { getProject } from '../data/content'
import { InclusiveDesignView } from './InclusiveDesignView'
import { KnowledgeListView } from './KnowledgeListView'
import { ProjectView } from './ProjectView'

interface BrowserViewProps {
  /** Section id, project id, or legacy `home`. */
  route?: string
  /** Navigate to a section id or project id. */
  onNavigate: (route: string) => void
  /** Narrator: stack section titles with content under the active one. */
  stacked?: boolean
}

function SectionPage({
  section,
  route,
  onNavigate,
}: {
  section: BrowserSection
  route?: string
  onNavigate: (route: string) => void
}) {
  const location = useMemo(() => resolveBrowserRoute(route), [route])
  const activeProject =
    location.section === section.id && location.projectId
      ? getProject(location.projectId)
      : undefined

  const hubProjects = useMemo(
    () => getProjectsForBrowserSection(section.id),
    [section.id],
  )

  const openProject = (projectId: string) => {
    const project = getProject(projectId)
    if (!project) return
    const sectionId = browserSectionForProject(project, section.id)
    onNavigate(encodeBrowserRoute({ section: sectionId, projectId }))
  }

  if (activeProject) {
    return (
      <div className="browser-project">
        <button
          type="button"
          className="browser-project__back"
          onClick={() => onNavigate(section.id)}
        >
          ← {section.label}
        </button>
        <ProjectView projectId={activeProject.id} />
      </div>
    )
  }

  if (section.kind === 'projects') {
    return (
      <div className="browser-home">
        <header className="browser-home__header">
          <p className="browser-home__eyebrow">sarahheinzen.com</p>
          <h1 className="browser-home__title">{section.label}</h1>
          <p className="browser-home__lede">{section.description}</p>
        </header>
        <ul className="browser-home__pins">
          {hubProjects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                className={`browser-home__pin${project.locked ? ' is-locked' : ''}`}
                onClick={() => openProject(project.id)}
              >
                <span className="browser-home__thumb">
                  <img src={project.cover} alt="" draggable={false} />
                  {project.locked ? (
                    <span className="browser-home__lock" aria-hidden="true">
                      Locked
                    </span>
                  ) : null}
                </span>
                <span className="browser-home__meta">
                  <strong>{project.title}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {hubProjects.length === 0 ? (
          <p className="browser-home__empty">Nothing in this section yet.</p>
        ) : null}
      </div>
    )
  }

  if (section.id === 'inclusive') return <InclusiveDesignView />
  if (section.id === 'speaking') return <KnowledgeListView kind="speaking" />
  if (section.id === 'blog') return <KnowledgeListView kind="blog" />
  return null
}

export function BrowserView({
  route,
  onNavigate,
  stacked = false,
}: BrowserViewProps) {
  const tabsId = useId()
  const tabsRef = useRef<HTMLDivElement>(null)

  const location = useMemo(() => resolveBrowserRoute(route), [route])
  const section = getBrowserSection(location.section)
  const activeProject = location.projectId
    ? getProject(location.projectId)
    : undefined

  useEffect(() => {
    const node = tabsRef.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    )
    node?.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    })
  }, [location.section, location.projectId])

  const url = browserPathForLocation(location)

  const selectSection = (id: BrowserSectionId) => {
    onNavigate(id)
  }

  if (stacked) {
    return (
      <div className="browser-view browser-view--stacked">
        <div className="browser-view__toolbar">
          <div className="browser-view__omnibox" title={url}>
            <svg
              className="browser-view__lock"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <rect
                x="2.5"
                y="5.5"
                width="7"
                height="5"
                rx="1.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M4 5.5V4a2 2 0 0 1 4 0v1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="browser-view__url">{url}</span>
          </div>
        </div>

        <div
          ref={tabsRef}
          className="browser-view__stack"
          role="tablist"
          aria-label="Knowledge base sections"
          aria-orientation="vertical"
          id={tabsId}
        >
          {browserSections.map((tab) => {
            const selected = location.section === tab.id
            const panelId = `${tabsId}-${tab.id}-panel`
            const tabId = `${tabsId}-${tab.id}-tab`
            return (
              <div
                key={tab.id}
                className={`browser-view__stack-item${selected ? ' is-active' : ''}`}
              >
                <button
                  type="button"
                  id={tabId}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={panelId}
                  className={`browser-view__tab${selected ? ' is-active' : ''}`}
                  data-section={tab.id}
                  onClick={() => selectSection(tab.id)}
                >
                  <span className="browser-view__mark" aria-hidden="true">
                    {tab.mark}
                  </span>
                  <span className="browser-view__tab-label">{tab.label}</span>
                </button>
                {selected ? (
                  <div
                    id={panelId}
                    role="tabpanel"
                    aria-labelledby={tabId}
                    className="browser-view__page"
                  >
                    <SectionPage
                      section={tab}
                      route={route}
                      onNavigate={onNavigate}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  let page: ReactNode = null
  if (activeProject) {
    page = (
      <div className="browser-project">
        <button
          type="button"
          className="browser-project__back"
          onClick={() => selectSection(location.section)}
        >
          ← {section.label}
        </button>
        <ProjectView projectId={activeProject.id} />
      </div>
    )
  } else if (section.kind === 'projects') {
    page = (
      <SectionPage
        section={section}
        route={route}
        onNavigate={onNavigate}
      />
    )
  } else if (location.section === 'inclusive') {
    page = <InclusiveDesignView />
  } else if (location.section === 'speaking') {
    page = <KnowledgeListView kind="speaking" />
  } else if (location.section === 'blog') {
    page = <KnowledgeListView kind="blog" />
  }

  return (
    <div className="browser-view">
      <div className="browser-view__chrome">
        <div
          ref={tabsRef}
          className="browser-view__tabs"
          role="tablist"
          aria-label="Knowledge base"
          id={tabsId}
        >
          {browserSections.map((tab) => {
            const selected = location.section === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`browser-view__tab${selected ? ' is-active' : ''}`}
                data-section={tab.id}
                title={tab.label}
                onClick={() => selectSection(tab.id)}
              >
                <span className="browser-view__mark" aria-hidden="true">
                  {tab.mark}
                </span>
                <span className="browser-view__tab-label">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="browser-view__toolbar">
          <div className="browser-view__omnibox" title={url}>
            <svg
              className="browser-view__lock"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <rect
                x="2.5"
                y="5.5"
                width="7"
                height="5"
                rx="1.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M4 5.5V4a2 2 0 0 1 4 0v1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="browser-view__url">{url}</span>
          </div>
          <span className="browser-view__section">{section.label}</span>
        </div>
      </div>

      <div
        className="browser-view__page"
        role="tabpanel"
        aria-label={activeProject ? activeProject.title : section.label}
      >
        {page}
      </div>
    </div>
  )
}
