import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision'

export type HeadControlStatus =
  | 'idle'
  | 'starting'
  | 'tracking'
  | 'searching'
  | 'denied'
  | 'error'
  | 'unsupported'

export interface HeadPointer {
  x: number
  y: number
}

/** Radians of head yaw/pitch that map to the full viewport. */
const YAW_SPAN = 0.38
const PITCH_SPAN = 0.28
/** Ignore tiny motion around the calibrated center. */
const DEADZONE = 0.025

/** Blendshape thresholds for smile-to-click (with hysteresis). */
const SMILE_ON = 0.48
const SMILE_OFF = 0.32
const SMILE_COOLDOWN_MS = 900

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const WASM_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function mapAxis(delta: number, span: number) {
  const mag = Math.abs(delta)
  if (mag < DEADZONE) return 0.5
  const signed = Math.sign(delta) * (mag - DEADZONE)
  return clamp(0.5 + signed / (span - DEADZONE), 0, 1)
}

/**
 * Extract yaw (Y) and pitch (X) from MediaPipe's 4×4 facial transform.
 * Matrix data is column-major.
 */
function yawPitchFromMatrix(data: ArrayLike<number>) {
  const r00 = data[0]
  const r10 = data[1]
  const r20 = data[2]
  const r21 = data[6]
  const r22 = data[10]

  const sy = Math.hypot(r00, r10)
  const pitch = Math.atan2(r21, r22)
  const yaw = Math.atan2(-r20, sy)
  return { yaw, pitch }
}

function smileScoreFromBlendshapes(result: FaceLandmarkerResult) {
  const categories = result.faceBlendshapes[0]?.categories
  if (!categories?.length) return 0

  let left = 0
  let right = 0
  for (const cat of categories) {
    if (cat.categoryName === 'mouthSmileLeft') left = cat.score
    else if (cat.categoryName === 'mouthSmileRight') right = cat.score
  }
  return (left + right) * 0.5
}

function hasCameraSupport() {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof HTMLVideoElement !== 'undefined'
  )
}

function createProcessVideo() {
  const video = document.createElement('video')
  video.playsInline = true
  video.muted = true
  video.setAttribute('playsinline', 'true')
  return video
}

const LANDMARKER_OPTIONS = {
  runningMode: 'VIDEO' as const,
  numFaces: 1,
  outputFacialTransformationMatrixes: true,
  outputFaceBlendshapes: true,
}

