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
    description:
      'Great experiences are built across disciplines.\n\nFrom Windows and gaming to robotics and spatial computing, these projects span nearly a decade of design. While many of my recent projects remain confidential, this collection highlights the work that shaped how I design today.',
    kind: 'projects',
  },
  {
    id: 'product',
    label: 'Product Design',
    mark: '◇',
    path: 'product',
    description:
      'Products designed for everyday people.\n\nA collection of work across consumer hardware, AI, spatial computing, and digital experiences.',
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
    description: 'Microsoft Inclusive Design: methodology, principles, and tools.',
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
    return project ? `Browser - ${project.title}` : 'Browser'
  }
  return `Browser - ${getBrowserSection(loc.section).label}`
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
    id: 'inclusive-design-not-one-more-thing',
    title: 'Inclusive Design Isn’t "One More Thing"',
    date: 'Jul 21, 2026',
    summary:
      'Accessibility often gets treated as extra work bolted onto an already packed timeline, but the most durable version of it is just what good design looks like when it accounts for more than one kind of user.',
    url: 'https://www.linkedin.com/pulse/inclusive-design-isnt-one-more-thing-sarah-heinzen-tx0vc/',
    body: [
      'I meet a lot of people these days, and one of the questions I get asked the most is, "How do I get people to care about accessibility and inclusive design?" Usually it comes with some version of, "I care about accessibility, I just don\'t want to do it full time."',
      'My favorite was someone who looked me dead in the eye and asked, "Are corporations just evil?"',
      'I laughed and told them my favorite time of year is September, when we get a full week during Hackathon to build whatever we want. You\'d be surprised how many Microsoftees spend that week building something for disability. That doesn\'t sound like a company full of people who don\'t care.',
      'The other 51 weeks of the year, though, accessibility can feel overwhelming for designers who haven\'t made it their full-time focus. There are decades of problems to solve, standards to learn, communities to listen to, and every year there\'s another new technology we\'re expected to master. Even outside inclusive design, designers are being asked to ship faster, iterate faster, and somehow do more with less. Burnout is real. I don\'t blame anyone for looking at accessibility and thinking, "I can\'t take on one more thing."',
      'That\'s also why I don\'t think accessibility should be treated as "one more thing". Inclusive design is just good design. It\'s what usability looks like when you stop assuming everyone experiences the world the way you do.',
      'Most of us design from our own experiences. That\'s normal. If you work in tech, your day is probably filled with AI tools, high-end hardware, reliable internet, and coworkers who pick up new technology almost instantly. Spend enough time in that environment and it starts to feel ordinary. It isn\'t.',
      'We build products for people who have the newest devices, enough technical confidence to figure things out, and lives that look a lot like ours. Then we\'re surprised when no one wants to buy it.',
      'Accessibility is one place where this shows up, but it isn\'t the only one. If your product doesn\'t work for someone with limited mobility, there\'s a good chance you\'ve also made it harder for a lot of the population over 60. If your latest AI workflow only makes sense to people who spend all day vibe coding, you\'ve probably lost everyone else before they even get started.',
      'I\'ll be the first to say I\'ve done this too. There was a short period where I was going through a rough patch personally and leaned on AI much more than I usually do. It generated layouts, code, and interactions that looked perfectly reasonable, so I stopped questioning them.',
      'Then we put the prototype in front of users. By this point in the article, you shouldn\'t be surprised: They had no idea what to do.',
      'AI wasn\'t trying to make a bad experience. It generated what it had learned from millions of examples online. I was the one who forgot that "common" and "good" aren\'t always the same thing.',
      'I\'ve also made the opposite mistake. I\'ve designed things that were so tailored to one person\'s needs that even they couldn\'t figure them out. That\'s the other side of the coin. Good design is NOT about optimizing for one person. Good design understands enough different people that your own assumptions stop making all the decisions and adjusts for personalizable experience around human variety.',
      'So if accessibility feels overwhelming, instead of whipping out your WCAG guidelines, start by being curious. Talk to people outside your circle. Watch someone use your product who isn\'t like you. Ask yourself who isn\'t represented in the room before you decide who your "average user" is.',
      'Listen, we\'re all stressed. We\'re all short on time. We\'re designing in a world that\'s changing faster than any of us can keep up with, but the fundamentals of design haven\'t changed. Part of our job is understanding who we\'re designing for, so don\'t stop at your expected personas. Take a moment to think about the people outside of them, too. Your future self (and probably a much older version of you) might just thank you for it.',
    ],
  },
  {
    id: 'backrooms-lab-visit',
    title: 'What a Reddit Post About The Backrooms Taught Me About Community',
    date: 'Jun 2026',
    summary:
      'A Seattle mom’s search for liminal spaces led to an unforgettable Inclusive Tech Lab visit, and a reminder that human connection matters as much as formal research.',
    url: 'https://www.linkedin.com/posts/sarah-heinzen-742911155_we-have-a-lot-of-people-come-through-the-activity-7469070201804771328-Zdmf',
    body: [
      'We have a lot of people come through the Inclusive Tech Lab, like, more than 25,000 over the years. Every visitor is unique and brings their own connection to disability, whether through personal experience, a family member, a friend, or simply a desire to learn more about inclusion. We make it a point to capture something we learn from every visit.',
      'This week, I found myself thinking about one visit that turned out to be far more meaningful than I expected. A couple of months ago, I came across a post on the Seattle subreddit from a mom looking for buildings that resembled "The Backrooms," her autistic 8-year-old son\'s current special interest. If you\'ve never been inside Microsoft Building 86, it\'s incredibly liminal. Long hallways, white walls, and twists and turns that feel straight out of Severance or The Backrooms.',
      'In a moment of ADHD-fueled excitement, I reached out and asked if the family would be interested in visiting the lab. By coincidence, we were also hosting a neurodiversity sprint that day. When they arrived, the whole family was wonderful, and their son absolutely lit up. He spent the visit exploring the building and pretending he was in the real Backrooms.',
      'At one point, Delaney Locher noticed he was wearing a 3D printing shirt and quickly arranged an impromptu tour of our Advanced Prototyping Center. The kid was incredibly curious and full of questions.',
      'Moments like these are why community engagement matters. We didn\'t conduct interviews, validate concepts, or run research activities. We just hung out. Building genuine, one-on-one connections with people in their everyday interests gives us perspective that no formal process can fully replicate.',
      'I won\'t share names for privacy, but thank you to this family for spending part of your day with us. What started as a Reddit post about The Backrooms turned into one of my favorite visits to the lab, and a reminder that it is just as much about human connection as it is about technology.',
    ],
  },
  {
    id: 'os-knows-best',
    title: 'The OS Knows Best? Designing for Choice in an AI World',
    date: 'Nov 6, 2025',
    summary:
      'When AI personalizes our digital spaces, who decides what “fits,” and how do we keep sensory preference, identity, and choice in the driver’s seat?',
    url: 'https://www.linkedin.com/pulse/os-knows-best-designing-choice-ai-world-sarah-heinzen-dfhcc',
    body: [
      'In times of economic uncertainty, history shows us that people often turn to brighter colors and bolder design trends, an accessible way to invite joy into difficult times. And we’ve seen this resurgence of vibrancy not just in fashion and interior design, but also in digital spaces. Google’s Material 3 (M3) Expressive and Apple’s liquid glass textures are clear examples of tech platforms leaning into personality and playfulness.',
      'I first noticed the shift with M3. Like many designers, I initially rioted. I wanted corners that matched. I wanted simplicity, consistency, and clean geometry. Something calm enough to use in ADHD peace. But over time, thanks to Android’s customization flexibility, I started to fall in love with how fun and expressive M3 could be. That shift sparked a cascade of choices: more colorful phone cases, keyboards, widgets. Slowly, my desk became more vibrant and playful. Meanwhile, the rest of my house remained stuck in a familiar rut of sage green (IYKYK).',
      'There’s a common assumption that neurodivergent individuals thrive only in muted, low-stimulation environments. And for some, that’s absolutely true. But it’s not a one-size-fits-all. Many people with ADHD, or just varying sensory preferences, find that a certain level of intentional stimulation helps them focus. A splash of color, a satisfying texture, even ambient motion or sound: these can serve as anchors, not distractions.',
      'The key is control. My desk is an example of a controlled sensory environment.',
      'This is where AI gets tricky. In theory, AI can personalize experiences in real time based on behavioral patterns. But if it’s constantly nudging users toward what it thinks they want, it risks eroding the very sense of ownership that makes personalization effective. Not only that, this can further exclude by removing guardrails like ARIA and consistency in UX patterns. Sometimes, novelty and identity matter more than efficiency. Sometimes, consistency is the most inclusive choice of all.',
      'It’s important that we find a balance between giving users the ability to make those choices, especially around color, multimodal input, and sensory elements, and not overwhelming them with too many options that create cognitive overload. And we also have to remember that people’s needs can change over time. What feels right today might not be what they need tomorrow. If AI is constantly pushing changes to keep up, it can become more of a hindrance than a help.',
      'In the end, the goal is to create digital spaces that feel safe. By balancing user choice with thoughtful design and responsible AI, we can help everyone find that sweet spot where they feel at home in their own digital world.',
      'So all that to say, I’m curious: How has the customizability of your OS encouraged, or hindered, your productivity? Reach out, I’d love to continue the discussion.',
    ],
  },
]
