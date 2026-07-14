import {
  getFeaturedProjects,
  getProject,
  projects,
  type Project,
} from './content'

export type BrowserSectionId =
  | 'featured'
  | 'product'
  | 'games'
  | 'inclusive'
  | 'speaking'
  | 'blog'

export type BrowserSectionKind = 'projects' | 'page'

export interface BrowserSection {
  id: BrowserSectionId
  label: string
  mark: string
  path: string
  description: string
  kind: BrowserSectionKind
}

/** Pinned knowledge-base tabs in the Browser app. */
export const browserSections: BrowserSection[] = [
  {
    id: 'featured',
    label: 'Featured',
    mark: '★',
    path: 'featured',
    description: 'Highlights across games, product, and motion.',
    kind: 'projects',
  },
  {
    id: 'product',
    label: 'Product Design',
    mark: '◇',
    path: 'product',
    description: 'Product, interaction, and systems design across platforms.',
    kind: 'projects',
  },
  {
    id: 'games',
    label: 'Games',
    mark: '▶',
    path: 'games',
    description: 'End-to-end game design and playful systems.',
    kind: 'projects',
  },
  {
    id: 'inclusive',
    label: 'Inclusive Design',
    mark: '◎',
    path: 'inclusive',
    description: 'Microsoft Inclusive Design — methodology, principles, and tools.',
    kind: 'page',
  },
  {
    id: 'speaking',
    label: 'Speaking',
    mark: '◈',
    path: 'speaking',
    description: 'Talks, panels, and workshops on inclusive product and play.',
    kind: 'page',
  },
  {
    id: 'blog',
    label: 'Blog',
    mark: '✎',
    path: 'blog',
    description: 'Notes on craft, access, and building curious things.',
    kind: 'page',
  },
]

export const BROWSER_DEFAULT_SECTION: BrowserSectionId = 'featured'

export function isBrowserSectionId(value: string): value is BrowserSectionId {
  return browserSections.some((s) => s.id === value)
}

export function getBrowserSection(id: BrowserSectionId) {
  return browserSections.find((s) => s.id === id)!
}

export function getProjectsForBrowserSection(section: BrowserSectionId): Project[] {
  switch (section) {
    case 'featured':
      return getFeaturedProjects()
    case 'product':
      return projects.filter(
        (p) => p.category === 'product' || p.category === 'prototyping',
      )
    case 'games':
      return projects.filter((p) => p.category === 'games')
    default:
      return []
  }
}

export function browserSectionForProject(
  project: Project,
  preferred?: BrowserSectionId,
): BrowserSectionId {
  if (preferred === 'featured' && project.featured) return 'featured'
  if (
    preferred === 'product' &&
    (project.category === 'product' || project.category === 'prototyping')
  ) {
    return 'product'
  }
  if (preferred === 'games' && project.category === 'games') return 'games'

  if (project.category === 'games') return 'games'
  if (project.category === 'product' || project.category === 'prototyping') {
    return 'product'
  }
  return 'featured'
}

/** True when a project case study should open inside the Browser. */
export function isBrowserProject(id: string) {
  const project = getProject(id)
  if (!project) return false
  return (
    project.category === 'games' ||
    project.category === 'product' ||
    project.category === 'prototyping' ||
    !!project.featured
  )
}

export interface BrowserLocation {
  section: BrowserSectionId
  projectId?: string
}

export function encodeBrowserRoute(loc: BrowserLocation) {
  if (loc.projectId) return `${loc.section}/${loc.projectId}`
  return loc.section
}

/**
 * Window `projectId` stores a section id, `section/projectId`, a bare project id,
 * or legacy `home`.
 */
export function resolveBrowserRoute(route?: string): BrowserLocation {
  if (!route || route === 'home') {
    return { section: BROWSER_DEFAULT_SECTION }
  }
  if (isBrowserSectionId(route)) {
    return { section: route }
  }

  const slash = route.indexOf('/')
  if (slash > 0) {
    const maybeSection = route.slice(0, slash)
    const maybeProject = route.slice(slash + 1)
    if (isBrowserSectionId(maybeSection) && getProject(maybeProject)) {
      return { section: maybeSection, projectId: maybeProject }
    }
  }

  const project = getProject(route)
  if (project && isBrowserProject(project.id)) {
    return {
      section: browserSectionForProject(project),
      projectId: project.id,
    }
  }
  return { section: BROWSER_DEFAULT_SECTION }
}

export function browserPathForLocation(loc: BrowserLocation) {
  const section = getBrowserSection(loc.section)
  if (loc.section === 'inclusive' && !loc.projectId) {
    return 'inclusive.microsoft.design'
  }
  if (loc.projectId) {
    return `sarahheinzen.com/${section.path}/${loc.projectId}`
  }
  return `sarahheinzen.com/${section.path}`
}

