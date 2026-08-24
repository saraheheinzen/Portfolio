import { useCallback, useEffect, useMemo, useState } from 'react'

export type ExploreMode =
  | 'mouse'
  | 'head'
  | 'keyboard'
  | 'voice'
  | 'screenReader'
  | 'reducedMotion'
  | 'highContrast'
  | 'largeText'

export type ColorFilter =
  | 'none'
  | 'grayscale'
  | 'invert'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'

/** Vision menu typefaces. */
export type FontFamily = 'default' | 'comic' | 'legible' | 'dyslexia'

/** Pointer size for mouse and head/dwell cursors. */
export type CursorSize = 'default' | 'large' | 'xlarge' | 'xxlarge'

export const CURSOR_SCALE: Record<CursorSize, number> = {
  default: 1,
  large: 1.5,
  xlarge: 2,
  xxlarge: 2.75,
}

export interface A11yState {
  mode: ExploreMode | null
  narrator: boolean
  colorFilter: ColorFilter
  /** Webcam head-pose cursor via MediaPipe Face Landmarker. */
  headControl: boolean
  /** Hover/head hold to click — useful with limited motor control. */
  dwellCursor: boolean
  voiceAccess: boolean
  highContrast: boolean
  darkMode: boolean
  reducedMotion: boolean
  /** Text size as a percent of default (100–150). */
  textScale: number
  /** Site-wide typeface override from the Vision menu. */
  fontFamily: FontFamily
  /** Enlarged pointer for mouse, head, and dwell cursors. */
  cursorSize: CursorSize
  keyboardOnly: boolean
}

export type A11yToggleKey = keyof Omit<
  A11yState,
  'mode' | 'colorFilter' | 'textScale' | 'fontFamily' | 'cursorSize'
>

/** How long the pointer must stay on a target before dwell activates it (ms). */
export const DWELL_MS_DEFAULT = 1000

export const TEXT_SCALE_MIN = 100
export const TEXT_SCALE_MAX = 150
export const TEXT_SCALE_DEFAULT = 100
export const TEXT_SCALE_LARGE = 118

const STORAGE_KEY = 'sh-explore-mode'
const DARK_KEY = 'sh-dark-mode'

export const EXPLORE_OPTIONS: Array<{
  id: ExploreMode
  label: string
  description: string
}> = [
  {
    id: 'mouse',
    label: 'Mouse',
    description: 'Standard pointer and click. Add head or dwell from the dock anytime.',
  },
  {
    id: 'head',
    label: 'Head Control',
    description:
      'Move with your head, smile to click. Larger targets and snap assist from the start.',
  },
  {
    id: 'keyboard',
    label: 'Keyboard only',
    description: 'Strong focus path, no reliance on hover.',
  },
  {
    id: 'voice',
    label: 'Voice',
    description: 'Say commands like “open games” or “show about.” Mic listens from the start.',
  },
  {
    id: 'screenReader',
    label: 'Screen Reader',
    description:
      'This site is nonlinear. This mode lays it out for easier reading.',
  },
  {
    id: 'reducedMotion',
    label: 'Reduced Motion',
    description: 'Still desktop. Animations and motion cues quiet down.',
  },
  {
    id: 'highContrast',
    label: 'High Contrast',
    description: 'Theme switch for sharp edges and clearer separation.',
  },
  {
    id: 'largeText',
    label: 'Large Text',
    description: 'Bigger type across windows, dock, and icons.',
  },
]

function clampTextScale(value: number) {
  return Math.min(
    TEXT_SCALE_MAX,
    Math.max(TEXT_SCALE_MIN, Math.round(value)),
  )
}

function featuresForMode(mode: ExploreMode): Omit<A11yState, 'mode'> {
  const base: Omit<A11yState, 'mode'> = {
    narrator: false,
    colorFilter: 'none',
    headControl: false,
    dwellCursor: false,
    voiceAccess: false,
    highContrast: false,
    darkMode: false,
    reducedMotion: false,
    textScale: TEXT_SCALE_DEFAULT,
    fontFamily: 'default',
    cursorSize: 'default',
    keyboardOnly: false,
  }

  switch (mode) {
    case 'mouse':
      return base
    case 'head':
      return {
        ...base,
        headControl: true,
      }
    case 'keyboard':
      return {
        ...base,
        keyboardOnly: true,
      }
    case 'voice':
      return {
        ...base,
        voiceAccess: true,
      }
    case 'screenReader':
      return {
        ...base,
        narrator: true,
        keyboardOnly: true,
      }
    case 'reducedMotion':
      return {
        ...base,
        reducedMotion: true,
      }
    case 'highContrast':
      return {
        ...base,
        highContrast: true,
      }
    case 'largeText':
      return {
        ...base,
        textScale: TEXT_SCALE_LARGE,
      }
  }
}

