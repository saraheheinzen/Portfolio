import type { IconName } from '../components/WinIcon'

export type AppAction =
  | 'about'
  | 'browser'
  | 'games'
  | 'player'
  | 'contact'
  | 'welcome'
  | 'terminal'
  | 'documents'
  | 'photos'
  | 'figma'

export interface PinnedApp {
  id: string
  label: string
  icon: IconName
  action: AppAction
}

/** Shared app list for the Start menu, taskbar, and mobile home screen. */
export const PINNED_APPS: PinnedApp[] = [
  { id: 'about', label: 'About Me', icon: 'user', action: 'about' },
  { id: 'browser', label: 'Browser', icon: 'browser', action: 'browser' },
  { id: 'games', label: 'Games', icon: 'steam', action: 'games' },
  { id: 'player', label: 'Media Player', icon: 'player', action: 'player' },
  { id: 'figma', label: 'Figma', icon: 'figma', action: 'figma' },
  { id: 'documents', label: 'Documents', icon: 'documents', action: 'documents' },
  { id: 'photos', label: 'Photos', icon: 'photos', action: 'photos' },
  { id: 'contact', label: 'Contact', icon: 'mail', action: 'contact' },
  { id: 'welcome', label: 'Sticky', icon: 'notepad', action: 'welcome' },
  { id: 'terminal', label: 'Terminal', icon: 'terminal', action: 'terminal' },
]
