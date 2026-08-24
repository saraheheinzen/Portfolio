import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CURSOR_SCALE,
  DWELL_MS_DEFAULT,
  type A11yState,
} from '../hooks/useExploreMode'
import { useHeadControl } from '../hooks/useHeadControl'
import { useVoiceAccess } from '../hooks/useVoiceAccess'
import type { MatchedVoiceCommand, VoiceAction } from '../lib/voiceCommands'

interface AccessibilityLayerProps {
  state: A11yState
  onVoiceAction?: (action: VoiceAction) => void
  /** Turn head control off when the user starts using the mouse. */
  onDisableHeadControl?: () => void
}

const DWELL_RADIUS = 18
const DWELL_CIRC = 2 * Math.PI * DWELL_RADIUS
const DWELL_MOVE_PX = 18
const DWELL_COOLDOWN_MS = 700

/** Enter/exit radii (px) for sticky snap-to-target. */
const SNAP_ENTER = 72
const SNAP_EXIT = 100
/** How quickly the cursor locks onto a snapped target center. */
const SNAP_LOCK_LAG = 0.16
const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '.desktop-icon',
  '.dock__app',
  '.dock__launcher',
  '.dock__settings',
  '.dock__mag',
  '.dock__head',
  '.dock__voice',
].join(',')

function isUsableTarget(node: HTMLElement) {
  if (node.closest('.head-cursor, .head-preview, .a11y-live, .voice-access')) {
    return false
  }
  if (
    node.hasAttribute('disabled') ||
    node.getAttribute('aria-disabled') === 'true'
  ) {
    return false
  }
  const style = window.getComputedStyle(node)
  if (style.visibility === 'hidden' || style.display === 'none') return false
  const r = node.getBoundingClientRect()
  return r.width >= 2 && r.height >= 2
}

function clearSnapHighlight(except?: HTMLElement | null) {
  document.querySelectorAll('.is-snap-target').forEach((n) => {
    if (n !== except) n.classList.remove('is-snap-target')
  })
}

/** Nearest interactive control to (x, y) within snap radius. */
function nearestInteractive(x: number, y: number, radius: number) {
  const nodes = document.querySelectorAll(INTERACTIVE_SELECTOR)
  let best: {
    el: HTMLElement
    cx: number
    cy: number
    dist: number
  } | null = null

  for (const node of nodes) {
    if (!(node instanceof HTMLElement) || !isUsableTarget(node)) continue
    const r = node.getBoundingClientRect()
    const cx = r.left + r.width * 0.5
    const cy = r.top + r.height * 0.5
    const nearestX = Math.min(Math.max(x, r.left), r.right)
    const nearestY = Math.min(Math.max(y, r.top), r.bottom)
    const dist = Math.hypot(x - nearestX, y - nearestY)
    if (dist > radius) continue
    if (!best || dist < best.dist) {
      best = { el: node, cx, cy, dist }
    }
  }
  return best
}

function findInteractive(el: Element | null): HTMLElement | null {
  let node: Element | null = el
  while (node && node !== document.documentElement) {
    if (!(node instanceof HTMLElement)) {
      node = node.parentElement
      continue
    }
    if (
      node.classList.contains('head-cursor') ||
      node.classList.contains('head-preview')
    ) {
      return null
    }

    const tag = node.tagName
    const role = node.getAttribute('role')
    const interactive =
      tag === 'BUTTON' ||
      tag === 'A' ||
      tag === 'INPUT' ||
      tag === 'SELECT' ||
      tag === 'TEXTAREA' ||
      tag === 'SUMMARY' ||
      role === 'button' ||
      role === 'link' ||
      role === 'menuitem' ||
      role === 'tab' ||
      role === 'option' ||
      role === 'checkbox' ||
      role === 'switch' ||
      node.classList.contains('desktop-icon')

    if (interactive) {
      if (
        node.hasAttribute('disabled') ||
        node.getAttribute('aria-disabled') === 'true'
      ) {
        node = node.parentElement
        continue
      }
      return node
    }
    node = node.parentElement
  }
  return null
}

function activateTarget(el: HTMLElement) {
  if (el.classList.contains('desktop-icon')) {
    el.dispatchEvent(
      new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    )
    return
  }

  if (el instanceof HTMLInputElement && el.type === 'checkbox') {
    el.click()
    return
  }

  if (el instanceof HTMLSelectElement) {
    el.focus()
    return
  }

  el.click()
  if (typeof el.focus === 'function') {
    try {
      el.focus({ preventScroll: true })
    } catch {
      el.focus()
    }
  }
}

