import caseStudiesJson from './caseStudies.generated.json' with { type: 'json' }

export type ProjectCategory =
  | 'games'
  | 'product'
  | 'prototyping'
  | 'youtube'

export interface CaseStudyMeta {
  label: string
  value: string
}

export type CaseStudyBlock = {
  type: string
  text?: string
  src?: string
  alt?: string
  portrait?: boolean
  phone?: boolean
  /** Sits in the right column of an `aside` layout */
  aside?: boolean
  /** Same row id = side-by-side media columns */
  row?: number
  /** Text that should not sit beside following media */
  fullWidth?: boolean
}

export interface CaseStudySection {
  id?: string
  title?: string
  layout?: string
  blocks: CaseStudyBlock[]
}

export interface CaseStudy {
  company?: string
  title?: string
  intro?: string
  meta?: CaseStudyMeta[]
  hero?: { src: string; alt?: string }
  toc?: { href: string; label: string }[]
  sections?: CaseStudySection[]
}

export interface Project {
  id: string
  title: string
  category: ProjectCategory
  tags: string
  summary: string
  description: string
  cover: string
  /** Vertical Steam library capsule; falls back to `cover` when unset. */
  libraryCover?: string
  locked?: boolean
  externalUrl?: string
  highlights?: string[]
  featured?: boolean
}

export const caseStudies = caseStudiesJson as unknown as Record<string, CaseStudy>

export const categories: Record<
  ProjectCategory,
  {
    label: string
    description: string
    icon: 'folder' | 'documents' | 'player' | 'vscode' | 'figma' | 'steam' | 'youtube' | 'browser'
  }
> = {
  games: {
    label: 'Games',
    description: 'End-to-end game design and development.',
    icon: 'steam',
  },
  product: {
    label: 'Product Design',
    description: 'Product, interaction, and systems design across platforms.',
    icon: 'figma',
  },
  prototyping: {
    label: 'Prototyping',
    description: 'Proof-of-concepts in XR, hardware, and emerging tech.',
    icon: 'vscode',
  },
  youtube: {
    label: 'YouTube',
    description: 'A video library of motion, rendering, and in-app clips.',
    icon: 'youtube',
  },
}

