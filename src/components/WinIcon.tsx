export type IconName =
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
  | 'terminal'
  | 'photos'
  | 'accessibility'
  | 'magnify'
  | 'headControl'
  | 'voiceAccess'

/** Custom app art from /public/icons — transparent squircles */
const rasterIcons: Partial<Record<IconName, string>> = {
  steam: '/icons/steam.png',
  user: '/icons/about.png',
  browser: '/icons/browser.png',
  player: '/icons/player.png',
  mail: '/icons/contact.png',
  notepad: '/icons/stickies.png',
  terminal: '/icons/terminal.png',
  figma: '/icons/figma.png',
  documents: '/icons/documents.png',
  photos: '/icons/photos.png',
}

/** Dock tray icons with separate light/dark art (swapped via CSS) */
const themeIcons: Partial<
  Record<IconName, { light: string; dark: string }>
> = {
  accessibility: {
    light: '/icons/accessibility-light.png',
    dark: '/icons/accessibility-dark.png',
  },
  magnify: {
    light: '/icons/magnify-light.png',
    dark: '/icons/magnify-dark.png',
  },
  headControl: {
    light: '/icons/head-light.png',
    dark: '/icons/head-dark.png',
  },
  voiceAccess: {
    light: '/icons/voice-light.png',
    dark: '/icons/voice-dark.png',
  },
}

