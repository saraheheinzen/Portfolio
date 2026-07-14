import { useCallback, useState } from 'react'
import {
  BROWSER_DEFAULT_SECTION,
  browserSectionForProject,
  browserWindowTitle,
  encodeBrowserRoute,
  isBrowserProject,
  resolveBrowserRoute,
} from '../data/browser'
import {
  categories,
  getProject,
  type ProjectCategory,
} from '../data/content'

export type WindowKind =
  | 'folder'
  | 'project'
  | 'about'
  | 'contact'
  | 'welcome'
  | 'browser'
  | 'terminal'

export interface DesktopWindow {
  id: string
  kind: WindowKind
  title: string
  category?: ProjectCategory
  projectId?: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  minimized: boolean
  maximized: boolean
}

let zCounter = 10
let offset = 0

function nextPosition(width: number, height: number) {
  offset = (offset + 28) % 140
  const pad = 24
  const maxX = Math.max(pad, window.innerWidth - width - pad)
  const maxY = Math.max(pad, window.innerHeight - height - 56)
  return {
    x: Math.min(pad + offset, maxX),
    y: Math.min(pad + offset, maxY),
  }
}

function folderWindowId(category: ProjectCategory) {
  return `folder-${category}`
}

function projectWindowId(projectId: string) {
  return `project-${projectId}`
}

const sizes: Record<WindowKind, { width: number; height: number }> = {
  folder: { width: 560, height: 420 },
  project: { width: 980, height: 640 },
  about: { width: 680, height: 740 },
  contact: { width: 960, height: 620 },
  welcome: { width: 300, height: 420 },
  browser: { width: 1040, height: 700 },
  terminal: { width: 560, height: 480 },
}

const DOCK_H = 72
const ICON_COL = 118

type OpenPartial = Omit<
  DesktopWindow,
  'zIndex' | 'minimized' | 'maximized' | 'x' | 'y' | 'width' | 'height'
> &
  Partial<Pick<DesktopWindow, 'width' | 'height' | 'projectId' | 'title'>>

/** Initial overlapping desktop composition (Browser behind, Welcome in front). */
function createLaunchWindows(): DesktopWindow[] {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  const browserW = Math.min(
    sizes.browser.width,
    Math.max(720, Math.round(vw * 0.62)),
  )
  const browserH = Math.min(
    sizes.browser.height,
    Math.max(500, Math.round(vh * 0.72)),
  )
  const welcomeW = sizes.welcome.width
  const welcomeH = sizes.welcome.height

  const browserX = Math.min(
    Math.max(ICON_COL, Math.round(vw * 0.12)),
    Math.max(ICON_COL, vw - browserW - 32),
  )
  const browserY = Math.min(
    Math.max(52, Math.round(vh * 0.07)),
    Math.max(52, vh - browserH - DOCK_H - 28),
  )

  const welcomeX = Math.min(
    Math.max(
      browserX + Math.round(browserW * 0.28),
      Math.round(vw * 0.36),
    ),
    Math.max(browserX + 80, vw - welcomeW - 28),
  )
  const welcomeY = Math.min(
    Math.max(browserY + 48, Math.round(vh * 0.14)),
    Math.max(browserY + 24, vh - welcomeH - DOCK_H - 28),
  )

  const zBrowser = ++zCounter
  const zWelcome = ++zCounter

  return [
    {
      id: 'welcome',
      kind: 'welcome',
      title: 'Sticky note',
      x: welcomeX,
      y: welcomeY,
      width: welcomeW,
      height: welcomeH,
      zIndex: zWelcome,
      minimized: false,
      maximized: false,
    },
    {
      id: 'browser',
      kind: 'browser',
      title: browserWindowTitle(BROWSER_DEFAULT_SECTION),
      projectId: BROWSER_DEFAULT_SECTION,
      x: browserX,
      y: browserY,
      width: browserW,
      height: browserH,
      zIndex: zBrowser,
      minimized: false,
      maximized: false,
    },
  ]
}