export const projects: Project[] = [
  {
    id: 'xbox-game-your-way',
    title: 'XBOX Game Your Way',
    category: 'youtube',
    tags: 'Animation',
    summary: 'Animation & rendering with Gaming for Everyone @ Xbox',
    description:
      'Animation and rendering collaboration with the Gaming for Everyone team at Xbox — visual storytelling in support of more adaptable play.',
    cover: '/media/covers/Xbox-Controllers.png',
    highlights: [
      'Partnered with Xbox Gaming for Everyone',
      'Animation and rendering for inclusive gaming storytelling',
      'Connected motion craft with accessibility messaging',
    ],
    externalUrl:
      'https://www.xbox.com/en-US/community/for-everyone/accessibility?xr=shellnav',
    featured: true,
  },
  {
    id: 'get-goating',
    title: 'Get Goating',
    category: 'games',
    tags: 'Game Design • Development',
    summary: 'End-to-end game development',
    description:
      'A complete game built from concept through playable release — systems design, interaction, art direction, and development stitched into one playable experience.',
    cover: '/media/covers/Main-Capsule.png',
    libraryCover: '/media/covers/Library-Capsule.png',
    highlights: [
      'Owned design and development end-to-end',
      'Focused on playful feel, readable interactions, and finish',
      'Explored how accessibility can show up even in indie game design',
    ],
    externalUrl: 'https://store.steampowered.com/app/4303820/Get_Goating/',
    featured: true,
  },
  {
    id: 'skiddy-kitty',
    title: 'Skiddy Kitty',
    category: 'games',
    tags: 'Game Design',
    summary: 'UX, design, and animation for the mobile game Skiddy Kitty',
    description:
      'UX, design, and animation for Skiddy Kitty — a mobile game full of character, motion, and playful UI.',
    cover: '/media/covers/Screen-Shot-2021-03-08-at-6.09.09-PM.png',
  },
  {
    id: 'spatial-spaces-picker',
    title: 'Spatial Spaces Picker',
    category: 'product',
    tags: 'Product Design',
    summary: 'Landing page for mobile, web, and XR',
    description:
      'Designed the Spaces Picker experience for Spatial across mobile, web, and XR — helping creators land in the right space with clarity and delight.',
    cover: '/media/covers/Screen-Shot-2022-02-22-at-7.51.47-PM.png',
    highlights: [
      'Cross-platform product thinking for web, mobile, and headset',
      'Clear entry-point UX for immersive collaboration spaces',
      'Collaborated across product, engineering, and marketing',
    ],
    featured: true,
  },
  {
    id: 'tellsense',
    title: 'TellSense',
    category: 'product',
    tags: 'Product Design • Prototyping',
    summary: 'Hacking neuropathology through mixed reality',
    description:
      'An MR prototype exploring how mixed reality can support neuropathology workflows — pairing clinical needs with spatial interaction ideas.',
    cover: '/media/covers/Screenshot-2023-08-05-at-8.53.19-PM.png',
    locked: true,
    highlights: [
      'Mixed reality prototyping for specialized clinical contexts',
      'Human factors thinking applied to spatial interfaces',
      'Rapid concept validation with domain constraints',
    ],
    featured: true,
  },
  {
    id: 'neato-hardware',
    title: 'Neato Hardware',
    category: 'product',
    tags: 'Product Design',
    summary: 'Hardware UX and mobile app integration',
    description:
      'User experience and design for new Neato hardware and its mobile app integration — bridging physical product, software, and everyday home use.',
    cover: '/media/covers/Comp-9-1.png',
    locked: true,
    highlights: [
      'Hardware + software experience design',
      'Mobile app flows for setup and day-to-day control',
      'Cross-team collaboration from concept through delivery',
    ],
    featured: true,
  },
  {
    id: 'neato-default-screen',
    title: 'Neato Default Screen',
    category: 'product',
    tags: 'Motion Graphics • Product Design',
    summary: 'Motion & product design for the MyNeato app default screen',
    description:
      "Motion and product design for the MyNeato app's default screen — making status, personality, and brand feel alive in a quiet everyday view.",
    cover: '/media/covers/Screen-Shot-2021-03-08-at-6.38.13-PM.png',
    highlights: [
      'Motion systems that communicate status at a glance',
      'Product storytelling inside a utility surface',
      'Tight collaboration with marketing and engineering',
    ],
    featured: true,
  },
  {
    id: 'xr-prototyping',
    title: 'XR Prototyping',
    category: 'prototyping',
    tags: 'Prototyping',
    summary: 'Proof of concepts for various AR & VR projects',
    description:
      "A collection of AR and VR proof-of-concepts — rapid spatial sketches used to test interaction ideas, clarity, and what's actually comfortable in headset.",
    cover: '/media/covers/Screenshot-2023-08-05-at-1.56.49-PM.png',
    locked: true,
    highlights: [
      'Fast XR interaction prototypes',
      'Validation of comfort, readability, and input',
      'Exploration across AR and VR form factors',
    ],
    featured: true,
  },
  {
    id: 'spatial-auto-gallery',
    title: 'Spatial Auto-gallery',
    category: 'product',
    tags: 'Product Design',
    summary: '50-second Spatial auto gallery feature for web',
    description:
      'Designed an auto-gallery feature that helps creators showcase work on the web in under a minute — turning setup friction into a fast, guided flow.',
    cover: '/media/covers/Screenshot-2023-08-05-at-9.21.31-PM.png',
  },
  {
    id: 'analytics',
    title: 'MyNeato Analytics',
    category: 'product',
    tags: 'Product Design',
    summary: 'Research & UX for MyNeato History and Analytics',
    description:
      'Research and UX design of the MyNeato History and Analytics pages — helping users understand robot activity over time.',
    cover: '/media/covers/Screen-Shot-2021-02-27-at-11.26.58-PM.png',
  },
  {
    id: 'notification-center',
    title: 'MyNeato Notifications',
    category: 'product',
    tags: 'User Experience',
    summary: 'Notifications system for the MyNeato app',
    description:
      'Led the design of the notifications system for the MyNeato app — clear, timely, and useful without becoming noise.',
    cover: '/media/covers/Screen-Shot-2021-03-01-at-7.15.28-PM.png',
  },
  {
    id: 'fuel-360',
    title: '360Fuel',
    category: 'youtube',
    tags: 'Motion Design',
    summary: 'Motion design for in-app micro animations',
    description:
      'Motion design for in-app micro animations — small moments of polish that make everyday interactions feel intentional.',
    cover: '/media/covers/Screen-Shot-2021-03-08-at-6.49.20-PM.png',
  },
  {
    id: 'neato-user-testing',
    title: 'Neato User Testing',
    category: 'product',
    tags: 'User Experience',
    summary: 'User testing early MyNeato app flows',
    description:
      'During the first phases of the MyNeato app, the UX team user-tested initial flows — insights that shaped how the product grew.',
    cover: '/media/covers/Screen-Shot-2021-03-01-at-7.51.39-PM.png',
  },
  {
    id: 'neato-animations',
    title: 'Neato In-App Animations',
    category: 'youtube',
    tags: 'Motion Design',
    summary: 'Instructional videos throughout the MyNeato app',
    description:
      'Design, animation, and rendering of instructional videos throughout the MyNeato app.',
    cover: '/media/covers/Comp-9-1.png',
  },
]