export function browserWindowTitle(route?: string) {
  const loc = resolveBrowserRoute(route)
  if (loc.projectId) {
    const project = getProject(loc.projectId)
    return project ? `Browser — ${project.title}` : 'Browser'
  }
  return `Browser — ${getBrowserSection(loc.section).label}`
}

export const speakingEntries: {
  id: string
  title: string
  event: string
  summary: string
}[] = [
  {
    id: 'm-enabling-summit',
    title: 'Accessibility in VR (Panel)',
    event: 'M-Enabling Summit',
    summary:
      'A discussion on the future of accessible virtual reality, adaptive input, and designing immersive experiences that are usable by people with diverse abilities.',
  },
  {
    id: 'accessu',
    title: 'Inclusive Design in Practice',
    event: 'AccessU',
    summary:
      'Shared practical approaches for embedding accessibility and inclusive design throughout the product development process, from early research to implementation.',
  },
  {
    id: 'seattle-design-festival',
    title: 'Innovating Human Inclusivity',
    event: 'Seattle Design Festival',
    summary:
      'Explored how Human Factors and Inclusive Design work together to create technology that reflects the diversity of human experiences and leads to better products for everyone.',
  },
]

export const speakingBeyondStage = {
  title: 'Beyond the Stage',
  summary:
    "In addition to public speaking, I've led dozens of workshops, guest lectures, and accessibility training sessions across Microsoft and the University of Washington, helping teams apply inclusive design through hands-on collaboration, research, and prototyping.",
}

export const blogEntries: {
  id: string
  title: string
  date: string
  summary: string
  url?: string
  body?: string[]
}[] = [
  {
    id: 'os-knows-best',
    title: 'The OS Knows Best? Designing for Choice in an AI World',
    date: 'Nov 6, 2025',
    summary:
      'When AI personalizes our digital spaces, who decides what “fits” — and how do we keep sensory preference, identity, and choice in the driver’s seat?',
    url: 'https://www.linkedin.com/pulse/os-knows-best-designing-choice-ai-world-sarah-heinzen-dfhcc',
    body: [
      'In times of economic uncertainty, history shows us that people often turn to brighter colors and bolder design trends, an accessible way to invite joy into difficult times. And we’ve seen this resurgence of vibrancy not just in fashion and interior design, but also in digital spaces. Google’s Material 3 (M3) Expressive and Apple’s liquid glass textures are clear examples of tech platforms leaning into personality and playfulness.',
      'I first noticed the shift with M3. Like many designers, I initially rioted. I wanted corners that matched. I wanted simplicity, consistency, and clean geometry. Something calm enough to use in ADHD peace. But over time, thanks to Android’s customization flexibility, I started to fall in love with how fun and expressive M3 could be. That shift sparked a cascade of choices: more colorful phone cases, keyboards, widgets. Slowly, my desk became more vibrant and playful. Meanwhile, the rest of my house remained stuck in a familiar rut of sage green (IYKYK).',
      'There’s a common assumption that neurodivergent individuals thrive only in muted, low-stimulation environments. And for some, that’s absolutely true. But it’s not a one-size-fits-all. Many people with ADHD, or just varying sensory preferences, find that a certain level of intentional stimulation helps them focus. A splash of color, a satisfying texture, even ambient motion or sound — these can serve as anchors, not distractions.',
      'The key is control. My desk is an example of a controlled sensory environment.',
      'This is where AI gets tricky. In theory, AI can personalize experiences in real time based on behavioral patterns. But if it’s constantly nudging users toward what it thinks they want, it risks eroding the very sense of ownership that makes personalization effective. Not only that, this can further exclude by removing guardrails like ARIA and consistency in UX patterns. Sometimes, novelty and identity matter more than efficiency. Sometimes, consistency is the most inclusive choice of all.',
      'It’s important that we find a balance between giving users the ability to make those choices, especially around color, multimodal input, and sensory elements, and not overwhelming them with too many options that create cognitive overload. And we also have to remember that people’s needs can change over time. What feels right today might not be what they need tomorrow. If AI is constantly pushing changes to keep up, it can become more of a hindrance than a help.',
      'In the end, the goal is to create digital spaces that feel safe. By balancing user choice with thoughtful design and responsible AI, we can help everyone find that sweet spot where they feel at home in their own digital world.',
      'So all that to say, I’m curious: How has the customizability of your OS encouraged, or hindered, your productivity? Reach out, I’d love to continue the discussion.',
    ],
  },
]