function readStoredMode(): ExploreMode | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    if (!value) return null
    if (EXPLORE_OPTIONS.some((o) => o.id === value)) return value as ExploreMode
  } catch {
    /* ignore */
  }
  return null
}

function readStoredDark(): boolean {
  try {
    return sessionStorage.getItem(DARK_KEY) === '1'
  } catch {
    return false
  }
}

function writeStoredDark(on: boolean) {
  try {
    if (on) sessionStorage.setItem(DARK_KEY, '1')
    else sessionStorage.removeItem(DARK_KEY)
  } catch {
    /* ignore */
  }
}

export function useExploreMode() {
  const [mode] = useState<ExploreMode | null>(() => readStoredMode() ?? 'mouse')
  const [overrides, setOverrides] = useState<Partial<Omit<A11yState, 'mode'>>>(
    () => (readStoredDark() ? { darkMode: true } : {}),
  )

  const toggle = useCallback((key: A11yToggleKey) => {
    setOverrides((prev) => {
      const current = featuresForMode(mode ?? 'mouse')
      const merged = { ...current, ...prev }
      const next = !merged[key]
      const patch: Partial<Omit<A11yState, 'mode'>> = { [key]: next }

      if (key === 'darkMode') {
        writeStoredDark(next)
        if (next) patch.highContrast = false
      }
      if (key === 'highContrast' && next) {
        patch.darkMode = false
        writeStoredDark(false)
      }

      return { ...prev, ...patch }
    })
  }, [mode])

  const setColorFilter = useCallback((colorFilter: ColorFilter) => {
    setOverrides((prev) => ({ ...prev, colorFilter }))
  }, [])

  const setTextScale = useCallback((value: number) => {
    setOverrides((prev) => ({ ...prev, textScale: clampTextScale(value) }))
  }, [])

  const setFontFamily = useCallback((fontFamily: FontFamily) => {
    setOverrides((prev) => ({ ...prev, fontFamily }))
  }, [])

  const setCursorSize = useCallback((cursorSize: CursorSize) => {
    setOverrides((prev) => ({ ...prev, cursorSize }))
  }, [])

  const state: A11yState = useMemo(() => {
    if (!mode) {
      return {
        mode: null,
        narrator: false,
        colorFilter: 'none',
        headControl: false,
        dwellCursor: false,
        voiceAccess: false,
        highContrast: false,
        darkMode: false,
        reducedMotion: false,
        textScale: TEXT_SCALE_DEFAULT,
        fontFamily: 'default',
        cursorSize: 'default',
        keyboardOnly: false,
        ...overrides,
      }
    }
    return {
      mode,
      ...featuresForMode(mode),
      ...overrides,
    }
  }, [mode, overrides])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.explore = mode ?? 'gate'
    root.classList.toggle('a11y-hc', state.highContrast)
    root.classList.toggle('a11y-dark', state.darkMode && !state.highContrast)
    root.classList.toggle('a11y-large', state.textScale > TEXT_SCALE_DEFAULT)
    root.classList.toggle('a11y-head', state.headControl)
    root.classList.toggle('a11y-motion-off', state.reducedMotion)
    root.classList.toggle('a11y-keyboard', state.keyboardOnly)
    root.dataset.colorFilter = state.colorFilter
    root.dataset.font = state.fontFamily
    root.style.setProperty(
      '--cursor-scale',
      String(CURSOR_SCALE[state.cursorSize]),
    )

    // Head control needs oversized targets — boost beyond the text-size slider.
    const scale = state.headControl
      ? Math.max(state.textScale / 100 * 1.28, 1.55)
      : state.textScale / 100
    root.style.setProperty('--text-scale', String(scale))
    if (state.headControl) {
      root.style.setProperty('--dock-h', '96px')
    } else {
      root.style.removeProperty('--dock-h')
    }
    root.style.colorScheme = state.darkMode && !state.highContrast ? 'dark' : 'light'
    return () => {
      delete root.dataset.explore
      root.classList.remove(
        'a11y-hc',
        'a11y-dark',
        'a11y-large',
        'a11y-head',
        'a11y-motion-off',
        'a11y-keyboard',
      )
      delete root.dataset.colorFilter
      delete root.dataset.font
      root.style.removeProperty('--text-scale')
      root.style.removeProperty('--cursor-scale')
      root.style.removeProperty('--dock-h')
      root.style.colorScheme = ''
    }
  }, [mode, state])

  return {
    mode,
    state,
    ready: mode !== null,
    toggle,
    setColorFilter,
    setTextScale,
    setFontFamily,
    setCursorSize,
  }
}
