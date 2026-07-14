export interface Achievement {
  id: string
  name: string
  description: string
  note?: string
}

/** Unique feature interactions needed before the curiosity achievement fires. */
export const FEATURE_UNLOCK_THRESHOLD = 6

export const HYPERFOCUS_ACHIEVEMENT: Achievement = {
  id: 'hyperfocus',
  name: 'Hyperfocus',
  description:
    "Congratulations. You've explored enough of this portfolio that we're probably both enjoying this a little too much.",
  note: '(I have ADHD. Thanks for coming along for the ride.)',
}

export const ACHIEVEMENT_STORAGE_KEY = 'sh-achievement-hyperfocus'
