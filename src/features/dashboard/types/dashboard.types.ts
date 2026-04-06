export type WeeklyWorkoutData = {
  label: string
  count: number
}

export type WorkoutSummary = {
  totalWorkouts: number
  totalSets: number
  totalVolume: number // kg × reps
  avgDuration: number // minutes
  workouts: { id: string; started_at: string; finished_at: string; sets_count: number }[]
}

export type BodyMetricsSummary = {
  weightStart: number | null
  weightEnd: number | null
  weightDelta: number | null
  measurements: {
    label: string
    key: string
    start: number | null
    end: number | null
    delta: number | null
  }[]
}

export type DashboardData = {
  workouts: WorkoutSummary
  metrics: BodyMetricsSummary
}
