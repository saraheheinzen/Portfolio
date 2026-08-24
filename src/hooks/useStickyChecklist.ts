import { useCallback, useState } from 'react'

export type ChecklistId =
  | 'browser'
  | 'case-study'
  | 'games'
  | 'player'
  | 'a11y'
  | 'clippy'
  | 'contact'

const STORAGE_KEY = 'sh-sticky-checklist'
const VALID_IDS = new Set<ChecklistId>([
  'browser',
  'case-study',
  'games',
  'player',
  'a11y',
  'clippy',
  'contact',
])

function loadChecked(): Set<ChecklistId> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(
      parsed.filter(
        (id): id is ChecklistId =>
          typeof id === 'string' && VALID_IDS.has(id as ChecklistId),
      ),
    )
  } catch {
    return new Set()
  }
}

function saveChecked(checked: Set<ChecklistId>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]))
  } catch {
    /* ignore quota / private mode */
  }
}

/** Sticky note to-do state: auto-marked by real usage, still toggleable by hand. */
export function useStickyChecklist() {
  const [checked, setChecked] = useState<Set<ChecklistId>>(() => loadChecked())

  const markDone = useCallback((id: ChecklistId) => {
    setChecked((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveChecked(next)
      return next
    })
  }, [])

  const toggle = useCallback((id: ChecklistId) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveChecked(next)
      return next
    })
  }, [])

  return { checked, markDone, toggle }
}
