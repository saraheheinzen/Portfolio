import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

const ZOOM = 2.35
const INSET = 10
const TITLE_H = 30
const MIN_W = 220
const MIN_H = 160

/** UI overlays inside `.desktop` that should not appear in the magnified clone. */
const MAGNIFIER_EXCLUDE =
  '.magnifier, .a11y-pointer, .head-cursor, .narrator-highlight, .head-preview, .voice-access, .a11y-live, script'

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface MagnifierGeom {
  x: number
  y: number
  width: number
  height: number
}

function defaultGeom(): MagnifierGeom {
  const width = Math.min(440, Math.round(window.innerWidth * 0.72))
  const height = Math.min(300, Math.round(window.innerHeight * 0.48))
  return {
    x: Math.round((window.innerWidth - width) / 2),
    y: Math.round(window.innerHeight / 3),
    width,
    height,
  }
}

/** Open above/beside the dock's magnifier toggle instead of screen-center. */
function geomNearButton(button: HTMLElement): MagnifierGeom {
  const width = Math.min(440, Math.round(window.innerWidth * 0.72))
  const height = Math.min(300, Math.round(window.innerHeight * 0.48))
  const gap = 12
  const rect = button.getBoundingClientRect()

  const x = Math.min(
    Math.max(8, Math.round(rect.right - width)),
    window.innerWidth - width - 8,
  )
  const y = Math.max(8, Math.round(rect.top - gap - height))

  return { x, y, width, height }
}

interface MagnifierProps {
  active: boolean
  onClose?: () => void
}

export function Magnifier({ active, onClose }: MagnifierProps) {
  const [geom, setGeom] = useState(defaultGeom)
  const stageRef = useRef<HTMLDivElement>(null)
  const geomRef = useRef(geom)

  const dragRef = useRef<{
    ox: number
    oy: number
    sx: number
    sy: number
  } | null>(null)

  const resizeRef = useRef<{
    edge: ResizeEdge
    ox: number
    oy: number
    sx: number
    sy: number
    sw: number
    sh: number
  } | null>(null)

  geomRef.current = geom

  useEffect(() => {
    if (!active) return
    const button = document.querySelector('.dock__mag') as HTMLElement | null
    if (button) setGeom(geomNearButton(button))
  }, [active])

  const viewportSize = useCallback((g: MagnifierGeom) => {
    const vpW = Math.max(1, g.width - INSET * 2)
    const vpH = Math.max(1, g.height - TITLE_H - INSET * 2)
    return { vpW, vpH }
  }, [])

  const magnifyCenter = useCallback(
    (g: MagnifierGeom) => {
      const { vpW, vpH } = viewportSize(g)
      return {
        cx: g.x + INSET + vpW / 2,
        cy: g.y + TITLE_H + INSET + vpH / 2,
        vpW,
        vpH,
      }
    },
    [viewportSize],
  )

  const place = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const { cx, cy, vpW, vpH } = magnifyCenter(geomRef.current)
    stage.style.transform = `translate(${-cx * ZOOM + vpW / 2}px, ${-cy * ZOOM + vpH / 2}px)`
  }, [magnifyCenter])

  useEffect(() => {
    if (!active) return

    const stage = stageRef.current
    if (!stage) return

    let lastClone = 0

    const paintClone = () => {
      const source = document.querySelector('.desktop') as HTMLElement | null
      if (!source) return

      stage.innerHTML = ''
      const clone = source.cloneNode(true) as HTMLElement
      clone.classList.add('magnifier__clone')
      clone.querySelectorAll(MAGNIFIER_EXCLUDE).forEach((el) => el.remove())
      clone.setAttribute('aria-hidden', 'true')
      clone.style.pointerEvents = 'none'
      clone.style.position = 'absolute'
      clone.style.left = '0'
      clone.style.top = '0'
      clone.style.width = `${source.offsetWidth}px`
      clone.style.height = `${source.offsetHeight}px`
      clone.style.margin = '0'
      clone.style.transform = `scale(${ZOOM})`
      clone.style.transformOrigin = '0 0'

      clone.querySelectorAll('iframe').forEach((frame) => {
        frame.setAttribute('src', 'about:blank')
      })

      stage.appendChild(clone)
    }

    const refresh = () => {
      place()
      const now = performance.now()
      if (now - lastClone > 120) {
        lastClone = now
        paintClone()
        place()
      }
    }

    paintClone()
    place()
    const id = window.setInterval(refresh, 120)

    return () => {
      window.clearInterval(id)
      stage.innerHTML = ''
    }
  }, [active, place])

  useEffect(() => {
    place()
  }, [geom, place])

  useEffect(() => {
    if (!active) return

    const onMovePointer = (e: PointerEvent) => {
      if (dragRef.current) {
        const { ox, oy, sx, sy } = dragRef.current
        setGeom((g) => ({
          ...g,
          x: sx + (e.clientX - ox),
          y: sy + (e.clientY - oy),
        }))
        return
      }

      if (!resizeRef.current) return
      const { edge, ox, oy, sx, sy, sw, sh } = resizeRef.current
      const dx = e.clientX - ox
      const dy = e.clientY - oy

      let x = sx
      let y = sy
      let width = sw
      let height = sh

      if (edge.includes('e')) width = Math.max(MIN_W, sw + dx)
      if (edge.includes('s')) height = Math.max(MIN_H, sh + dy)
      if (edge.includes('w')) {
        width = Math.max(MIN_W, sw - dx)
        x = sx + (sw - width)
      }
      if (edge.includes('n')) {
        height = Math.max(MIN_H, sh - dy)
        y = sy + (sh - height)
      }

      setGeom({ x, y, width, height })
    }

    const onUp = () => {
      dragRef.current = null
      resizeRef.current = null
    }

    window.addEventListener('pointermove', onMovePointer)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMovePointer)
      window.removeEventListener('pointerup', onUp)
    }
  }, [active])

  const onTitlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      dragRef.current = {
        ox: e.clientX,
        oy: e.clientY,
        sx: geom.x,
        sy: geom.y,
      }
    },
    [geom.x, geom.y],
  )

  const onResizePointerDown = useCallback(
    (edge: ResizeEdge) => (e: ReactPointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      resizeRef.current = {
        edge,
        ox: e.clientX,
        oy: e.clientY,
        sx: geom.x,
        sy: geom.y,
        sw: geom.width,
        sh: geom.height,
      }
    },
    [geom.height, geom.width, geom.x, geom.y],
  )

  if (!active) return null

  const edges: ResizeEdge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

  return (
    <div className="magnifier" aria-hidden="true">
      <div
        className="magnifier__lens"
        style={{
          left: geom.x,
          top: geom.y,
          width: geom.width,
          height: geom.height,
        }}
      >
        <header
          className="magnifier__title"
          onPointerDown={onTitlePointerDown}
        >
          <span className="magnifier__title-text">Magnifier</span>
          {onClose ? (
            <button
              type="button"
              className="magnifier__close"
              aria-label="Close magnifier"
              title="Close"
              onClick={onClose}
            >
              ×
            </button>
          ) : null}
        </header>
        <div className="magnifier__viewport">
          <div ref={stageRef} className="magnifier__stage" />
        </div>
        <div className="magnifier__glass" />
        {edges.map((edge) => (
          <div
            key={edge}
            className={`os-window__resize os-window__resize--${edge}`}
            onPointerDown={onResizePointerDown(edge)}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}
