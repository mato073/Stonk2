export type Gender = 'male' | 'female'

export type Profile = {
  id: string
  height_cm: number | null
  gender: Gender | null
  created_at: string
}

export type BodyFatResult = {
  percentage: number
  category: string
}

export type TrendResult = {
  label: string
  recent: number | null   // avg of last 3
  previous: number | null // avg of 3 before that
  delta: number | null
  direction: 'up' | 'down' | 'stable'
}

export type MuscleGainIndicator = {
  likely: boolean
  weightTrend: 'up' | 'down' | 'stable'
  waistTrend: 'up' | 'down' | 'stable'
  reason: string
}