function clearDwellHighlight(except?: HTMLElement | null) {
  document.querySelectorAll('.is-dwell-target').forEach((n) => {
    if (n !== except) n.classList.remove('is-dwell-target')
  })
}

function headStatusLabel(
  status: ReturnType<typeof useHeadControl>['status'],
) {
  switch (status) {
    case 'starting':
      return 'Starting camera…'
    case 'searching':
      return 'Looking for your face…'
    case 'tracking':
      return 'Turn your head to move · snap + smile to click · mouse exits'
    case 'denied':
      return 'Camera permission denied'
    case 'error':
      return 'Head tracking failed to start'
    case 'unsupported':
      return 'Camera not supported in this browser'
    default:
      return ''
  }
}

function A11yPointer({ scale }: { scale: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!ref.current) return
      ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) scale(${scale})`
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [scale])

  return (
    <div ref={ref} className="a11y-pointer" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <path
          d="M4 2 L4 26 L10 20 L14 28 L18 26 L14 18 L22 18 Z"
          fill="#fff"
          stroke="#000"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function AccessibilityLayer({
  state,
  onVoiceAction,
  onDisableHeadControl,
}: AccessibilityLayerProps) {
  const [announce, setAnnounce] = useState('')
  const highlightRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<SVGCircleElement>(null)
  const cursorPos = useRef({
    x: window.innerWidth * 0.55,
    y: window.innerHeight * 0.4,
  })
  const snapTargetRef = useRef<HTMLElement | null>(null)
  const showCursor = state.headControl || state.dwellCursor
  const cursorScale = CURSOR_SCALE[state.cursorSize]
  const showA11yPointer = state.cursorSize !== 'default' && !showCursor

  const handleSmileClick = useCallback(() => {
    const snapped = snapTargetRef.current
    const { x, y } = cursorPos.current
    const target =
      (snapped?.isConnected ? snapped : null) ||
      findInteractive(document.elementFromPoint(x, y))
    if (!target?.isConnected) {
      setAnnounce('Smile detected, nothing to click')
      return
    }
    activateTarget(target)
    const label =
      target.getAttribute('aria-label') ||
      target.getAttribute('title') ||
      target.textContent?.trim().slice(0, 60) ||
      'item'
    setAnnounce(`Smile clicked ${label}`)
  }, [])

  const head = useHeadControl(state.headControl, handleSmileClick)

  const handleVoiceCommand = useCallback(
    (match: MatchedVoiceCommand) => {
      setAnnounce(match.label)
      onVoiceAction?.(match.action)
    },
    [onVoiceAction],
  )

  const voice = useVoiceAccess(state.voiceAccess, handleVoiceCommand)

  useEffect(() => {
    if (!state.headControl) return
    const label = headStatusLabel(head.status)
    if (label) setAnnounce(label)
  }, [state.headControl, head.status])

  useEffect(() => {
    if (!state.headControl || !onDisableHeadControl) return

    const MOVE_PX = 14
    const GRACE_MS = 700
    let armed = false
    let seeded = false
    let origin = { x: 0, y: 0 }
    const grace = window.setTimeout(() => {
      armed = true
    }, GRACE_MS)

    const isPreviewTarget = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest('.head-preview')

    const takeOver = () => {
      setAnnounce('Mouse detected, head control off')
      onDisableHeadControl()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!armed || e.pointerType !== 'mouse') return
      if (isPreviewTarget(e.target)) return
      if (!seeded) {
        origin = { x: e.clientX, y: e.clientY }
        seeded = true
        return
      }
      if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) >= MOVE_PX) {
        takeOver()
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (!armed || e.pointerType !== 'mouse') return
      if (isPreviewTarget(e.target)) return
      takeOver()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => {
      window.clearTimeout(grace)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [state.headControl, onDisableHeadControl])

  useEffect(() => {
    if (!state.narrator) {
      if (highlightRef.current) highlightRef.current.style.opacity = '0'
      return
    }

    let ro: ResizeObserver | null = null
    let observed: Element | null = null

    const measureRect = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      // Flex/min-height tricks can shrink the border box while content still paints.
      const width = Math.max(r.width, el.scrollWidth)
      const height = Math.max(r.height, el.scrollHeight)
      return {
        left: r.left,
        top: r.top,
        width,
        height,
      }
    }

    const moveHighlight = () => {
      const el = document.activeElement as HTMLElement | null
      const box = highlightRef.current
      if (!box) return
      if (!el || el === document.body || el === document.documentElement) {
        box.style.opacity = '0'
        if (ro && observed) {
          ro.unobserve(observed)
          observed = null
        }
        return
      }
      const r = measureRect(el)
      if (r.width < 2 && r.height < 2) {
        box.style.opacity = '0'
        return
      }
      box.style.opacity = '1'
      box.style.transform = `translate(${r.left - 4}px, ${r.top - 4}px)`
      box.style.width = `${r.width + 8}px`
      box.style.height = `${r.height + 8}px`
      const label =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.textContent?.trim().slice(0, 80) ||
        el.tagName.toLowerCase()
      setAnnounce(label)

      if (observed !== el) {
        if (ro && observed) ro.unobserve(observed)
        observed = el
        ro?.observe(el)
      }
    }

    ro = new ResizeObserver(() => moveHighlight())

    const onFocusIn = () => moveHighlight()
    document.addEventListener('focusin', onFocusIn)
    window.addEventListener('resize', moveHighlight)
    // Linear narrator layout scrolls the world; keep the ring over the focused control.
    document.addEventListener('scroll', moveHighlight, true)
    moveHighlight()
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('resize', moveHighlight)
      document.removeEventListener('scroll', moveHighlight, true)
      ro?.disconnect()
    }
  }, [state.narrator])

  useEffect(() => {
    if (!showCursor) return
    let raf = 0
    const target = { x: cursorPos.current.x, y: cursorPos.current.y }
    const freeLag = state.headControl ? 0.045 : 0.35
    let lockedSnap: {
      el: HTMLElement
      cx: number
      cy: number
    } | null = null

    let dwellTarget: HTMLElement | null = null
    let dwellStarted = 0
    let dwellAnchor = { x: cursorPos.current.x, y: cursorPos.current.y }
    let cooldownUntil = 0

    const setProgress = (amount: number) => {
      const circle = progressRef.current
      if (!circle) return
      const clamped = Math.min(1, Math.max(0, amount))
      circle.style.strokeDashoffset = String(DWELL_CIRC * (1 - clamped))
      circle.style.opacity = clamped > 0.02 ? '1' : '0'
    }

    const resetDwell = () => {
      dwellTarget = null
      dwellStarted = 0
      setProgress(0)
      clearDwellHighlight()
    }

    const releaseSnap = () => {
      lockedSnap = null
      snapTargetRef.current = null
      clearSnapHighlight()
    }

    const syncSnapHighlight = (el: HTMLElement) => {
      if (snapTargetRef.current !== el) {
        clearSnapHighlight(el)
        el.classList.add('is-snap-target')
        snapTargetRef.current = el
      }
    }

    const onMove = (e: PointerEvent) => {
      if (state.headControl) return
      target.x = e.clientX
      target.y = e.clientY
    }

    const tick = (now: number) => {
      if (state.headControl) {
        const headPtr = head.pointerRef.current
        target.x = headPtr.x
        target.y = headPtr.y
      }

      const cur = cursorPos.current
      // Slow free follow toward the head aim (or pointer).
      cur.x += (target.x - cur.x) * freeLag
      cur.y += (target.y - cur.y) * freeLag

      if (state.headControl) {
        const aimX = target.x
        const aimY = target.y

        if (lockedSnap?.el.isConnected) {
          const r = lockedSnap.el.getBoundingClientRect()
          lockedSnap.cx = r.left + r.width * 0.5
          lockedSnap.cy = r.top + r.height * 0.5
          const nearestX = Math.min(Math.max(aimX, r.left), r.right)
          const nearestY = Math.min(Math.max(aimY, r.top), r.bottom)
          const dist = Math.hypot(aimX - nearestX, aimY - nearestY)
          if (dist > SNAP_EXIT || !isUsableTarget(lockedSnap.el)) {
            releaseSnap()
          }
        } else {
          lockedSnap = null
        }

        if (!lockedSnap) {
          const next = nearestInteractive(aimX, aimY, SNAP_ENTER)
          if (next) {
            lockedSnap = { el: next.el, cx: next.cx, cy: next.cy }
          }
        }

        if (lockedSnap) {
          // Hard pull the visible cursor onto the target center.
          cur.x += (lockedSnap.cx - cur.x) * SNAP_LOCK_LAG
          cur.y += (lockedSnap.cy - cur.y) * SNAP_LOCK_LAG
          if (
            Math.hypot(cur.x - lockedSnap.cx, cur.y - lockedSnap.cy) < 1.5
          ) {
            cur.x = lockedSnap.cx
            cur.y = lockedSnap.cy
          }
          syncSnapHighlight(lockedSnap.el)
        } else if (snapTargetRef.current) {
          releaseSnap()
        }
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cur.x}px, ${cur.y}px)`
      }

      if (state.dwellCursor) {
        if (now < cooldownUntil) {
          if (dwellTarget) resetDwell()
        } else {
          const under = document.elementFromPoint(cur.x, cur.y)
          const next =
            (state.headControl && snapTargetRef.current?.isConnected
              ? snapTargetRef.current
              : null) || findInteractive(under)

          if (!next) {
            if (dwellTarget) resetDwell()
          } else {
            const moved =
              Math.hypot(cur.x - dwellAnchor.x, cur.y - dwellAnchor.y) >
              DWELL_MOVE_PX

            if (next !== dwellTarget || moved) {
              dwellTarget = next
              dwellStarted = now
              dwellAnchor = { x: cur.x, y: cur.y }
              setProgress(0)
              clearDwellHighlight(dwellTarget)
              dwellTarget.classList.add('is-dwell-target')
            } else {
              const elapsed = now - dwellStarted
              setProgress(elapsed / DWELL_MS_DEFAULT)

              if (elapsed >= DWELL_MS_DEFAULT) {
                const toActivate = dwellTarget
                resetDwell()
                cooldownUntil = now + DWELL_COOLDOWN_MS
                if (toActivate?.isConnected) {
                  activateTarget(toActivate)
                  const label =
                    toActivate.getAttribute('aria-label') ||
                    toActivate.getAttribute('title') ||
                    toActivate.textContent?.trim().slice(0, 60) ||
                    'item'
                  setAnnounce(`Activated ${label}`)
                }
              }
            }
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      clearDwellHighlight()
      clearSnapHighlight()
      snapTargetRef.current = null
    }
  }, [showCursor, state.headControl, state.dwellCursor, head.pointerRef])

  return (
    <>
      <div className="a11y-live" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      {state.narrator ? (
        <div
          ref={highlightRef}
          className="narrator-highlight"
          aria-hidden="true"
        />
      ) : null}

      {showCursor ? (
        <div
          ref={cursorRef}
          className={`head-cursor${state.dwellCursor ? ' is-dwell' : ''}${
            head.smiling ? ' is-smiling' : ''
          }`}
          aria-hidden="true"
        >
          <span className="head-cursor__ring" />
          {state.dwellCursor ? (
            <svg
              className="head-cursor__progress"
              viewBox="0 0 44 44"
              aria-hidden="true"
            >
              <circle
                ref={progressRef}
                cx="22"
                cy="22"
                r={DWELL_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={DWELL_CIRC}
                strokeDashoffset={DWELL_CIRC}
                transform="rotate(-90 22 22)"
              />
            </svg>
          ) : null}
          <span className="head-cursor__dot" />
        </div>
      ) : null}

      {showA11yPointer ? <A11yPointer scale={cursorScale} /> : null}

      {state.headControl ? (
        <div
          className={`head-preview${
            head.status === 'tracking' ? ' is-tracking' : ''
          }${
            head.status === 'denied' ||
            head.status === 'error' ||
            head.status === 'unsupported'
              ? ' is-blocked'
              : ''
          }`}
          role="status"
          aria-label="Head Control camera"
        >
          <video
            ref={head.attachPreview}
            className="head-preview__video"
            playsInline
            muted
            aria-hidden="true"
          />
          <div className="head-preview__copy">
            <strong>Head Control</strong>
            <p>{headStatusLabel(head.status)}</p>
          </div>
          <button
            type="button"
            className="head-preview__calibrate"
            onClick={head.calibrate}
            disabled={head.status !== 'tracking'}
          >
            Recalibrate
          </button>
        </div>
      ) : null}

      {state.voiceAccess ? (
        <div
          className={`voice-access${voice.hearing ? ' is-hearing' : ''}${
            voice.muted ? ' is-muted' : ''
          }${
            voice.status === 'denied' ||
            voice.status === 'unsupported' ||
            voice.status === 'error'
              ? ' is-blocked'
              : ''
          }`}
          role="status"
          aria-label="Voice Access"
        >
          <span className="voice-access__mic" aria-hidden="true" />
          <div className="voice-access__copy">
            <strong>Voice Access</strong>
            <p>{voice.heard}</p>
          </div>
          <button
            type="button"
            className="voice-access__mute"
            aria-pressed={voice.muted}
            aria-label={voice.muted ? 'Unmute voice access' : 'Mute voice access'}
            onClick={voice.toggleMute}
          >
            {voice.muted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      ) : null}
    </>
  )
}
