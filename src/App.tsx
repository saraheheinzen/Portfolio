import { useCallback, useEffect, useMemo, useState } from 'react'
import { about } from './data/content'
import {
  useDesktop,
  type DesktopWindow,
} from './hooks/useDesktop'
import {
  useExploreMode,
  type A11yState,
  type ColorFilter,
  type ExploreMode,
} from './hooks/useExploreMode'
import { AeroWindow } from './components/AeroWindow'
import { DesktopIcon } from './components/DesktopIcon'
import { YouTubeView } from './components/YouTubeView'
import { GamesView } from './components/GamesView'
import { BrowserView } from './components/BrowserView'
import { ProjectView } from './components/ProjectView'
import { AboutView } from './components/AboutView'
import { ContactView } from './components/ContactView'
import { WelcomeView } from './components/WelcomeView'
import { TerminalView } from './components/TerminalView'
import { Taskbar } from './components/Taskbar'
import { Magnifier } from './components/Magnifier'
import { ExploreGate } from './components/ExploreGate'
import { AccessibilityLayer } from './components/AccessibilityLayer'
import { ClippyAgent } from './components/ClippyAgent'
import { DidYouKnowToast } from './components/DidYouKnowToast'
import { AchievementToast } from './components/AchievementToast'
import { useFeatureExploration } from './hooks/useFeatureExploration'
import type { ClippyAction } from './data/clippyKnowledge'
import type { DidYouKnowId } from './data/didYouKnow'
import type { VoiceAction } from './lib/voiceCommands'
import type { ProjectCategory } from './data/content'
import './win7.css'

function tipForExploreMode(mode: ExploreMode): DidYouKnowId | null {
  switch (mode) {
    case 'head':
      return 'head'
    case 'voice':
      return 'voice'
    case 'keyboard':
      return 'keyboard'
    case 'screenReader':
      return 'narrator'
    case 'highContrast':
      return 'contrast'
    default:
      return null
  }
}

