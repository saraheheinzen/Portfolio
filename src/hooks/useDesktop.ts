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
  | 'documents'
  | 'document'
  | 'photos'
  | 'photo'
  | 'figma'

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
  documents: { width: 560, height: 420 },
  document: { width: 860, height: 700 },
  photos: { width: 720, height: 520 },
  photo: { width: 980, height: 700 },
  figma: { width: 1040, height: 700 },
}

const DOCK_H = 72

type OpenPartial = Omit<
  DesktopWindow,
  'zIndex' | 'minimized' | 'maximized' | 'x' | 'y' | 'width' | 'height'
> &
  Partial<Pick<DesktopWindow, 'width' | 'height' | 'projectId' | 'title'>>

/** Initial desktop: Featured Browser left-center, Sticky on the far right over its edge. */
function createLaunchWindows(): DesktopWindow[] {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900

  // Phones land on the app-grid home screen instead of pre-opened windows.
  if (vw <= 720) return []

  const welcomeW = sizes.welcome.width
  const welcomeH = sizes.welcome.height

  // Leave a clear lane on the right so the sticky sits beside the browser, not on the lede.
  const browserW = Math.min(
    sizes.browser.width,
    Math.max(720, Math.round(vw * 0.58)),
  )
  const browserH = Math.min(
    sizes.browser.height,
    Math.max(540, Math.round(vh * 0.78)),
  )

  const browserX = Math.min(
    Math.max(40, Math.round(vw * 0.04)),
    Math.max(40, vw - browserW - welcomeW - 28),
  )
  const browserY = Math.min(
    Math.max(40, Math.round(vh * 0.05)),
    Math.max(40, vh - browserH - DOCK_H - 20),
  )

  // Sticky mostly outside the browser — only ~1/3 overlaps the right edge.
  const welcomeX = Math.min(
    Math.max(
      browserX + browserW - Math.round(welcomeW * 0.32),
      Math.round(vw * 0.74),
    ),
    vw - welcomeW - 18,
  )
  // Sit lower, roughly a fifth of the way down — clear of the name/title.
  const welcomeY = Math.min(
    Math.max(browserY + 160, Math.round(vh * 0.2)),
    Math.max(browserY + 36, vh - welcomeH - DOCK_H - 20),
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

  /** Mobile home screen: back out of every open app at once. */
  const minimizeAll = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: true })))
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

      const isLibraryApp = category === 'player' || category === 'games'
      openOrFocus({
        id: folderWindowId(category),
        kind: 'folder',
        title:
          category === 'player' ? 'Media Player - Library' : 'Steam - Library',
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
      title: 'Terminal - SarahOS',
    })
  }, [openOrFocus])

  const openDocuments = useCallback(() => {
    openOrFocus({
      id: 'documents',
      kind: 'documents',
      title: 'Documents',
    })
  }, [openOrFocus])

  const openDocument = useCallback(
    (docId: string, title: string, href: string) => {
      openOrFocus({
        id: `document-${docId}`,
        kind: 'document',
        title,
        projectId: href,
      })
    },
    [openOrFocus],
  )

  const openPhotos = useCallback(() => {
    openOrFocus({
      id: 'photos',
      kind: 'photos',
      title: 'Photos',
    })
  }, [openOrFocus])

  const openPhoto = useCallback(
    (photoId: string, title: string, src: string) => {
      openOrFocus({
        id: `photo-${photoId}`,
        kind: 'photo',
        title,
        projectId: src,
      })
    },
    [openOrFocus],
  )

  const openFigma = useCallback(() => {
    openOrFocus({
      id: 'figma',
      kind: 'figma',
      title: 'Figma - Design Process',
    })
  }, [openOrFocus])

  const resetLaunchLayout = useCallback(() => {
    setWindows(createLaunchWindows())
  }, [])

  return {
    windows,
    startOpen,
    setStartOpen,
    selectedIcon,
    setSelectedIcon,
    focusWindow,
    closeWindow,
    minimizeWindow,
    minimizeAll,
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
    openDocuments,
    openDocument,
    openPhotos,
    openPhoto,
    openFigma,
    resetLaunchLayout,
  }
}