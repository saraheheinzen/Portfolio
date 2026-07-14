import { useCallback, useRef, useState } from 'react'
import {
  ACHIEVEMENT_STORAGE_KEY,
  FEATURE_UNLOCK_THRESHOLD,
} from '../data/achievements'

function alreadyUnlocked(): boolean {
  try {
    return sessionStorage.getItem(ACHIEVEMENT_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markUnlocked() {
  try {
    sessionStorage.setItem(ACHIEVEMENT_STORAGE_KEY, '1')
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Counts distinct feature interactions. When the threshold is hit once per
 * session, unlocks the curiosity achievement toast.
 */
export function useFeatureExploration() {
  const seen = useRef(new Set<string>())
  const unlocked = useRef(alreadyUnlocked())
  const [showAchievement, setShowAchievement] = useState(false)
  const [achievementKey, setAchievementKey] = useState(0)

  const record = useCallback((featureId: string) => {
    if (!featureId || unlocked.current) return
    if (seen.current.has(featureId)) return

    seen.current.add(featureId)
    if (seen.current.size < FEATURE_UNLOCK_THRESHOLD) return

    unlocked.current = true
    markUnlocked()
    setShowAchievement(true)
    setAchievementKey((k) => k + 1)
  }, [])

  const dismissAchievement = useCallback(() => {
    setShowAchievement(false)
  }, [])

  return {
    record,
    showAchievement,
    achievementKey,
    dismissAchievement,
  }
}