function tipForA11yToggle(
  key: keyof Omit<A11yState, 'mode' | 'colorFilter' | 'textScale'>,
): DidYouKnowId | null {
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
    case 'folder':
      if (win.category === 'games') return 'desk-games'
      if (win.category === 'youtube') return 'desk-youtube'
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
  const {
    record: recordFeature,
    showAchievement,
    achievementKey,
    dismissAchievement,
  } = useFeatureExploration()
  const [magnifierActive, setMagnifierActive] = useState(false)
  const [dykTip, setDykTip] = useState<DidYouKnowId | null>(null)
  const [dykKey, setDykKey] = useState(0)

  const showDidYouKnow = useCallback((id: DidYouKnowId | null) => {
    if (!id) return
    setDykTip(id)
    setDykKey((k) => k + 1)
  }, [])

  const dismissDidYouKnow = useCallback(() => {
    setDykTip(null)
  }, [])

  const openBrowser = useCallback(
    (route?: string) => {
      recordFeature('app:browser')
      if (explore.state.narrator) desk.setSelectedIcon('desk-browser')
      desk.openBrowser(route)
    },
    [desk, explore.state.narrator, recordFeature],
  )

  const openFolder = useCallback(
    (category: ProjectCategory) => {
      recordFeature(`folder:${category}`)
      if (explore.state.narrator) {
        if (category === 'games') desk.setSelectedIcon('desk-games')
        else if (category === 'youtube') desk.setSelectedIcon('desk-youtube')
        else if (category === 'product' || category === 'prototyping') {
          desk.setSelectedIcon('desk-browser')
        }
      }
      desk.openFolder(category)
    },
    [desk, explore.state.narrator, recordFeature],
  )

  const openProject = useCallback(
    (projectId: string) => {
      recordFeature(`project:${projectId}`)
      if (explore.state.narrator) desk.setSelectedIcon('desk-browser')
      desk.openProject(projectId)
    },
    [desk, explore.state.narrator, recordFeature],
  )

  const openAbout = useCallback(() => {
    recordFeature('app:about')
    if (explore.state.narrator) desk.setSelectedIcon('desk-about')
    desk.openAbout()
  }, [desk, explore.state.narrator, recordFeature])

  const openContact = useCallback(() => {
    recordFeature('app:contact')
    if (explore.state.narrator) desk.setSelectedIcon('desk-contact')
    desk.openContact()
  }, [desk, explore.state.narrator, recordFeature])

  const openWelcome = useCallback(() => {
    recordFeature('app:welcome')
    if (explore.state.narrator) desk.setSelectedIcon('desk-welcome')
    desk.openWelcome()
  }, [desk, explore.state.narrator, recordFeature])

  const openTerminal = useCallback(() => {
    recordFeature('app:terminal')
    if (explore.state.narrator) desk.setSelectedIcon('desk-terminal')
    desk.openTerminal()
  }, [desk, explore.state.narrator, recordFeature])

  useEffect(() => {
    if (!explore.state.narrator) return
    const top = [...desk.windows]
      .filter((w) => !w.minimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0]
    const iconId = top ? deskIconForWindow(top) : null
    if (iconId) desk.setSelectedIcon(iconId)
    // Only sync when narrator turns on — don't fight tab selection afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot when narrator enables
  }, [explore.state.narrator])

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
    if (!magnifierActive) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMagnifierActive(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [magnifierActive])

  const chooseMode = useCallback(
    (mode: ExploreMode) => {
      recordFeature(`explore:${mode}`)
      explore.chooseMode(mode)
      showDidYouKnow(tipForExploreMode(mode))
    },
    [explore, recordFeature, showDidYouKnow],
  )

  const toggleA11y = useCallback(
    (key: keyof Omit<A11yState, 'mode' | 'colorFilter' | 'textScale'>) => {
      const turningOn = !explore.state[key]
      explore.toggle(key)
      if (turningOn) {
        recordFeature(`a11y:${key}`)
        showDidYouKnow(tipForA11yToggle(key))
      }
    },
    [explore, recordFeature, showDidYouKnow],
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

  const desktopIcons = [
    {
      id: 'desk-about',
      label: 'About Me',
      icon: 'user' as const,
      onOpen: openAbout,
    },
    {
      id: 'desk-browser',
      label: 'Browser',
      icon: 'browser' as const,
      onOpen: () => openBrowser(),
    },
    {
      id: 'desk-youtube',
      label: 'YouTube',
      icon: 'youtube' as const,
      onOpen: () => openFolder('youtube'),
    },
    {
      id: 'desk-games',
      label: 'Games',
      icon: 'steam' as const,
      onOpen: () => openFolder('games'),
    },
    {
      id: 'desk-contact',
      label: 'Contact',
      icon: 'mail' as const,
      onOpen: openContact,
    },
    {
      id: 'desk-welcome',
      label: 'Sticky',
      icon: 'notepad' as const,
      onOpen: openWelcome,
    },
    {
      id: 'desk-terminal',
      label: 'Terminal',
      icon: 'terminal' as const,
      onOpen: openTerminal,
    },
  ]

  const desktopClass = [
    'desktop',
    !explore.ready ? 'is-gate' : '',
    magnifierActive ? 'is-magnifying' : '',
    explore.state.highContrast ? 'is-hc' : '',
    explore.state.darkMode && !explore.state.highContrast ? 'is-dark' : '',
    explore.state.reducedMotion ? 'is-reduced-motion' : '',
    explore.state.keyboardOnly ? 'is-keyboard' : '',
    explore.state.narrator ? 'is-narrator' : '',
    explore.state.headControl || explore.state.dwellCursor ? 'is-head' : '',
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

      <div className="desktop__world" aria-hidden={!explore.ready}>
        <header className="desktop-brand" aria-label="Site identity">
          <div className="desktop-brand__text">
            <p className="desktop-brand__name">{about.name}</p>
            <p className="desktop-brand__title">{about.title}</p>
          </div>
          <div className="desktop-brand__mark" aria-hidden="true" />
        </header>

        <main
          id="desktop-main"
          className="desktop-icons"
          aria-label={explore.state.narrator ? 'Apps' : 'Desktop'}
          role={explore.state.narrator ? 'tablist' : undefined}
        >
          {desktopIcons.map((icon) => (
            <DesktopIcon
              key={icon.id}
              id={icon.id}
              label={icon.label}
              icon={icon.icon}
              selected={
                explore.state.narrator
                  ? narratorTab === icon.id
                  : desk.selectedIcon === icon.id
              }
              asTab={explore.state.narrator}
              onSelect={() => desk.setSelectedIcon(icon.id)}
              onOpen={icon.onOpen}
            />
          ))}
        </main>

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
            {win.kind === 'folder' && win.category === 'youtube' ? (
              <YouTubeView onOpenProject={openProject} />
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
            {win.kind === 'about' ? <AboutView /> : null}
            {win.kind === 'contact' ? <ContactView /> : null}
            {win.kind === 'welcome' ? (
              <WelcomeView
                onOpenAbout={openAbout}
                onOpenBrowser={() => openBrowser()}
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
                  }
                }}
              />
            ) : null}
          </AeroWindow>
        ))}
      </div>

      {explore.ready ? (
        <>
          <Magnifier active={magnifierActive} />
          <AccessibilityLayer
            state={explore.state}
            onVoiceAction={runVoiceAction}
            onDisableHeadControl={() => {
              if (explore.state.headControl) explore.toggle('headControl')
            }}
          />
          <ClippyAgent
            onAction={runClippyAction}
            onOpen={() => recordFeature('clippy')}
          />
          <DidYouKnowToast
            tipId={dykTip}
            tipKey={dykKey}
            reducedMotion={explore.state.reducedMotion}
            onDismiss={dismissDidYouKnow}
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
            onOpenAbout={openAbout}
            onOpenContact={openContact}
            onOpenBrowser={openBrowser}
            onOpenTerminal={openTerminal}
            onOpenWelcome={openWelcome}
            onOpenFolder={openFolder}
            onToggleA11y={toggleA11y}
            onColorFilter={setColorFilter}
            onTextScale={explore.setTextScale}
            onChangeExplore={explore.resetExplore}
          />
        </>
      ) : (
        <ExploreGate onChoose={chooseMode} />
      )}
    </div>
  )
}
