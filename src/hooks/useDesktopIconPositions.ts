import { useCallback, useState } from 'react'

const SLOT_W = 114
const SLOT_H = 98

export type IconPos = { x: number; y: number }

/** Column-first grid matching the original flex-wrap column desktop layout. */
export function defaultIconPosition(
  index: number,
  areaHeight = 640,
): IconPos {
  const perCol = Math.max(1, Math.floor(areaHeight / SLOT_H))
  const col = Math.floor(index / perCol)
  const row = index % perCol
  return { x: col * SLOT_W, y: row * SLOT_H }
}

function initialPositions(iconIds: string[]): Record<string, IconPos> {
  const h =
    typeof window !== 'undefined'
      ? Math.max(320, window.innerHeight - 72 - 52)
      : 640
  const next: Record<string, IconPos> = {}
  iconIds.forEach((id, i) => {
    next[id] = defaultIconPosition(i, h)
  })
  return next
}

export function useDesktopIconPositions(iconIds: string[]) {
  const [positions, setPositions] = useState(() => initialPositions(iconIds))

  const moveIcon = useCallback((id: string, x: number, y: number) => {
    setPositions((prev) => ({ ...prev, [id]: { x, y } }))
  }, [])

  const getPosition = useCallback(
    (id: string, index: number): IconPos =>
      positions[id] ?? defaultIconPosition(index),
    [positions],
  )

  return { getPosition, moveIcon }
}
