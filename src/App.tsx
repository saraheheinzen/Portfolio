import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { about } from './data/content'
import {
  useDesktop,
  type DesktopWindow,
} from './hooks/useDesktop'
import {
  useExploreMode,
  type A11yToggleKey,
  type ColorFilter,
  type FontFamily,
} from './hooks/useExploreMode'
import { AeroWindow } from './components/AeroWindow'
import { MediaPlayerView } from './components/MediaPlayerView'
import { GamesView } from './components/GamesView'
import { BrowserView } from './components/BrowserView'
import { ProjectView } from './components/ProjectView'
import { AboutView } from './components/AboutView'
import { ContactView } from './components/ContactView'
import {
  WelcomeView,
  SCREEN_READER_PLACES,
  type ScreenReaderPlaceAction,
} from './components/WelcomeView'
import { TerminalView } from './components/TerminalView'
import { DocumentsView } from './components/DocumentsView'
import { DocumentView } from './components/DocumentView'
import { PhotosView } from './components/PhotosView'
import { PhotoView } from './components/PhotoView'
import { FigmaView } from './components/FigmaView'
import { Taskbar } from './components/Taskbar'
import { Magnifier } from './components/Magnifier'
import { AccessibilityLayer } from './components/AccessibilityLayer'
import { ClippyAgent } from './components/ClippyAgent'
import { AchievementToast } from './components/AchievementToast'
import { useFeatureExploration } from './hooks/useFeatureExploration'
import { useStickyChecklist } from './hooks/useStickyChecklist'
import { useIsMobile } from './hooks/useIsMobile'
import { MobileHomeGrid } from './components/MobileHomeGrid'
import type { AppAction } from './data/apps'
import type { ClippyAction } from './data/clippyKnowledge'
import type { DidYouKnowId } from './data/didYouKnow'
import type { VoiceAction } from './lib/voiceCommands'
import type { ThrowDirection } from './hooks/useFinnleyBall'
import type { ProjectCategory } from './data/content'
import { findPhoto, resolvePhotoSrc } from './data/photos'
import './win7.css'

function tipForA11yToggle(key: A11yToggleKey): DidYouKnowId | null {
  switch (key) {
    case 'headControl':
      return 'head'
    case 'voiceAccess':
      return 'voice'
    case 'keyboardOnly':
      return 'keyboard'
    case 'narrator':
      return 'narrator'
    case 'highContrast':
      return 'contrast'
    case 'dwellCursor':
      return 'dwell'
    default:
      return null
  }
}

/** Map an open window to its desktop-icon tab id (narrator mode). */
function deskIconForWindow(win: DesktopWindow): string | null {
  switch (win.kind) {
    case 'browser':
      return 'desk-browser'
    case 'about':
      return 'desk-about'
    case 'contact':
      return 'desk-contact'
    case 'welcome':
      return 'desk-welcome'
    case 'terminal':
      return 'desk-terminal'
    case 'documents':
      return 'desk-documents'
    case 'document':
      return 'desk-documents'
    case 'photos':
      return 'desk-photos'
    case 'photo':
      return 'desk-photos'
    case 'figma':
      return 'desk-figma'
    case 'folder':
      if (win.category === 'games') return 'desk-games'
      if (win.category === 'player') return 'desk-player'
      return null
    case 'project':
      return 'desk-browser'
    default:
      return null
  }
}

