import { useReducer, useCallback, useState } from 'react'
import type {
  ActiveWorkoutState,
  Exercise,
  LocalExercise,
  LocalSet,
  SetType,
  TemplateExercise,
  TemplateSet,
  WorkoutSetInsert,
} from '../types/workout.types'
import { saveWorkout, syncTemplateSetsFromWorkout } from '../api/workout.api'
import type { TemplateSetInsert } from '../types/workout.types'

// --- Actions ---

export type Action =
  | { type: 'START' }
  | { type: 'START_FROM_TEMPLATE'; templateExercises: TemplateExercise[]; templateSets: Record<string, TemplateSet[]> }
  | { type: 'RESET' }
  | { type: 'ADD_EXERCISE'; exercise: Exercise; previousSets: { weight_kg: number | null; reps: number | null; set_type: SetType }[] }
  | { type: 'REMOVE_EXERCISE'; localId: string }
  | { type: 'UPDATE_EXERCISE_NOTES'; localId: string; notes: string }
  | { type: 'ADD_SET'; exerciseLocalId: string }
  | { type: 'REMOVE_SET'; exerciseLocalId: string; setLocalId: string }
  | { type: 'UPDATE_SET'; exerciseLocalId: string; setLocalId: string; field: 'weight_kg' | 'reps' | 'set_type'; value: number | null | SetType }
  | { type: 'TOGGLE_SET_COMPLETED'; exerciseLocalId: string; setLocalId: string }
  | { type: 'UPDATE_NOTES'; notes: string }

function makeSet(num: number, setType: SetType = 'normal', previous: string | null = null): LocalSet {
  return {
    localId: crypto.randomUUID(),
    set_number: num,
    set_type: setType,
    weight_kg: null,
    reps: null,
    completed: false,
    previous,
  }
}

function formatPrevious(weight: number | null, reps: number | null): string | null {
  if (weight == null && reps == null) return null
  return `${weight ?? '—'} kg × ${reps ?? '—'}`
}

function renumberSets(sets: LocalSet[]): LocalSet[] {
  let normalIdx = 0
  return sets.map((s) => {
    if (s.set_type === 'normal' || s.set_type === 'failure') normalIdx++
    return { ...s, set_number: s.set_type === 'warmup' || s.set_type === 'dropset' ? s.set_number : normalIdx }
  })
}

function templateToLocalExercises(
  templateExercises: TemplateExercise[],
  templateSets: Record<string, TemplateSet[]>,
): LocalExercise[] {
  return templateExercises
    .filter((te) => te.exercise)
    .map((te) => {
      const tSets = templateSets[te.id] ?? []
      const sets: LocalSet[] = tSets.length > 0
        ? tSets.map((ts, i) => ({
            localId: crypto.randomUUID(),
            set_number: i + 1,
            set_type: ts.set_type,
            weight_kg: ts.weight_kg,
            reps: ts.reps,
            completed: false,
            previous: null,
            templateSetId: ts.id,
          }))
        : [makeSet(1)]

      return {
        localId: crypto.randomUUID(),
        exercise: te.exercise!,
        notes: '',
        sets,
        templateExerciseId: te.id,
        restConfig: {
          rest_warmup: te.rest_warmup,
          rest_normal: te.rest_normal,
          rest_dropset: te.rest_dropset,
          rest_failure: te.rest_failure,
        },
      }
    })
}

