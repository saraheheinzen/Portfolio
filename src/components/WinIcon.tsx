type IconName =
  | 'folder'
  | 'documents'
  | 'computer'
  | 'mail'
  | 'user'
  | 'notepad'
  | 'file'
  | 'star'
  | 'player'
  | 'vscode'
  | 'figma'
  | 'steam'
  | 'browser'
  | 'youtube'
  | 'terminal'
  | 'terminal'

/** Soft pastel × TE modular icons — precise radii, knobby accents */
const icons: Record<IconName, string> = {
  star: `
    <path fill="#ffe5a8" stroke="#2c2a32" stroke-width="2" stroke-linejoin="round"
      d="M26 6l5.2 12.4 13.5.8-10.4 8.6 3.4 13-11.7-6.8L14.3 41l3.4-13L7.3 19.2l13.5-.8z"/>
  `,
  folder: `
    <path fill="#b6e5d4" stroke="#2c2a32" stroke-width="2" stroke-linejoin="round"
      d="M7 17c0-2 1.6-3.5 3.5-3.5h10c1-0 1.8-1.5 3.2-1.5H40c2.5 0 4.5 2 4.5 4.5v22c0 2.5-2 4.5-4.5 4.5H11c-2.5 0-4.5-2-4.5-4.5V17z"/>
  `,
  documents: `
    <path fill="#fffaf7" stroke="#2c2a32" stroke-width="2" stroke-linejoin="round"
      d="M13 7h18l10 10v28c0 2-1.6 3.5-3.5 3.5H13c-2 0-3.5-1.5-3.5-3.5V10.5C9.5 8.5 11 7 13 7z"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2" stroke-linecap="round" d="M18 22h16M18 30h14M18 38h10"/>
  `,
  computer: `
    <rect x="8" y="10" width="36" height="24" rx="8" fill="#c8d5e4" stroke="#2c2a32" stroke-width="2"/>
    <rect x="13" y="14" width="26" height="14" rx="4" fill="#f4eee9" stroke="#2c2a32" stroke-width="1.75"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2" stroke-linecap="round" d="M20 40h12M26 34v6"/>
  `,
  terminal: `
    <rect x="6" y="8" width="40" height="36" rx="8" fill="#2c2a32" stroke="#2c2a32" stroke-width="2"/>
    <rect x="10" y="12" width="32" height="22" rx="4" fill="#f4eee9" stroke="#2c2a32" stroke-width="1.5"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2" stroke-linecap="round" d="M14 18h6M14 24h10M14 30h8"/>
    <path fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.5" d="M14 40h24v2a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-2z"/>
  `,
  browser: `
    <rect x="6" y="8" width="40" height="36" rx="8" fill="#c8d5e4" stroke="#2c2a32" stroke-width="2"/>
    <path fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75"
      d="M10 16h32v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V16z"/>
    <path fill="none" stroke="#2c2a32" stroke-width="1.75" stroke-linecap="round" d="M10 16h32"/>
    <circle cx="13.5" cy="12" r="1.6" fill="#ffb498" stroke="#2c2a32" stroke-width="1.1"/>
    <circle cx="19" cy="12" r="1.6" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.1"/>
    <circle cx="24.5" cy="12" r="1.6" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.1"/>
    <rect x="29" y="10.2" width="14" height="3.6" rx="1.8" fill="#f4eee9" stroke="#2c2a32" stroke-width="1.1"/>
  `,
  youtube: `
    <rect x="6" y="12" width="40" height="28" rx="10" fill="#ffb498" stroke="#2c2a32" stroke-width="2"/>
    <path fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75" stroke-linejoin="round"
      d="M22 19.5l12 6.5-12 6.5z"/>
  `,
  player: `
    <rect x="6" y="10" width="40" height="32" rx="8" fill="#d4c8f5" stroke="#2c2a32" stroke-width="2"/>
    <rect x="11" y="14" width="30" height="18" rx="4" fill="#f4eee9" stroke="#2c2a32" stroke-width="1.75"/>
    <path fill="#2c2a32" stroke="#2c2a32" stroke-width="1.25" stroke-linejoin="round"
      d="M22 17.5l11 5.5-11 5.5z"/>
    <circle cx="16" cy="37" r="2.25" fill="#ffb498" stroke="#2c2a32" stroke-width="1.5"/>
    <path fill="none" stroke="#2c2a32" stroke-width="1.75" stroke-linecap="round" d="M22 37h14"/>
  `,
  vscode: `
    <path fill="#a8c8e8" stroke="#2c2a32" stroke-width="2" stroke-linejoin="round"
      d="M41 6.5L18 24.5 8 18v16l10-6.5L41 45.5V6.5z"/>
    <path fill="#c8d5e4" stroke="#2c2a32" stroke-width="1.75" stroke-linejoin="round"
      d="M41 6.5l-5.5 3.8v31.4L41 45.5V6.5z"/>
  `,
  figma: `
    <circle cx="20" cy="13" r="6" fill="#ffb498" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="32" cy="13" r="6" fill="#d4c8f5" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="20" cy="25" r="6" fill="#c4b0f0" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="32" cy="25" r="6" fill="#a8c8e8" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="20" cy="37" r="6" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.75"/>
  `,
  steam: `
    <circle cx="26" cy="26" r="18" fill="#a8c8e8" stroke="#2c2a32" stroke-width="2"/>
    <circle cx="19" cy="31" r="8" fill="#f4eee9" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="19" cy="31" r="3.25" fill="#a8c8e8" stroke="#2c2a32" stroke-width="1.5"/>
    <path fill="#f4eee9" stroke="#2c2a32" stroke-width="1.75" stroke-linejoin="round"
      d="M24.5 27l9-9 3.4 3.4-9 9z"/>
    <circle cx="36.5" cy="15" r="5.25" fill="#f4eee9" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="36.5" cy="15" r="2.1" fill="#a8c8e8" stroke="#2c2a32" stroke-width="1.25"/>
  `,
  mail: `
    <rect x="7" y="14" width="38" height="26" rx="8" fill="#f5c4d0" stroke="#2c2a32" stroke-width="2"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      d="M13 20l13 10 13-10"/>
  `,
  user: `
    <circle cx="26" cy="17" r="8" fill="#ffe5a8" stroke="#2c2a32" stroke-width="2"/>
    <path fill="#b6e5d4" stroke="#2c2a32" stroke-width="2"
      d="M9 43c3-11 10-15 17-15s14 4 17 15"/>
  `,
  notepad: `
    <rect x="12" y="6" width="28" height="40" rx="8" fill="#fffaf7" stroke="#2c2a32" stroke-width="2"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2" stroke-linecap="round" d="M18 18h16M18 26h16M18 34h11"/>
    <circle cx="18" cy="10" r="2" fill="#ffb498"/>
    <circle cx="24" cy="10" r="2" fill="#b6e5d4"/>
    <circle cx="30" cy="10" r="2" fill="#d4c8f5"/>
  `,
  file: `
    <path fill="#fff" stroke="#2c2a32" stroke-width="2" stroke-linejoin="round"
      d="M13 6h16l11 11v28a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/>
    <path fill="#f4eee9" stroke="#2c2a32" stroke-width="1.75" d="M29 6v11h11"/>
  `,
}

interface WinIconProps {
  name: IconName
  size?: number
  className?: string
}

export function WinIcon({ name, size = 48, className }: WinIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 52 52"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icons[name] }}
    />
  )
}
