export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure'

export type Exercise = {
  id: string
  name: string
  muscle_group: string
  equipment: string | null
}

export type Workout = {
  id: string
  user_id: string
  started_at: string
  finished_at: string | null
  notes: string | null
  created_at: string
}

export type WorkoutSet = {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  set_type: SetType
  weight_kg: number | null
  reps: number | null
  completed: boolean
  rest_seconds: number | null
}

// --- Local state (active workout, not yet persisted) ---

export type LocalSet = {
  localId: string
  set_number: number
  set_type: SetType
  weight_kg: number | null
  reps: number | null
  completed: boolean
  previous: string | null // e.g. "80 kg × 5"
  templateSetId?: string // link to template_sets row for saving back
}

export type LocalExercise = {
  localId: string
  exercise: Exercise
  notes: string
  sets: LocalSet[]
  restConfig?: RestConfig
  templateExerciseId?: string // link to template_exercises row
}

export type ActiveWorkoutState = {
  startedAt: Date
  exercises: LocalExercise[]
  notes: string
}

// --- Templates ---

export type WorkoutTemplate = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type RestConfig = {
  rest_warmup: number
  rest_normal: number
  rest_dropset: number
  rest_failure: number
}

export type TemplateExercise = {
  id: string
  template_id: string
  exercise_id: string
  position: number
  sets_count: number
  set_type: SetType
  exercise?: Exercise // joined
} & RestConfig

export type TemplateExerciseInsert = {
  template_id: string
  exercise_id: string
  position: number
  sets_count: number
  set_type: SetType
} & Partial<RestConfig>

export type TemplateSet = {
  id: string
  template_exercise_id: string
  position: number
  set_type: SetType
  weight_kg: number | null
  reps: number | null
}

export type TemplateSetInsert = Omit<TemplateSet, 'id'>

// --- Inserts ---

export type WorkoutInsert = {
  started_at: string
  finished_at: string
  notes: string | null
}

export type WorkoutSetInsert = Omit<WorkoutSet, 'id'>

// --- Rest timer defaults per set type (in seconds) ---

export const REST_DEFAULTS: Record<SetType, number> = {
  warmup: 60,
  normal: 90,
  dropset: 30,
  failure: 120,
}