export default function App() {
  const desk = useDesktop()
  const explore = useExploreMode()
  const isMobile = useIsMobile()
  const {
    record: recordFeature,
    showAchievement,
    achievementKey,
    dismissAchievement,
  } = useFeatureExploration()
  const {
    checked: stickyChecked,
    markDone: markChecklistDone,
    toggle: toggleChecklist,
  } = useStickyChecklist()
  const [magnifierActive, setMagnifierActive] = useState(false)
  const [photosHighContrast, setPhotosHighContrast] = useState(false)
  const [dykTip, setDykTip] = useState<DidYouKnowId | null>(null)
  const [dykKey] = useState(0)
  const throwBallRef = useRef<(direction?: ThrowDirection) => void>(() => {})

  // Did You Know tips are hidden for now — flip this back on to re-enable.
  const showDidYouKnow = useCallback((_id: DidYouKnowId | null) => {}, [])

  const dismissDidYouKnow = useCallback(() => {
    setDykTip(null)
  }, [])

  const openBrowser = useCallback(
    (route?: string) => {
      recordFeature('app:browser')
      markChecklistDone('browser')
      if (explore.state.narrator) desk.setSelectedIcon('desk-browser')
      desk.openBrowser(route)
    },
    [desk, explore.state.narrator, markChecklistDone, recordFeature],
  )

  const openFolder = useCallback(
    (category: ProjectCategory) => {
      recordFeature(`folder:${category}`)
      if (category === 'games') markChecklistDone('games')
      if (category === 'player') markChecklistDone('player')
      if (explore.state.narrator) {
        if (category === 'games') desk.setSelectedIcon('desk-games')
        else if (category === 'player') desk.setSelectedIcon('desk-player')
        else if (category === 'product' || category === 'prototyping') {
          desk.setSelectedIcon('desk-browser')
        }
      }
      desk.openFolder(category)
    },
    [desk, explore.state.narrator, markChecklistDone, recordFeature],
  )

  const openProject = useCallback(
    (projectId: string) => {
      recordFeature(`project:${projectId}`)
      markChecklistDone('case-study')
      if (explore.state.narrator) desk.setSelectedIcon('desk-browser')
      desk.openProject(projectId)
    },
    [desk, explore.state.narrator, markChecklistDone, recordFeature],
  )

  const openAbout = useCallback(() => {
    recordFeature('app:about')
    if (explore.state.narrator) desk.setSelectedIcon('desk-about')
    desk.openAbout()
  }, [desk, explore.state.narrator, recordFeature])

  const openContact = useCallback(() => {
    recordFeature('app:contact')
    markChecklistDone('contact')
    if (explore.state.narrator) desk.setSelectedIcon('desk-contact')
    desk.openContact()
  }, [desk, explore.state.narrator, markChecklistDone, recordFeature])

  const openWelcome = useCallback(() => {
    recordFeature('app:welcome')
    if (explore.state.narrator) {
      // Sticky intro is part of About Me in screen reader mode.
      desk.setSelectedIcon('desk-about')
      desk.openAbout()
      return
    }
    desk.openWelcome()
  }, [desk, explore.state.narrator, recordFeature])

  const openTerminal = useCallback(() => {
    recordFeature('app:terminal')
    if (explore.state.narrator) desk.setSelectedIcon('desk-terminal')
    desk.openTerminal()
  }, [desk, explore.state.narrator, recordFeature])

  const openDocuments = useCallback(() => {
    recordFeature('app:documents')
    if (explore.state.narrator) desk.setSelectedIcon('desk-documents')
    desk.openDocuments()
  }, [desk, explore.state.narrator, recordFeature])

  const openDocument = useCallback(
    (docId: string, title: string, href: string) => {
      recordFeature(`document:${docId}`)
      if (explore.state.narrator) desk.setSelectedIcon('desk-documents')
      desk.openDocument(docId, title, href)
    },
    [desk, explore.state.narrator, recordFeature],
  )

  const openPhotos = useCallback(() => {
    recordFeature('app:photos')
    if (explore.state.narrator) desk.setSelectedIcon('desk-photos')
    desk.openPhotos()
  }, [desk, explore.state.narrator, recordFeature])

  const openPhoto = useCallback(
    (photoId: string, title: string, _src: string) => {
      recordFeature(`photo:${photoId}`)
      if (explore.state.narrator) desk.setSelectedIcon('desk-photos')
      // Store photo id (not URL) so high-contrast swaps update open viewers.
      desk.openPhoto(photoId, title, photoId)
    },
    [desk, explore.state.narrator, recordFeature],
  )

  const openFigma = useCallback(() => {
    recordFeature('app:figma')
    if (explore.state.narrator) desk.setSelectedIcon('desk-figma')
    desk.openFigma()
  }, [desk, explore.state.narrator, recordFeature])

  const openScreenReaderPlace = useCallback(
    (action: ScreenReaderPlaceAction) => {
      switch (action) {
        case 'about':
          openAbout()
          break
        case 'browser':
          openBrowser()
          break
        case 'player':
          openFolder('player')
          break
        case 'games':
          openFolder('games')
          break
        case 'documents':
          openDocuments()
          break
        case 'photos':
          openPhotos()
          break
        case 'figma':
          openFigma()
          break
        case 'contact':
          openContact()
          break
        case 'terminal':
          openTerminal()
          break
      }
    },
    [
      openAbout,
      openBrowser,
      openContact,
      openDocuments,
      openFigma,
      openFolder,
      openPhotos,
      openTerminal,
    ],
  )

  const openMobileApp = useCallback(
    (action: AppAction) => {
      // One app on screen at a time, like a phone.
      desk.minimizeAll()
      switch (action) {
        case 'about':
          openAbout()
          break
        case 'browser':
          openBrowser()
          break
        case 'games':
          openFolder('games')
          break
        case 'player':
          openFolder('player')
          break
        case 'contact':
          openContact()
          break
        case 'welcome':
          openWelcome()
          break
        case 'terminal':
          openTerminal()
          break
        case 'documents':
          openDocuments()
          break
        case 'photos':
          openPhotos()
          break
        case 'figma':
          openFigma()
          break
      }
    },
    [
      desk,
      openAbout,
      openBrowser,
      openContact,
      openDocuments,
      openFigma,
      openFolder,
      openPhotos,
      openTerminal,
      openWelcome,
    ],
  )

  useEffect(() => {
    if (!explore.state.narrator) return
    // Screen reader mode starts on About Me (sticky intro is inside that view).
    desk.closeWindow('welcome')
    desk.openAbout()
    desk.setSelectedIcon('desk-about')
    // Only sync when narrator turns on — don't fight tab selection afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot when narrator enables
  }, [explore.state.narrator])

  useEffect(() => {
    if (!explore.state.narrator) return
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      const place = SCREEN_READER_PLACES.find((p) => p.key === e.key)
      if (!place) return
      e.preventDefault()
      openScreenReaderPlace(place.action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [explore.state.narrator, openScreenReaderPlace])

  const narratorTab = explore.state.narrator ? desk.selectedIcon : null

  const visibleWindows = useMemo(() => {
    if (!explore.state.narrator || !narratorTab) return desk.windows
    const matched = desk.windows.filter(
      (w) => !w.minimized && deskIconForWindow(w) === narratorTab,
    )
    if (matched.length) return matched
    // Tab selected but app not open yet — wait for open handler.
    return []
  }, [desk.windows, explore.state.narrator, narratorTab])

  const visibleTopZ = Math.max(0, ...visibleWindows.map((w) => w.zIndex))

  useEffect(() => {
    if (!explore.ready || explore.state.mode !== 'keyboard') return
    desk.setStartOpen(true)
  }, [explore.ready, explore.state.mode, desk.setStartOpen])

  useEffect(() => {
    if (!magnifierActive) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMagnifierActive(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [magnifierActive])

  const toggleA11y = useCallback(
    (key: A11yToggleKey) => {
      const turningOn = !explore.state[key]
      explore.toggle(key)
      if (turningOn) {
        recordFeature(`a11y:${key}`)
        markChecklistDone('a11y')
        showDidYouKnow(tipForA11yToggle(key))
      }
    },
    [explore, markChecklistDone, recordFeature, showDidYouKnow],
  )

  const setColorFilter = useCallback(
    (filter: ColorFilter) => {
      const wasNone = explore.state.colorFilter === 'none'
      explore.setColorFilter(filter)
      if (wasNone && filter !== 'none') {
        recordFeature('a11y:colorFilter')
        showDidYouKnow('contrast')
      }
    },
    [explore, recordFeature, showDidYouKnow],
  )

  const setFontFamily = useCallback(
    (font: FontFamily) => {
      const wasDefault = explore.state.fontFamily === 'default'
      explore.setFontFamily(font)
      if (wasDefault && font !== 'default') {
        recordFeature('a11y:fontFamily')
        showDidYouKnow('font')
      }
    },
    [explore, recordFeature, showDidYouKnow],
  )

  const toggleMagnifier = useCallback(() => {
    setMagnifierActive((v) => {
      const next = !v
      if (next) {
        recordFeature('a11y:magnifier')
        showDidYouKnow('magnifier')
      }
      return next
    })
  }, [recordFeature, showDidYouKnow])

  const runClippyAction = (action: ClippyAction) => {
    recordFeature('clippy')
    switch (action.type) {
      case 'openAbout':
        openAbout()
        break
      case 'openContact':
        openContact()
        break
      case 'openFeatured':
        openBrowser('featured')
        break
      case 'openBrowser':
        openBrowser(action.projectId)
        break
      case 'openWelcome':
        openWelcome()
        break
      case 'openTerminal':
        openTerminal()
        break
      case 'openFolder':
        openFolder(action.category)
        break
      case 'openProject':
        openProject(action.projectId)
        break
    }
  }

  const runVoiceAction = useCallback(
    (action: VoiceAction) => {
      switch (action.type) {
        case 'openFolder':
          openFolder(action.category)
          break
        case 'openBrowser':
          openBrowser()
          break
        case 'openAbout':
          openAbout()
          break
        case 'openContact':
          openContact()
          break
        case 'openWelcome':
          openWelcome()
          break
        case 'openTerminal':
          openTerminal()
          break
        case 'openStart':
          recordFeature('dock:start')
          desk.setStartOpen(true)
          break
        case 'focusDock': {
          const dock = document.querySelector(
            '.dock__launcher, .dock button',
          ) as HTMLElement | null
          dock?.focus({ preventScroll: false })
          dock?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          break
        }
        case 'setMagnifier':
          setMagnifierActive(action.on)
          if (action.on) {
            recordFeature('a11y:magnifier')
            showDidYouKnow('magnifier')
          }
          break
        case 'toggleA11y': {
          const turningOn = !explore.state[action.key]
          explore.toggle(action.key)
          if (turningOn) {
            recordFeature(`a11y:${action.key}`)
            showDidYouKnow(tipForA11yToggle(action.key))
          }
          break
        }
        case 'closeWindow': {
          const focused = desk.windows
            .filter((w) => !w.minimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0]
          if (focused) desk.closeWindow(focused.id)
          break
        }
        case 'throwBall':
          throwBallRef.current(action.direction ?? 'right')
          recordFeature('clippy')
          break
        case 'help':
          break
      }
    },
    [
      desk,
      explore,
      openAbout,
      openBrowser,
      openContact,
      openFolder,
      openTerminal,
      openWelcome,
      recordFeature,
      showDidYouKnow,
    ],
  )

  const showMobileHome =
    isMobile && desk.windows.every((w) => w.minimized)

  const desktopClass = [
    'desktop',
    !explore.ready ? 'is-gate' : '',
    isMobile ? 'is-mobile' : '',
    showMobileHome ? 'is-mobile-home' : '',
    magnifierActive ? 'is-magnifying' : '',
    explore.state.highContrast ? 'is-hc' : '',
    explore.state.darkMode && !explore.state.highContrast ? 'is-dark' : '',
    explore.state.reducedMotion ? 'is-reduced-motion' : '',
    explore.state.keyboardOnly ? 'is-keyboard' : '',
    explore.state.narrator ? 'is-narrator' : '',
    explore.state.headControl || explore.state.dwellCursor ? 'is-head' : '',
    explore.state.cursorSize !== 'default' &&
    !explore.state.headControl &&
    !explore.state.dwellCursor
      ? 'is-large-cursor'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={desktopClass}
      onClick={() => {
        if (!explore.ready) return
        if (!explore.state.narrator) desk.setSelectedIcon(null)
        desk.setStartOpen(false)
      }}
    >
      <a className="skip-link" href="#desktop-main">
        Skip to desktop
      </a>

      <div
        id="desktop-main"
        className="desktop__world"
        aria-hidden={!explore.ready}
      >
        <header className="desktop-brand" aria-label="Site identity">
          <div className="desktop-brand__text">
            <p className="desktop-brand__name">{about.name}</p>
            <p className="desktop-brand__title">{about.title}</p>
          </div>
        </header>

        {showMobileHome ? <MobileHomeGrid onOpen={openMobileApp} /> : null}

        {visibleWindows.map((win) => (
          <AeroWindow
            key={win.id}
            win={win}
            focused={
              explore.ready && win.zIndex === visibleTopZ && !win.minimized
            }
            linear={explore.state.narrator}
            onFocus={() => desk.focusWindow(win.id)}
            onClose={() => desk.closeWindow(win.id)}
            onMinimize={() => desk.minimizeWindow(win.id)}
            onToggleMaximize={() => desk.toggleMaximize(win.id)}
            onMove={(x, y) => desk.moveWindow(win.id, x, y)}
            onResize={(next) => desk.resizeWindow(win.id, next)}
          >
            {win.kind === 'folder' && win.category === 'player' ? (
              <MediaPlayerView onOpenProject={openProject} />
            ) : null}
            {win.kind === 'folder' && win.category === 'games' ? (
              <GamesView onOpenProject={openProject} />
            ) : null}
            {win.kind === 'browser' ? (
              <BrowserView
                route={win.projectId}
                onNavigate={openBrowser}
                stacked={explore.state.narrator}
              />
            ) : null}
            {win.kind === 'project' && win.projectId ? (
              <ProjectView projectId={win.projectId} />
            ) : null}
            {win.kind === 'about' ? (
              explore.state.narrator ? (
                <div className="about-stack">
                  <WelcomeView
                    variant="screenReader"
                    onOpenAbout={openAbout}
                    onOpenBrowser={(route) => openBrowser(route)}
                    onOpenPlace={openScreenReaderPlace}
                  />
                  <AboutView />
                </div>
              ) : (
                <AboutView />
              )
            ) : null}
            {win.kind === 'contact' ? (
              <ContactView linear={explore.state.narrator} />
            ) : null}
            {win.kind === 'welcome' ? (
              <WelcomeView
                onOpenAbout={openAbout}
                onOpenBrowser={(route) => openBrowser(route)}
                checked={stickyChecked}
                onToggleChecklist={toggleChecklist}
              />
            ) : null}
            {win.kind === 'terminal' ? (
              <TerminalView
                reducedMotion={explore.state.reducedMotion}
                onAction={(action) => {
                  switch (action.type) {
                    case 'openAbout':
                      openAbout()
                      break
                    case 'openBrowser':
                      openBrowser()
                      break
                    case 'openGames':
                      openFolder('games')
                      break
                    case 'openContact':
                      openContact()
                      break
                    case 'openDocuments':
                      openDocuments()
                      break
                    case 'openPhotos':
                      openPhotos()
                      break
                    case 'openFigma':
                      openFigma()
                      break
                  }
                }}
              />
            ) : null}
            {win.kind === 'documents' ? (
              <DocumentsView onOpenDocument={openDocument} />
            ) : null}
            {win.kind === 'document' && win.projectId ? (
              <DocumentView href={win.projectId} title={win.title} />
            ) : null}
            {win.kind === 'photos' ? (
              <PhotosView
                highContrast={photosHighContrast}
                onHighContrastChange={setPhotosHighContrast}
                onOpenPhoto={openPhoto}
              />
            ) : null}
            {win.kind === 'photo' && win.projectId ? (
              <PhotoView
                src={resolvePhotoSrc(win.projectId, photosHighContrast)}
                title={win.title}
                alt={findPhoto(win.projectId)?.alt ?? win.title}
              />
            ) : null}
            {win.kind === 'figma' ? <FigmaView /> : null}
          </AeroWindow>
        ))}
      </div>

      {explore.ready ? (
        <>
          <Magnifier
            active={magnifierActive}
            onClose={() => setMagnifierActive(false)}
          />
          <AccessibilityLayer
            state={explore.state}
            onVoiceAction={runVoiceAction}
            onDisableHeadControl={() => {
              if (explore.state.headControl) explore.toggle('headControl')
            }}
          />
          <ClippyAgent
            onAction={runClippyAction}
            onOpen={() => {
              recordFeature('clippy')
              markChecklistDone('clippy')
            }}
            reducedMotion={explore.state.reducedMotion}
            registerThrowBall={(fn) => {
              throwBallRef.current = fn
            }}
            didYouKnowId={dykTip}
            didYouKnowKey={dykKey}
            onDismissDidYouKnow={dismissDidYouKnow}
          />
          <AchievementToast
            visible={showAchievement}
            unlockKey={achievementKey}
            reducedMotion={explore.state.reducedMotion}
            onDismiss={dismissAchievement}
          />
          <Taskbar
            windows={desk.windows}
            startOpen={desk.startOpen}
            magnifierActive={magnifierActive}
            a11y={explore.state}
            onToggleStart={() => {
              if (!desk.startOpen) recordFeature('dock:start')
              desk.setStartOpen((v) => !v)
            }}
            onToggleMagnifier={toggleMagnifier}
            onFocusWindow={desk.focusWindow}
            onMinimizeWindow={desk.minimizeWindow}
            onOpenAbout={openAbout}
            onOpenContact={openContact}
            onOpenBrowser={openBrowser}
            onOpenTerminal={openTerminal}
            onOpenWelcome={openWelcome}
            onOpenDocuments={openDocuments}
            onOpenPhotos={openPhotos}
            onOpenFigma={openFigma}
            onOpenFolder={openFolder}
            onToggleA11y={toggleA11y}
            onColorFilter={setColorFilter}
            onTextScale={explore.setTextScale}
            onFontFamily={setFontFamily}
            onCursorSize={explore.setCursorSize}
          />
        </>
      ) : null}
    </div>
  )
}