export const about = {
  name: 'Sarah Heinzen',
  title: 'Senior Inclusive Product Designer',
  company: "Microsoft's Inclusive Tech Lab",
  bio: [
    "I'm an Inclusive Product Designer at Microsoft's Inclusive Tech Lab, where I design accessible experiences across AI, hardware, Windows, and emerging tech. My work focuses on making technology more adaptable — especially for people whose needs are often treated as edge cases instead of starting points.",
    'Before product design, I worked across animation, marketing, XR, and hardware. That mix still shapes how I think: visually, systematically, and always through the lens of access.',
    "In my free time, I'm usually making games, prototyping adaptive input ideas, or exploring how mixed reality can support accessible design.",
  ],
  companies: [
    { name: 'Microsoft', url: 'https://www.microsoft.com' },
    { name: 'Spatial', url: 'https://www.spatial.io/' },
    { name: 'Neato', url: 'https://neatorobotics.com/' },
    { name: 'Xbox', url: 'https://www.xbox.com' },
  ],
  skills: [
    {
      label: 'Design',
      detail: 'Figma, Adobe Illustrator, Photoshop, InDesign, Canva',
      icon: '/media/covers/graphic.svg',
    },
    {
      label: '3D & Motion',
      detail: 'Cinema 4D, After Effects, Premiere',
      icon: '/media/covers/Cinema-4D.png',
    },
    {
      label: 'Development',
      detail: 'Vibe coding, C#, Unity, Cursor, Claude',
      icon: '/media/covers/62e131df7fe3599fdd46ecb3.png',
    },
  ],
  reel: 'https://player.vimeo.com/video/851995345?h=6ff6574f6b',
}

export interface AnimationClip {
  id: string
  title: string
  subtitle: string
  src: string
  cover: string
  portrait?: boolean
  projectId?: string
}

