const STORAGE_KEY = 'portfolio:case-studies-unlocked'

export function getCaseStudyPassword(): string {
  return String(import.meta.env.VITE_CASE_STUDY_PASSWORD ?? '').trim()
}

export function isCaseStudiesUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function unlockCaseStudies(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
}

export function tryUnlockCaseStudies(password: string): boolean {
  const expected = getCaseStudyPassword()
  if (!expected || password.trim() !== expected) return false
  unlockCaseStudies()
  return true
}
