import { useEffect, useRef } from 'react'

const ZOOM = 2.35

interface MagnifierProps {
  active: boolean
}

export function Magnifier({ active }: MagnifierProps) {
  const lensRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 3 })

  useEffect(() => {
    if (!active) return

    const stage = stageRef.current
    const lens = lensRef.current
    if (!stage || !lens) return

    let raf = 0
    let lastClone = 0

    const paintClone = () => {
      const source = document.querySelector('.desktop') as HTMLElement | null
      if (!source) return

      stage.innerHTML = ''
      const clone = source.cloneNode(true) as HTMLElement
      clone.classList.add('magnifier__clone')
      clone.querySelectorAll('.magnifier, script').forEach((el) => el.remove())
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

    const place = () => {
      const { x, y } = posRef.current
      const halfW = lens.offsetWidth / 2
      const halfH = lens.offsetHeight / 2
      lens.style.transform = `translate(${x - halfW}px, ${y - halfH}px)`
      stage.style.transform = `translate(${-x * ZOOM + halfW}px, ${-y * ZOOM + halfH}px)`
    }

    const onMove = (e: PointerEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0
          place()
          const now = performance.now()
          if (now - lastClone > 120) {
            lastClone = now
            paintClone()
            place()
          }
        })
      }
    }

    paintClone()
    place()
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
      stage.innerHTML = ''
    }
  }, [active])

  if (!active) return null

  return (
    <div className="magnifier" aria-hidden="true">
      <div ref={lensRef} className="magnifier__lens">
        <div className="magnifier__viewport">
          <div ref={stageRef} className="magnifier__stage" />
        </div>
        <div className="magnifier__glass" />
      </div>
    </div>
  )
}