/** Curated queue for the YouTube video app — click through like a library. */
export const youtubePlaylist: AnimationClip[] = [
  {
    id: 'demo-reel',
    title: 'Demo Reel',
    subtitle: 'Selected motion · 2023',
    src: about.reel,
    cover: '/media/covers/Xbox-Controllers.png',
  },
  {
    id: 'motion-spot-a',
    title: 'Motion Spot',
    subtitle: '360Fuel · commercial',
    src: 'https://player.vimeo.com/video/496719245',
    cover: '/media/covers/Comp-9-1.png',
    projectId: 'fuel-360',
  },
  {
    id: 'motion-spot-b',
    title: 'Brand Motion',
    subtitle: '360Fuel · commercial',
    src: 'https://player.vimeo.com/video/477401112',
    cover: '/media/covers/Screen-Shot-2021-03-08-at-6.49.20-PM.png',
    projectId: 'fuel-360',
  },
  {
    id: 'skiddy-kitty',
    title: 'Skiddy Kitty',
    subtitle: 'Game · character animation',
    src: 'https://player.vimeo.com/video/496644790',
    cover: '/media/covers/Screen-Shot-2021-03-08-at-6.09.09-PM.png',
    portrait: true,
    projectId: 'skiddy-kitty',
  },
  {
    id: 'neato-clip-1',
    title: 'MyNeato · Clip 01',
    subtitle: 'In-app instructional',
    src: 'https://player.vimeo.com/video/518851099',
    cover: '/media/covers/Comp-9-1.png',
    portrait: true,
    projectId: 'neato-animations',
  },
  {
    id: 'neato-clip-2',
    title: 'MyNeato · Clip 02',
    subtitle: 'In-app instructional',
    src: 'https://player.vimeo.com/video/518851256',
    cover: '/media/covers/Comp-9-1.png',
    portrait: true,
    projectId: 'neato-animations',
  },
  {
    id: 'neato-clip-3',
    title: 'MyNeato · Clip 03',
    subtitle: 'In-app instructional',
    src: 'https://player.vimeo.com/video/522164588',
    cover: '/media/covers/Comp-9-1.png',
    portrait: true,
    projectId: 'neato-animations',
  },
  {
    id: 'neato-clip-4',
    title: 'MyNeato · Clip 04',
    subtitle: 'In-app instructional',
    src: 'https://player.vimeo.com/video/518851843',
    cover: '/media/covers/Comp-9-1.png',
    portrait: true,
    projectId: 'neato-animations',
  },
  {
    id: 'neato-default',
    title: 'Default Screen',
    subtitle: 'MyNeato · first-run',
    src: 'https://player.vimeo.com/video/520453645',
    cover: '/media/covers/Screen-Shot-2021-03-08-at-6.38.13-PM.png',
    portrait: true,
    projectId: 'neato-default-screen',
  },
  {
    id: 'neato-cleaning',
    title: 'Cleaning Run',
    subtitle: 'MyNeato · during clean',
    src: 'https://player.vimeo.com/video/520450748',
    cover: '/media/covers/Screen-Shot-2021-03-08-at-6.38.13-PM.png',
    portrait: true,
    projectId: 'neato-default-screen',
  },
  {
    id: 'neato-cleaning-min',
    title: 'Cleaning Run · Minimal',
    subtitle: 'MyNeato · final revision',
    src: 'https://player.vimeo.com/video/520451201',
    cover: '/media/covers/Screen-Shot-2021-03-08-at-6.38.13-PM.png',
    portrait: true,
    projectId: 'neato-default-screen',
  },
  {
    id: 'neato-clean-center',
    title: 'Clean Center Setup',
    subtitle: 'MyNeato · quick start guide',
    src: 'https://player.vimeo.com/video/579129131',
    cover: '/media/covers/Comp-9-1.png',
    portrait: true,
    projectId: 'neato-hardware',
  },
  {
    id: 'xr-data',
    title: 'XR · Data Space',
    subtitle: 'Cinema 4D · interactive graph',
    src: 'https://player.vimeo.com/video/850760341?h=caa5268946',
    cover: '/media/covers/Screenshot-2023-08-05-at-1.56.49-PM.png',
    projectId: 'xr-prototyping',
  },
  {
    id: 'xr-environment',
    title: 'XR · Environment',
    subtitle: 'Cinema 4D · immersive scene',
    src: 'https://player.vimeo.com/video/850771186?h=d67768e0e3',
    cover: '/media/covers/Screenshot-2023-08-05-at-1.56.49-PM.png',
    projectId: 'xr-prototyping',
  },
  {
    id: 'tellsense',
    title: 'TellSense',
    subtitle: 'Mixed reality · prototype',
    src: 'https://player.vimeo.com/video/852017963?h=dec5b6dd2e',
    cover: '/media/covers/Screenshot-2023-08-05-at-8.53.19-PM.png',
    projectId: 'tellsense',
  },
  {
    id: 'auto-gallery',
    title: 'Auto Gallery',
    subtitle: 'Spatial · launch flow',
    src: 'https://player.vimeo.com/video/682540318?h=f9400a6f1e',
    cover: '/media/covers/Screen-Shot-2022-02-22-at-7.51.47-PM.png',
    projectId: 'spatial-auto-gallery',
  },
  {
    id: 'spaces-picker',
    title: 'Spaces Picker',
    subtitle: 'Spatial · product motion',
    src: 'https://player.vimeo.com/video/682518404?h=dda0d04697',
    cover: '/media/covers/Screen-Shot-2022-02-22-at-7.51.47-PM.png',
    projectId: 'spatial-spaces-picker',
  },
]

