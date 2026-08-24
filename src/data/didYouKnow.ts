export type DidYouKnowId =
  | 'head'
  | 'voice'
  | 'keyboard'
  | 'switch'
  | 'adaptive'
  | 'magnifier'
  | 'narrator'
  | 'contrast'
  | 'dwell'
  | 'font'

export interface DidYouKnowTip {
  id: DidYouKnowId
  emoji: string
  title: string
  body: string
}

export const DID_YOU_KNOW_TIPS: Record<DidYouKnowId, DidYouKnowTip> = {
  head: {
    id: 'head',
    emoji: '🙂',
    title: 'Head Tracking',
    body: "Head tracking turns natural head movements into cursor movement. It's often used by people who have limited hand mobility but can comfortably move their head, and it can be combined with voice or switches for full computer control.",
  },
  voice: {
    id: 'voice',
    emoji: '🎤',
    title: 'Voice Control',
    body: "Voice input isn't just about convenience. It can reduce repetitive strain, provide hands-free control, and enable people with limited mobility to navigate, dictate, and interact with technology using speech.",
  },
  keyboard: {
    id: 'keyboard',
    emoji: '⌨️',
    title: 'Keyboard Navigation',
    body: 'Many people rarely, or never, use a mouse. Keyboard navigation is essential for many blind users, power users, and people with mobility impairments, making clear focus order and keyboard shortcuts critical to good design.',
  },
  switch: {
    id: 'switch',
    emoji: '🔘',
    title: 'Switch Access',
    body: 'Switches are simple buttons that can be activated with a hand, foot, head movement, or another part of the body. By scanning through options one at a time, people with very limited mobility can navigate a computer using just one or two switches.',
  },
  adaptive: {
    id: 'adaptive',
    emoji: '🤲',
    title: 'Adaptive Controller / Adaptive Accessories',
    body: 'No single controller works for everyone. Adaptive accessories let people build a setup around their own abilities, combining buttons, joysticks, switches, and other inputs to create a personalized way to interact with technology.',
  },
  magnifier: {
    id: 'magnifier',
    emoji: '🔎',
    title: 'Magnifier',
    body: 'Low vision affects millions of people and looks different for everyone. Magnification, custom zoom levels, and tracking features help people comfortably read, work, and navigate without relying on a single level of vision.',
  },
  narrator: {
    id: 'narrator',
    emoji: '🔊',
    title: 'Narrator / Screen Readers',
    body: "A screen reader reads aloud what's on the screen and describes interface elements so blind and low vision users can independently navigate digital experiences. Good structure, labels, and keyboard support make that possible.",
  },
  contrast: {
    id: 'contrast',
    emoji: '🎨',
    title: 'High Contrast & Color Filters',
    body: 'Not everyone perceives color or contrast the same way. Custom color filters and high contrast themes can improve readability for people with low vision, color vision deficiencies, migraines, and light sensitivity.',
  },
  dwell: {
    id: 'dwell',
    emoji: '🖱️',
    title: 'Dwell Clicking',
    body: "Dwell clicking lets someone activate a button simply by holding their cursor over it for a short time. It's commonly paired with eye or head tracking so users can interact without pressing a physical mouse button.",
  },
  font: {
    id: 'font',
    emoji: '🔤',
    title: 'Readable Fonts',
    body: 'Typography can make reading easier for people with low vision, dyslexia, or processing differences. Typefaces like Atkinson Hyperlegible and OpenDyslexic are designed to improve letter distinction and reading comfort, and sometimes people just prefer Comic Sans.',
  },
}
