export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure'

export type Exercise = {
  id: string
  name: string
  muscle_group: string
  equipment: string | null
}

export type HistorySet = {
  set_number: number
  set_type: SetType
  weight_kg: number | null
  reps: number | null
  completed: boolean
}

export type WorkoutEntry = {
  workout_id: string
  started_at: string
  finished_at: string
  sets: HistorySet[]
}
