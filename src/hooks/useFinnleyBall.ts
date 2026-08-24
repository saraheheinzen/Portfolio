import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

const BALL_SIZE = 28
const BALL_RADIUS = BALL_SIZE / 2
const DOCK = 72
const MARGIN = 8
const CHASE_SPEED = 5.5
const CATCH_DISTANCE = 48
const THROW_MIN_SPEED = 3
const FRICTION = 0.988
const GRAVITY = 0.22
const BOUNCE = 0.62
const FINNLEY_W = 80
const FINNLEY_H = 96
const THROW_SPEED = 9
const THROW_CLEARANCE = 36
const REST_GAP = 18
const DOCK_FOLLOW_SNAP = 28
const DOCK_SIDE_LERP = 0.14

export type ThrowDirection = 'left' | 'right' | 'up'

interface Point {
  x: number
  bottom: number
}

interface BallState extends Point {
  vx: number
  vy: number
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function getBounds(width = FINNLEY_W, height = FINNLEY_H) {
  return {
    minX: MARGIN,
    minY: DOCK + MARGIN,
    maxX: Math.max(MARGIN, window.innerWidth - width - MARGIN),
    maxY: Math.max(DOCK + MARGIN, window.innerHeight - height - MARGIN),
  }
}

function ballBounds() {
  return {
    minX: MARGIN,
    minY: DOCK + MARGIN,
    maxX: Math.max(MARGIN, window.innerWidth - BALL_SIZE - MARGIN),
    maxY: Math.max(DOCK + MARGIN, window.innerHeight - BALL_SIZE - MARGIN),
  }
}

function pointerToBallPos(clientX: number, clientY: number): Point {
  return {
    x: clientX - BALL_RADIUS,
    bottom: window.innerHeight - clientY - BALL_RADIUS,
  }
}

function finnleyCenter(pos: Point) {
  return {
    x: pos.x + FINNLEY_W / 2,
    bottom: pos.bottom + FINNLEY_H / 2,
  }
}

function ballCenter(ball: Point) {
  return {
    x: ball.x + BALL_RADIUS,
    bottom: ball.bottom + BALL_RADIUS,
  }
}

/** Rest on Finnley's open side so the ball stays on-screen. */
function restBallBeside(pos: Point): Point {
  const onRightHalf = pos.x + FINNLEY_W / 2 >= window.innerWidth / 2
  const x = onRightHalf
    ? pos.x - BALL_SIZE - REST_GAP
    : pos.x + FINNLEY_W + REST_GAP
  return {
    x: clamp(x, MARGIN, window.innerWidth - BALL_SIZE - MARGIN),
    bottom: clamp(pos.bottom, DOCK + MARGIN, window.innerHeight - BALL_SIZE - MARGIN),
  }
}

function launchPos(finnley: Point, direction: ThrowDirection): Point {
  const rest = restBallBeside(finnley)
  const bounds = ballBounds()
  let x = rest.x
  let bottom = rest.bottom
  switch (direction) {
    case 'left':
      x -= THROW_CLEARANCE
      break
    case 'right':
      x += THROW_CLEARANCE
      break
    case 'up':
      bottom += THROW_CLEARANCE
      break
  }
  return {
    x: clamp(x, bounds.minX, bounds.maxX),
    bottom: clamp(bottom, bounds.minY, bounds.maxY),
  }
}

export function useFinnleyBall({
  finnleyPos,
  onFinnleyMove,
  finnleyDragging,
  reducedMotion = false,
}: {
  finnleyPos: Point
  onFinnleyMove: (next: Point) => void
  finnleyDragging: boolean
  reducedMotion?: boolean
}) {
  const [ball, setBall] = useState<BallState>(() => ({
    ...restBallBeside(finnleyPos),
    vx: 0,
    vy: 0,
  }))
  const [ballDragging, setBallDragging] = useState(false)
  const [chasing, setChasing] = useState(false)
  const [facingLeft, setFacingLeft] = useState(false)

  const ballRef = useRef(ball)
  const finnleyRef = useRef(finnleyPos)
  const dragRef = useRef<{ pointerId: number } | null>(null)
  const samplesRef = useRef<{ x: number; y: number; t: number }[]>([])
  const wantsChaseRef = useRef(false)
  const dockedRef = useRef(true)
  const chasingRef = useRef(false)
  const facingLeftRef = useRef(false)
  const ballDraggingRef = useRef(false)
  const finnleyDraggingRef = useRef(false)
  const onFinnleyMoveRef = useRef(onFinnleyMove)
  const reducedMotionRef = useRef(reducedMotion)
  const ballElRef = useRef<HTMLButtonElement | null>(null)

  const dockBall = useCallback((finnley: Point) => {
    dockedRef.current = true
    wantsChaseRef.current = false
    chasingRef.current = false
    setChasing(false)
    const rest = restBallBeside(finnley)
    const next = { ...rest, vx: 0, vy: 0 }
    ballRef.current = next
    setBall(next)
  }, [])

  const applyThrow = useCallback((direction: ThrowDirection) => {
    let vx = 0
    let vy = 0
    switch (direction) {
      case 'left':
        vx = -THROW_SPEED
        vy = THROW_SPEED * 0.35
        break
      case 'right':
        vx = THROW_SPEED
        vy = THROW_SPEED * 0.35
        break
      case 'up':
        vx = THROW_SPEED * 0.15
        vy = THROW_SPEED * 1.1
        break
    }

    dockedRef.current = false
    wantsChaseRef.current = true
    chasingRef.current = false
    setChasing(false)
    const origin = launchPos(finnleyRef.current, direction)
    setBall(() => {
      const next = { ...origin, vx, vy }
      ballRef.current = next
      return next
    })
  }, [])

  ballRef.current = ball
  finnleyRef.current = finnleyPos
  ballDraggingRef.current = ballDragging
  finnleyDraggingRef.current = finnleyDragging
  onFinnleyMoveRef.current = onFinnleyMove
  reducedMotionRef.current = reducedMotion

  // While docked, cancel chase if Finnley is dragged; position is eased in the RAF tick.
  useEffect(() => {
    if (!finnleyDragging || ballDragging || !dockedRef.current) return
    wantsChaseRef.current = false
    chasingRef.current = false
    setChasing(false)
  }, [ballDragging, finnleyDragging])

  useEffect(() => {
    let raf = 0

    const tick = () => {
      const currentBall = { ...ballRef.current }
      const finnley = finnleyRef.current
      let nextChasing = chasingRef.current
      let nextFacingLeft = facingLeftRef.current

      if (dockedRef.current && !ballDraggingRef.current) {
        const rest = restBallBeside(finnley)
        const dx = rest.x - currentBall.x
        const dy = rest.bottom - currentBall.bottom
        const dist = Math.hypot(dx, dy)
        // Stick tightly for small moves; ease across when the side target flips.
        if (reducedMotionRef.current || dist <= DOCK_FOLLOW_SNAP) {
          currentBall.x = rest.x
          currentBall.bottom = rest.bottom
        } else {
          currentBall.x += dx * DOCK_SIDE_LERP
          currentBall.bottom += dy * DOCK_SIDE_LERP
        }
        currentBall.vx = 0
        currentBall.vy = 0
        wantsChaseRef.current = false
        nextChasing = false
      } else if (!ballDraggingRef.current) {
        const bounds = ballBounds()
        currentBall.x += currentBall.vx
        currentBall.bottom += currentBall.vy
        currentBall.vy -= GRAVITY
        currentBall.vx *= FRICTION
        currentBall.vy *= FRICTION

        if (currentBall.x < bounds.minX) {
          currentBall.x = bounds.minX
          currentBall.vx *= -BOUNCE
        } else if (currentBall.x > bounds.maxX) {
          currentBall.x = bounds.maxX
          currentBall.vx *= -BOUNCE
        }

        if (currentBall.bottom < bounds.minY) {
          currentBall.bottom = bounds.minY
          currentBall.vy *= -BOUNCE
        } else if (currentBall.bottom > bounds.maxY) {
          currentBall.bottom = bounds.maxY
          currentBall.vy *= -BOUNCE
        }

        const speed = Math.hypot(currentBall.vx, currentBall.vy)
        if (speed < 0.35) {
          currentBall.vx = 0
          currentBall.vy = 0
        }
      }

      if (
        !dockedRef.current &&
        !ballDraggingRef.current &&
        !finnleyDraggingRef.current
      ) {
        const fCenter = finnleyCenter(finnley)
        const bCenter = ballCenter(currentBall)
        const dx = bCenter.x - fCenter.x
        const dy = bCenter.bottom - fCenter.bottom
        const dist = Math.hypot(dx, dy)
        const ballSpeed = Math.hypot(currentBall.vx, currentBall.vy)
        const shouldChase =
          wantsChaseRef.current &&
          dist > CATCH_DISTANCE &&
          (ballSpeed > 0.45 || dist > CATCH_DISTANCE * 1.8)

        if (shouldChase) {
          nextChasing = true
          nextFacingLeft = dx < 0
          const step = reducedMotionRef.current
            ? Math.min(CHASE_SPEED * 2.2, dist - CATCH_DISTANCE)
            : CHASE_SPEED
          const nx = dx / dist
          const ny = dy / dist
          const bounds = getBounds()
          onFinnleyMoveRef.current({
            x: clamp(finnley.x + nx * step, bounds.minX, bounds.maxX),
            bottom: clamp(finnley.bottom + ny * step, bounds.minY, bounds.maxY),
          })
        } else if (dist <= CATCH_DISTANCE && wantsChaseRef.current) {
          dockedRef.current = true
          wantsChaseRef.current = false
          nextChasing = false
          const rest = restBallBeside(finnleyRef.current)
          currentBall.x = rest.x
          currentBall.bottom = rest.bottom
          currentBall.vx = 0
          currentBall.vy = 0
        } else if (!shouldChase && dist <= CATCH_DISTANCE) {
          nextChasing = false
        }
      } else {
        nextChasing = false
      }

      ballRef.current = currentBall
      setBall(currentBall)
      if (nextChasing !== chasingRef.current) {
        chasingRef.current = nextChasing
        setChasing(nextChasing)
      }
      if (nextFacingLeft !== facingLeftRef.current) {
        facingLeftRef.current = nextFacingLeft
        setFacingLeft(nextFacingLeft)
      }
      raf = window.requestAnimationFrame(tick)
    }

    raf = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    const endDrag = (pointerId: number) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== pointerId) return

      dragRef.current = null
      ballDraggingRef.current = false
      setBallDragging(false)

      const el = ballElRef.current
      if (el?.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId)
      }

      const samples = samplesRef.current
      if (samples.length >= 2) {
        const last = samples[samples.length - 1]
        const prev = samples[Math.max(0, samples.length - 3)]
        const dt = Math.max(16, last.t - prev.t)
        const vx = ((last.x - prev.x) / dt) * 16
        const vy = (-(last.y - prev.y) / dt) * 16
        const speed = Math.hypot(vx, vy)
        if (speed >= THROW_MIN_SPEED) {
          dockedRef.current = false
          wantsChaseRef.current = true
          setBall((b) => {
            const next = { ...b, vx, vy }
            ballRef.current = next
            return next
          })
        } else {
          dockBall(finnleyRef.current)
        }
      } else {
        dockBall(finnleyRef.current)
      }
      samplesRef.current = []
    }

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || e.pointerId !== drag.pointerId) return

      const now = performance.now()
      const next = pointerToBallPos(e.clientX, e.clientY)
      const bounds = ballBounds()
      samplesRef.current.push({ x: e.clientX, y: e.clientY, t: now })
      if (samplesRef.current.length > 6) samplesRef.current.shift()

      setBall((prev) => {
        const updated = {
          ...prev,
          x: clamp(next.x, bounds.minX, bounds.maxX),
          bottom: clamp(next.bottom, bounds.minY, bounds.maxY),
          vx: 0,
          vy: 0,
        }
        ballRef.current = updated
        return updated
      })
    }

    const onPointerUp = (e: PointerEvent) => {
      endDrag(e.pointerId)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [dockBall])

  const onBallPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    dockedRef.current = false
    ballElRef.current = e.currentTarget
    dragRef.current = { pointerId: e.pointerId }
    wantsChaseRef.current = false
    chasingRef.current = false
    setChasing(false)
    ballDraggingRef.current = true
    setBallDragging(true)
    samplesRef.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }]
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const throwBall = useCallback(
    (direction: ThrowDirection = 'right') => {
      if (ballDraggingRef.current) return
      applyThrow(direction)
    },
    [applyThrow],
  )

  return {
    ball,
    ballDragging,
    chasing,
    facingLeft,
    onBallPointerDown,
    throwBall,
  }
}