function reducer(state: ActiveWorkoutState | null, action: Action): ActiveWorkoutState | null {
  if (action.type === 'START') {
    return { startedAt: new Date(), exercises: [], notes: '' }
  }

  if (action.type === 'START_FROM_TEMPLATE') {
    return {
      startedAt: new Date(),
      exercises: templateToLocalExercises(action.templateExercises, action.templateSets),
      notes: '',
    }
  }

  if (action.type === 'RESET') return null
  if (!state) return null

  switch (action.type) {
    case 'ADD_EXERCISE': {
      const sets: LocalSet[] = action.previousSets.length > 0
        ? action.previousSets.map((ps, i) =>
            makeSet(i + 1, ps.set_type, formatPrevious(ps.weight_kg, ps.reps)),
          )
        : [makeSet(1)]

      const newExercise: LocalExercise = {
        localId: crypto.randomUUID(),
        exercise: action.exercise,
        notes: '',
        sets,
      }
      return { ...state, exercises: [...state.exercises, newExercise] }
    }

    case 'REMOVE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter((e) => e.localId !== action.localId),
      }

    case 'UPDATE_EXERCISE_NOTES':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.localId === action.localId ? { ...e, notes: action.notes } : e,
        ),
      }

    case 'ADD_SET': {
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.localId !== action.exerciseLocalId) return e
          const lastSet = e.sets[e.sets.length - 1]
          const newSet = makeSet(
            e.sets.length + 1,
            lastSet?.set_type ?? 'normal',
          )
          return { ...e, sets: [...e.sets, newSet] }
        }),
      }
    }

    case 'REMOVE_SET':
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.localId !== action.exerciseLocalId) return e
          const filtered = e.sets.filter((s) => s.localId !== action.setLocalId)
          return { ...e, sets: renumberSets(filtered) }
        }),
      }

    case 'UPDATE_SET':
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.localId !== action.exerciseLocalId) return e
          return {
            ...e,
            sets: e.sets.map((s) => {
              if (s.localId !== action.setLocalId) return s
              return { ...s, [action.field]: action.value }
            }),
          }
        }),
      }

    case 'TOGGLE_SET_COMPLETED':
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.localId !== action.exerciseLocalId) return e
          return {
            ...e,
            sets: e.sets.map((s) => {
              if (s.localId !== action.setLocalId) return s
              return { ...s, completed: !s.completed }
            }),
          }
        }),
      }

    case 'UPDATE_NOTES':
      return { ...state, notes: action.notes }

    default:
      return state
  }
}

export function useActiveWorkout() {
  const [state, dispatch] = useReducer(reducer, null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startWorkout = useCallback(() => dispatch({ type: 'START' }), [])
  const startFromTemplate = useCallback(
    (templateExercises: TemplateExercise[], templateSets: Record<string, TemplateSet[]>) =>
      dispatch({ type: 'START_FROM_TEMPLATE', templateExercises, templateSets }),
    [],
  )
  const cancelWorkout = useCallback(() => dispatch({ type: 'RESET' }), [])

  const finishWorkout = useCallback(async () => {
    if (!state) return
    setSaving(true)
    setError(null)

    try {
      const now = new Date().toISOString()
      const sets: WorkoutSetInsert[] = []

      for (const ex of state.exercises) {
        for (const s of ex.sets) {
          sets.push({
            workout_id: '', // will be filled by API
            exercise_id: ex.exercise.id,
            set_number: s.set_number,
            set_type: s.set_type,
            weight_kg: s.weight_kg,
            reps: s.reps,
            completed: s.completed,
            rest_seconds: null,
          })
        }
      }

      await saveWorkout(
        {
          started_at: state.startedAt.toISOString(),
          finished_at: now,
          notes: state.notes || null,
        },
        sets,
      )

      // Sync weights/reps back to template sets
      const templateUpdates: { id: string; weight_kg: number | null; reps: number | null; set_type: SetType }[] = []
      const templateNewSets: TemplateSetInsert[] = []

      for (const ex of state.exercises) {
        for (const s of ex.sets) {
          if (s.templateSetId) {
            // Existing template set — update it
            templateUpdates.push({
              id: s.templateSetId,
              weight_kg: s.weight_kg,
              reps: s.reps,
              set_type: s.set_type,
            })
          } else if (ex.templateExerciseId) {
            // New set added during workout — create in template
            templateNewSets.push({
              template_exercise_id: ex.templateExerciseId,
              position: s.set_number - 1,
              set_type: s.set_type,
              weight_kg: s.weight_kg,
              reps: s.reps,
            })
          }
        }
      }

      if (templateUpdates.length > 0 || templateNewSets.length > 0) {
        try {
          await syncTemplateSetsFromWorkout(templateUpdates, templateNewSets)
        } catch {
          // Non-blocking: workout is already saved
        }
      }

      dispatch({ type: 'RESET' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [state])

  return {
    state,
    dispatch,
    isActive: state !== null,
    startWorkout,
    startFromTemplate,
    finishWorkout,
    cancelWorkout,
    saving,
    error,
  }
}