export function useHeadControl(
  enabled: boolean,
  onSmile?: () => void,
) {
  const [status, setStatus] = useState<HeadControlStatus>(() =>
    hasCameraSupport() ? 'idle' : 'unsupported',
  )
  const [smiling, setSmiling] = useState(false)
  const pointerRef = useRef<HeadPointer>({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.45 : 0,
  })
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processVideoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef(0)
  const lastVideoTime = useRef(-1)
  const centerRef = useRef<{ yaw: number; pitch: number } | null>(null)
  const smoothRef = useRef({ yaw: 0, pitch: 0 })
  const recalibrateRef = useRef(false)
  const smileLatched = useRef(false)
  const lastSmileAt = useRef(0)
  const onSmileRef = useRef(onSmile)

  useEffect(() => {
    onSmileRef.current = onSmile
  }, [onSmile])

  const calibrate = useCallback(() => {
    recalibrateRef.current = true
  }, [])

  const attachPreview = useCallback((el: HTMLVideoElement | null) => {
    previewRef.current = el
    if (el && streamRef.current) {
      el.srcObject = streamRef.current
      void el.play().catch(() => {})
    } else if (el) {
      el.srcObject = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      landmarkerRef.current?.close()
      landmarkerRef.current = null
      processVideoRef.current = null
      centerRef.current = null
      lastVideoTime.current = -1
      smileLatched.current = false
      if (previewRef.current) previewRef.current.srcObject = null
      setSmiling(false)
      setStatus(hasCameraSupport() ? 'idle' : 'unsupported')
      return
    }

    if (!hasCameraSupport()) {
      setStatus('unsupported')
      return
    }

    let cancelled = false
    setStatus('starting')

    const setStatusSafe = (next: HeadControlStatus) => {
      setStatus((prev) => (prev === next ? prev : next))
    }

    const applyResult = (result: FaceLandmarkerResult, now: number) => {
      const matrix = result.facialTransformationMatrixes[0]
      if (!matrix?.data?.length) {
        setStatusSafe('searching')
        return
      }

      const raw = yawPitchFromMatrix(matrix.data)
      const smooth = smoothRef.current
      smooth.yaw += (raw.yaw - smooth.yaw) * 0.14
      smooth.pitch += (raw.pitch - smooth.pitch) * 0.14

      if (!centerRef.current || recalibrateRef.current) {
        centerRef.current = { yaw: smooth.yaw, pitch: smooth.pitch }
        recalibrateRef.current = false
      }

      const center = centerRef.current
      // Mirrored preview: negate yaw so looking right moves the cursor right.
      const nx = mapAxis(-(smooth.yaw - center.yaw), YAW_SPAN)
      const ny = mapAxis(smooth.pitch - center.pitch, PITCH_SPAN)

      pointerRef.current = {
        x: nx * window.innerWidth,
        y: ny * window.innerHeight,
      }
      setStatusSafe('tracking')

      const smile = smileScoreFromBlendshapes(result)
      if (smile < SMILE_OFF) {
        smileLatched.current = false
        setSmiling((prev) => (prev ? false : prev))
      } else if (smile >= SMILE_ON) {
        setSmiling((prev) => (prev ? prev : true))
        if (
          !smileLatched.current &&
          now - lastSmileAt.current >= SMILE_COOLDOWN_MS
        ) {
          smileLatched.current = true
          lastSmileAt.current = now
          onSmileRef.current?.()
        }
      }
    }

    const tick = () => {
      if (cancelled) return
      const video = processVideoRef.current
      const landmarker = landmarkerRef.current

      if (
        video &&
        landmarker &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        if (video.currentTime !== lastVideoTime.current) {
          lastVideoTime.current = video.currentTime
          try {
            const now = performance.now()
            const result = landmarker.detectForVideo(video, now)
            if (result.facialTransformationMatrixes.length > 0) {
              applyResult(result, now)
            } else {
              setStatusSafe('searching')
            }
          } catch {
            setStatusSafe('error')
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    ;(async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_ROOT)
        if (cancelled) return

        let landmarker: FaceLandmarker
        try {
          landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: 'GPU',
            },
            ...LANDMARKER_OPTIONS,
          })
        } catch {
          landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: 'CPU',
            },
            ...LANDMARKER_OPTIONS,
          })
        }
        if (cancelled) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          landmarker.close()
          return
        }
        streamRef.current = stream

        const processVideo = createProcessVideo()
        processVideoRef.current = processVideo
        processVideo.srcObject = stream
        await processVideo.play()
        if (cancelled) return

        if (previewRef.current) {
          previewRef.current.srcObject = stream
          void previewRef.current.play().catch(() => {})
        }

        setStatusSafe('searching')
        rafRef.current = requestAnimationFrame(tick)
      } catch (err) {
        if (cancelled) return
        const name =
          err && typeof err === 'object' && 'name' in err
            ? String((err as { name: string }).name)
            : ''
        setStatusSafe(
          name === 'NotAllowedError' || name === 'PermissionDeniedError'
            ? 'denied'
            : 'error',
        )
      }
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      landmarkerRef.current?.close()
      landmarkerRef.current = null
      processVideoRef.current = null
      centerRef.current = null
      lastVideoTime.current = -1
      smileLatched.current = false
      if (previewRef.current) previewRef.current.srcObject = null
    }
  }, [enabled])

  return { status, smiling, pointerRef, attachPreview, calibrate }
}