export function useDesktop() {
  const [windows, setWindows] = useState<DesktopWindow[]>(createLaunchWindows)
  const [startOpen, setStartOpen] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, zIndex: ++zCounter, minimized: false } : w,
      ),
    )
    setStartOpen(false)
  }, [])

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    )
  }, [])

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized, minimized: false } : w,
      ),
    )
  }, [])

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x, y } : w)),
    )
  }, [])

  const resizeWindow = useCallback(
    (
      id: string,
      next: { x: number; y: number; width: number; height: number },
    ) => {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                x: next.x,
                y: next.y,
                width: next.width,
                height: next.height,
              }
            : w,
        ),
      )
    },
    [],
  )

  const openOrFocus = useCallback((partial: OpenPartial) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === partial.id)
      if (existing) {
        return prev.map((w) =>
          w.id === partial.id
            ? {
                ...w,
                zIndex: ++zCounter,
                minimized: false,
                ...(partial.projectId !== undefined
                  ? { projectId: partial.projectId }
                  : {}),
                ...(partial.title !== undefined ? { title: partial.title } : {}),
                ...(partial.category !== undefined
                  ? { category: partial.category }
                  : {}),
              }
            : w,
        )
      }
      const size = {
        width: partial.width ?? sizes[partial.kind].width,
        height: partial.height ?? sizes[partial.kind].height,
      }
      const pos = nextPosition(size.width, size.height)
      return [
        ...prev,
        {
          ...partial,
          ...size,
          ...pos,
          zIndex: ++zCounter,
          minimized: false,
          maximized: false,
        },
      ]
    })
    setStartOpen(false)
  }, [])

  const openBrowser = useCallback(
    (route?: string) => {
      const resolved = resolveBrowserRoute(route)
      const encoded = encodeBrowserRoute(resolved)

      openOrFocus({
        id: 'browser',
        kind: 'browser',
        title: browserWindowTitle(encoded),
        projectId: encoded,
        width: sizes.browser.width,
        height: sizes.browser.height,
      })
    },
    [openOrFocus],
  )

  const openFolder = useCallback(
    (category: ProjectCategory) => {
      if (category === 'product' || category === 'prototyping') {
        openBrowser('product')
        return
      }

      const isLibraryApp = category === 'youtube' || category === 'games'
      openOrFocus({
        id: folderWindowId(category),
        kind: 'folder',
        title:
          category === 'youtube'
            ? 'YouTube — Library'
            : category === 'games'
              ? 'Steam — Library'
              : `${categories[category].label} - Portfolio`,
        category,
        ...(isLibraryApp ? { width: 960, height: 660 } : {}),
      })
    },
    [openBrowser, openOrFocus],
  )

  const openProject = useCallback(
    (projectId: string) => {
      const project = getProject(projectId)
      if (!project) return

      if (isBrowserProject(projectId)) {
        openBrowser(
          encodeBrowserRoute({
            section: browserSectionForProject(project),
            projectId,
          }),
        )
        return
      }

      openOrFocus({
        id: projectWindowId(projectId),
        kind: 'project',
        title: `${project.title} - Portfolio`,
        projectId,
      })
    },
    [openBrowser, openOrFocus],
  )

  const openAbout = useCallback(() => {
    openOrFocus({
      id: 'about',
      kind: 'about',
      title: 'About Me',
    })
  }, [openOrFocus])

  const openContact = useCallback(() => {
    openOrFocus({
      id: 'contact',
      kind: 'contact',
      title: 'Mail - Inbox',
    })
  }, [openOrFocus])

  const openWelcome = useCallback(() => {
    openOrFocus({
      id: 'welcome',
      kind: 'welcome',
      title: 'Sticky note',
    })
  }, [openOrFocus])

  const openTerminal = useCallback(() => {
    openOrFocus({
      id: 'terminal',
      kind: 'terminal',
      title: 'Terminal — SarahOS',
    })
  }, [openOrFocus])

  return {
    windows,
    startOpen,
    setStartOpen,
    selectedIcon,
    setSelectedIcon,
    focusWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    moveWindow,
    resizeWindow,
    openFolder,
    openBrowser,
    openProject,
    openAbout,
    openContact,
    openWelcome,
    openTerminal,
  }
}