/** Fallback SVG modules for non-app / folder glyphs */
const icons: Record<IconName, string> = {
  star: `
    <rect x="6" y="6" width="40" height="40" rx="10" fill="#ffe5a8" stroke="#2c2a32" stroke-width="2.25"/>
    <circle cx="26" cy="26" r="11" fill="#fffaf7" stroke="#2c2a32" stroke-width="2"/>
    <circle cx="26" cy="26" r="4" fill="#ffb498" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="14" cy="14" r="2.2" fill="#2c2a32"/>
    <circle cx="38" cy="14" r="2.2" fill="#2c2a32"/>
    <circle cx="14" cy="38" r="2.2" fill="#2c2a32"/>
    <circle cx="38" cy="38" r="2.2" fill="#2c2a32"/>
  `,
  folder: `
    <path fill="#b6e5d4" stroke="#2c2a32" stroke-width="2.25" stroke-linejoin="round"
      d="M7 16c0-2.2 1.8-4 4-4h9.2c1.1 0 2.1-.5 2.8-1.3l1.2-1.4c.7-.8 1.7-1.3 2.8-1.3H41c2.2 0 4 1.8 4 4v26c0 2.2-1.8 4-4 4H11c-2.2 0-4-1.8-4-4V16z"/>
    <rect x="11" y="22" width="30" height="18" rx="4" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="17" cy="31" r="2.4" fill="#ffb498" stroke="#2c2a32" stroke-width="1.4"/>
    <circle cx="26" cy="31" r="2.4" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.4"/>
    <circle cx="35" cy="31" r="2.4" fill="#d4c8f5" stroke="#2c2a32" stroke-width="1.4"/>
  `,
  documents: `
    <rect x="10" y="6" width="32" height="40" rx="8" fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25"/>
    <rect x="15" y="12" width="22" height="6" rx="2" fill="#c8d5e4" stroke="#2c2a32" stroke-width="1.5"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2" stroke-linecap="round" d="M16 26h20M16 33h16M16 40h12"/>
    <rect x="34" y="8" width="5" height="10" rx="1.5" fill="#ffb498" stroke="#2c2a32" stroke-width="1.4"/>
  `,
  computer: `
    <rect x="6" y="8" width="40" height="30" rx="8" fill="#c8d5e4" stroke="#2c2a32" stroke-width="2.25"/>
    <rect x="11" y="13" width="30" height="16" rx="4" fill="#2c2a32" stroke="#2c2a32" stroke-width="1.5"/>
    <rect x="13.5" y="15.5" width="25" height="11" rx="2.5" fill="#b6e5d4"/>
    <circle cx="16" cy="33" r="2.1" fill="#ffb498" stroke="#2c2a32" stroke-width="1.35"/>
    <circle cx="23" cy="33" r="2.1" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.35"/>
    <rect x="29" y="31.2" width="12" height="3.6" rx="1.8" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.35"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2.25" stroke-linecap="round" d="M18 42h16"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2.25" stroke-linecap="round" d="M26 38v4"/>
  `,
  terminal: `
    <rect x="5" y="7" width="42" height="38" rx="10" fill="#2c2a32" stroke="#2c2a32" stroke-width="2.25"/>
    <rect x="10" y="12" width="32" height="20" rx="4" fill="#f4eee9" stroke="#fffaf7" stroke-width="1.5"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"
      d="M14.5 18l4 3.2-4 3.2M21 24.5h8"/>
    <rect x="10" y="36" width="10" height="4.5" rx="2" fill="#b6e5d4" stroke="#fffaf7" stroke-width="1.2"/>
    <rect x="23" y="36" width="10" height="4.5" rx="2" fill="#ffe5a8" stroke="#fffaf7" stroke-width="1.2"/>
    <rect x="36" y="36" width="6" height="4.5" rx="2" fill="#ffb498" stroke="#fffaf7" stroke-width="1.2"/>
  `,
  browser: `
    <rect x="5" y="7" width="42" height="38" rx="10" fill="#c8d5e4" stroke="#2c2a32" stroke-width="2.25"/>
    <rect x="10" y="12" width="32" height="5" rx="2.5" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.5"/>
    <circle cx="14.2" cy="14.5" r="1.55" fill="#ffb498" stroke="#2c2a32" stroke-width="1.1"/>
    <circle cx="19.2" cy="14.5" r="1.55" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.1"/>
    <circle cx="24.2" cy="14.5" r="1.55" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.1"/>
    <rect x="10" y="20" width="32" height="18" rx="4" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75"/>
    <path fill="none" stroke="#2c2a32" stroke-width="1.75" stroke-linecap="round" d="M15 26h22M15 31h14"/>
    <circle cx="37" cy="35.5" r="2.3" fill="#d4c8f5" stroke="#2c2a32" stroke-width="1.35"/>
  `,
  player: `
    <rect x="5" y="8" width="42" height="36" rx="10" fill="#d4c8f5" stroke="#2c2a32" stroke-width="2.25"/>
    <rect x="11" y="13" width="30" height="14" rx="4" fill="#f4eee9" stroke="#2c2a32" stroke-width="1.75"/>
    <path fill="#2c2a32" d="M22.5 16.5l9 4.5-9 4.5z"/>
    <circle cx="16" cy="36" r="4.5" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="16" cy="36" r="1.8" fill="#ffb498" stroke="#2c2a32" stroke-width="1.25"/>
    <circle cx="28" cy="36" r="4.5" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="28" cy="36" r="1.8" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.25"/>
    <rect x="35" y="33.5" width="7" height="5" rx="1.5" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.4"/>
  `,
  vscode: `
    <rect x="6" y="6" width="40" height="40" rx="10" fill="#a8c8e8" stroke="#2c2a32" stroke-width="2.25"/>
    <path fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75" stroke-linejoin="round"
      d="M16 14l20 12-20 12V14z"/>
    <rect x="12" y="38" width="8" height="3.5" rx="1.5" fill="#ffb498" stroke="#2c2a32" stroke-width="1.2"/>
    <rect x="22" y="38" width="8" height="3.5" rx="1.5" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.2"/>
    <rect x="32" y="38" width="8" height="3.5" rx="1.5" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.2"/>
  `,
  figma: `
    <rect x="8" y="5" width="36" height="42" rx="10" fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25"/>
    <circle cx="20" cy="14" r="5.5" fill="#ffb498" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="32" cy="14" r="5.5" fill="#d4c8f5" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="20" cy="26" r="5.5" fill="#c4b0f0" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="32" cy="26" r="5.5" fill="#a8c8e8" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="20" cy="38" r="5.5" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.75"/>
    <rect x="27" y="33.5" width="10" height="9" rx="3" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.75"/>
  `,
  steam: `
    <rect x="5" y="5" width="42" height="42" rx="12" fill="#a8c8e8" stroke="#2c2a32" stroke-width="2.25"/>
    <circle cx="20" cy="32" r="9" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.85"/>
    <circle cx="20" cy="32" r="3.4" fill="#a8c8e8" stroke="#2c2a32" stroke-width="1.5"/>
    <path fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75" stroke-linejoin="round"
      d="M25.5 27.5l9.2-9.2 3.6 3.6-9.2 9.2z"/>
    <circle cx="36.5" cy="16.5" r="5.5" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="36.5" cy="16.5" r="2.2" fill="#ffb498" stroke="#2c2a32" stroke-width="1.25"/>
    <rect x="10" y="10" width="7" height="4" rx="2" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.2"/>
  `,
  mail: `
    <rect x="5" y="11" width="42" height="30" rx="10" fill="#f5c4d0" stroke="#2c2a32" stroke-width="2.25"/>
    <path fill="#fffaf7" stroke="#2c2a32" stroke-width="1.75" stroke-linejoin="round"
      d="M11 18l15 11 15-11v16a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V18z"/>
    <path fill="none" stroke="#2c2a32" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"
      d="M11 18l15 11 15-11"/>
    <circle cx="39" cy="36" r="2.2" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.25"/>
  `,
  user: `
    <rect x="6" y="5" width="40" height="42" rx="10" fill="#b6e5d4" stroke="#2c2a32" stroke-width="2.25"/>
    <circle cx="26" cy="18" r="8" fill="#ffe5a8" stroke="#2c2a32" stroke-width="2"/>
    <circle cx="26" cy="18" r="2.8" fill="#fffaf7" stroke="#2c2a32" stroke-width="1.4"/>
    <path fill="#fffaf7" stroke="#2c2a32" stroke-width="2"
      d="M12 42c2.5-9 8.5-13 14-13s11.5 4 14 13"/>
    <rect x="12" y="8" width="6" height="3.5" rx="1.5" fill="#ffb498" stroke="#2c2a32" stroke-width="1.2"/>
    <rect x="20" y="8" width="6" height="3.5" rx="1.5" fill="#d4c8f5" stroke="#2c2a32" stroke-width="1.2"/>
  `,
  notepad: `
    <rect x="10" y="5" width="32" height="42" rx="8" fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25"/>
    <rect x="10" y="5" width="32" height="10" rx="8" fill="#ffe5a8" stroke="#2c2a32" stroke-width="2.25"/>
    <path fill="#ffe5a8" d="M10 11h32v4H10z"/>
    <circle cx="17" cy="10" r="2.3" fill="#ffb498" stroke="#2c2a32" stroke-width="1.35"/>
    <circle cx="26" cy="10" r="2.3" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.35"/>
    <circle cx="35" cy="10" r="2.3" fill="#d4c8f5" stroke="#2c2a32" stroke-width="1.35"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2" stroke-linecap="round" d="M16 24h20M16 31h20M16 38h14"/>
  `,
  file: `
    <path fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25" stroke-linejoin="round"
      d="M12 6h16l12 12v26a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z"/>
    <path fill="#c8d5e4" stroke="#2c2a32" stroke-width="1.75" stroke-linejoin="round" d="M28 6v12h12"/>
    <circle cx="16" cy="36" r="2.2" fill="#ffb498" stroke="#2c2a32" stroke-width="1.25"/>
    <circle cx="23" cy="36" r="2.2" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.25"/>
    <path fill="none" stroke="#2c2a32" stroke-width="1.75" stroke-linecap="round" d="M14 22h16M14 28h12"/>
  `,
  photos: `
    <rect x="6" y="10" width="40" height="32" rx="8" fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25"/>
    <circle cx="18" cy="20" r="5" fill="#ffe5a8" stroke="#2c2a32" stroke-width="1.75"/>
    <path fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.75" stroke-linejoin="round"
      d="M10 36l10-8 8 6 6-5 10 7v3a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4v-3z"/>
    <rect x="34" y="8" width="8" height="8" rx="3" fill="#d4c8f5" stroke="#2c2a32" stroke-width="1.75"/>
    <circle cx="38" cy="12" r="1.8" fill="#ffb498" stroke="#2c2a32" stroke-width="1.2"/>
  `,
  accessibility: `
    <circle cx="26" cy="26" r="18" fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25"/>
    <circle cx="26" cy="16" r="3" fill="#2c2a32"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"
      d="M14 24h24M26 24v8M20 38l6-6 6 6"/>
  `,
  magnify: `
    <circle cx="22" cy="22" r="12" fill="#fffaf7" stroke="#2c2a32" stroke-width="2.5"/>
    <path fill="none" stroke="#2c2a32" stroke-width="2.8" stroke-linecap="round" d="M30 30l10 10"/>
    <circle cx="22" cy="22" r="6" fill="#d4c8f5" stroke="#2c2a32" stroke-width="1.75"/>
  `,
  headControl: `
    <g transform="translate(-3, 3)">
      <circle cx="26" cy="20" r="8" fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25"/>
      <path fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25" stroke-linejoin="round"
        d="M14 38c2-8 7-12 12-12s10 4 12 12"/>
      <rect x="34" y="8" width="10" height="8" rx="2" fill="#c8d5e4" stroke="#2c2a32" stroke-width="1.75"/>
      <circle cx="39" cy="12" r="2.5" fill="#b6e5d4" stroke="#2c2a32" stroke-width="1.5"/>
    </g>
  `,
  voiceAccess: `
    <g transform="translate(2, 1)">
      <rect x="20" y="8" width="12" height="20" rx="6" fill="#fffaf7" stroke="#2c2a32" stroke-width="2.25"/>
      <path fill="none" stroke="#2c2a32" stroke-width="2.25" stroke-linecap="round"
        d="M14 24a12 12 0 0 0 24 0"/>
      <path fill="none" stroke="#2c2a32" stroke-width="2.5" stroke-linecap="round" d="M26 36v6"/>
      <path fill="none" stroke="#2c2a32" stroke-width="2.5" stroke-linecap="round" d="M18 42h16"/>
      <circle cx="26" cy="16" r="2.5" fill="#ffb498" stroke="#2c2a32" stroke-width="1.5"/>
    </g>
  `,
}

interface WinIconProps {
  name: IconName
  size?: number
  className?: string
}

export function WinIcon({ name, size = 48, className }: WinIconProps) {
  const themed = themeIcons[name]
  if (themed) {
    const cls = className ? `win-icon win-icon--themed ${className}` : 'win-icon win-icon--themed'
    return (
      <span className={cls} style={{ width: size, height: size }}>
        <img
          className="win-icon__light"
          src={themed.light}
          alt=""
          width={size}
          height={size}
          draggable={false}
        />
        <img
          className="win-icon__dark"
          src={themed.dark}
          alt=""
          width={size}
          height={size}
          draggable={false}
        />
      </span>
    )
  }

  const src = rasterIcons[name]
  if (src) {
    return (
      <img
        className={className ? `win-icon ${className}` : 'win-icon'}
        src={src}
        alt=""
        width={size}
        height={size}
        draggable={false}
      />
    )
  }

  return (
    <svg
      className={className ? `win-icon ${className}` : 'win-icon'}
      width={size}
      height={size}
      viewBox="0 0 52 52"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icons[name] }}
    />
  )
}