export const contact = {
  email: 'hello@sarahheinzen.com',
  note: 'Want to talk about design, speaking opportunities, or an accessibility issue on the site? I’d love to hear from you.',
}

export type InboxMessage = {
  id: string
  from: string
  subject: string
  preview: string
  body: string[]
  received: string
  receivedLabel: string
  unread?: boolean
}

/** Placeholder Outlook inbox — intentional nonsense, not real mail. */
export const contactInbox: InboxMessage[] = [
  {
    id: 'me-volunteer',
    from: 'Me',
    subject: 'Stop volunteering for things.',
    preview: 'This is a courtesy reminder from past you.',
    body: [
      'Hi future me,',
      'This is a courtesy reminder from past you. Stop volunteering for things. You already have enough tabs open.',
      'Love, Me',
    ],
    received: '2026-07-13T09:12:00',
    receivedLabel: '9:12 AM',
    unread: true,
  },
  {
    id: 'future-sarah',
    from: 'Future Sarah',
    subject: "We probably didn't need to prototype that six different ways.",
    preview: 'Three would have been fine. Four, maybe.',
    body: [
      'Okay but hear me out —',
      "We probably didn't need to prototype that six different ways. Three would have been fine. Four, maybe. Six is a cry for help.",
      'See you yesterday, Future Sarah',
    ],
    received: '2026-07-13T08:41:00',
    receivedLabel: '8:41 AM',
    unread: true,
  },
  {
    id: 'figma',
    from: 'Figma',
    subject: 'Untitled (147) has entered the chat.',
    preview: 'Also Untitled (146) is still open. Just saying.',
    body: [
      'Untitled (147) has entered the chat.',
      'Also Untitled (146) is still open. Just saying.',
      '— Figma',
    ],
    received: '2026-07-12T17:05:00',
    receivedLabel: 'Yesterday',
    unread: true,
  },
  {
    id: 'clippy',
    from: 'Clippy',
    subject: 'You seem to be avoiding your email.',
    preview: 'It looks like you’re trying to design. Would you like help?',
    body: [
      'It looks like you’re trying to design. Would you like help?',
      'Also: you seem to be avoiding your email. I can draft a polite decline, a chaotic yes, or a very long maybe.',
      '— Clippy',
    ],
    received: '2026-07-12T15:22:00',
    receivedLabel: 'Yesterday',
  },
  {
    id: 'design-team',
    from: 'Design Team',
    subject: 'Can we make it pop? (denied)',
    preview: 'Request status: Denied. With love.',
    body: [
      'Can we make it pop?',
      'Request status: Denied. With love.',
      '— Design Team',
    ],
    received: '2026-07-12T11:08:00',
    receivedLabel: 'Yesterday',
  },
  {
    id: 'itl',
    from: 'ITL',
    subject: 'Service Dog visit today 🐕',
    preview: 'Priority: extremely high. Bring treats energy.',
    body: [
      'Service Dog visit today 🐕',
      'Priority: extremely high. Bring treats energy. Optional: your actual work.',
      '— Inclusive Tech Lab',
    ],
    received: '2026-07-11T10:00:00',
    receivedLabel: 'Fri',
    unread: true,
  },
  {
    id: 'a11y',
    from: 'Accessibility',
    subject: 'Did you tab through it?',
    preview: 'If not, please do. The keyboard is not just decoration.',
    body: [
      'Quick check:',
      'Did you tab through it? If not, please do. The keyboard is not just decoration.',
      '— Accessibility',
    ],
    received: '2026-07-11T09:15:00',
    receivedLabel: 'Fri',
  },
  {
    id: 'user-research',
    from: 'User Research',
    subject: 'Turns out people use things differently. Again.',
    preview: 'Shocking update from the lab.',
    body: [
      'Shocking update from the lab:',
      'Turns out people use things differently. Again.',
      'We have stickies. So many stickies.',
      '— User Research',
    ],
    received: '2026-07-10T16:44:00',
    receivedLabel: 'Thu',
  },
  {
    id: 'teams',
    from: 'Microsoft T.eams',
    subject: 'Someone said "quick question."',
    preview: 'Estimated meeting length: forever.',
    body: [
      'Someone said "quick question."',
      'Estimated meeting length: forever.',
      'A calendar invite has been created against your will.',
      '— Microsoft T.eams',
    ],
    received: '2026-07-10T14:02:00',
    receivedLabel: 'Thu',
    unread: true,
  },
  {
    id: 'me-water',
    from: 'Me',
    subject: 'Drink some water.',
    preview: 'You know what you did.',
    body: [
      'Drink some water.',
      'You know what you did.',
      '— Me',
    ],
    received: '2026-07-09T13:30:00',
    receivedLabel: 'Wed',
  },
  {
    id: 'github',
    from: 'GitHub',
    subject: 'Somehow this became a design problem.',
    preview: 'The PR started as a typo fix.',
    body: [
      'The PR started as a typo fix.',
      'Somehow this became a design problem.',
      'There are 14 comments and one of them is just the word “vibes.”',
      '— GitHub',
    ],
    received: '2026-07-09T11:11:00',
    receivedLabel: 'Wed',
  },
  {
    id: 'windows',
    from: 'Windows',
    subject: 'Reboot recommended (for you).',
    preview: 'Updates can wait. You look tired.',
    body: [
      'Reboot recommended (for you).',
      'Updates can wait. You look tired.',
      '— Windows',
    ],
    received: '2026-07-08T18:00:00',
    receivedLabel: 'Tue',
  },
  {
    id: 'plants',
    from: 'Plants',
    subject: 'Water us before we unionize',
    preview: 'This is not a drill. The monstera is drafting bylaws.',
    body: [
      'Water us before we unionize.',
      'This is not a drill. The monstera is drafting bylaws.',
      '— Plants',
    ],
    received: '2026-07-08T08:00:00',
    receivedLabel: 'Tue',
    unread: true,
  },
]

/** Desktop launcher apps (not every project category gets its own icon). */
export type DesktopAppId = 'games' | 'browser' | 'youtube'

export const desktopApps: Array<{
  id: DesktopAppId
  label: string
  icon: 'steam' | 'browser' | 'youtube'
  category?: ProjectCategory
}> = [
  { id: 'games', label: 'Games', icon: 'steam', category: 'games' },
  { id: 'browser', label: 'Browser', icon: 'browser' },
  { id: 'youtube', label: 'YouTube', icon: 'youtube', category: 'youtube' },
]

export function getProjectsByCategory(category: ProjectCategory) {
  return projects.filter((p) => p.category === category)
}

export function getFeaturedProjects() {
  return projects.filter((p) => p.featured)
}

export function getProject(id: string) {
  return projects.find((p) => p.id === id)
}
