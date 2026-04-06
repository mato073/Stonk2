import { supabase } from '../hooks/useSupabase'
import type { Exercise, WorkoutEntry, HistorySet } from '../types/progression.types'

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return user.id
}

export async function fetchExercisesWithHistory(): Promise<Exercise[]> {
  const userId = await getUserId()

  // Get all exercise IDs the user has used in completed workouts
  const { data: workoutIds, error: wErr } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)

  if (wErr) throw wErr
  if (!workoutIds || workoutIds.length === 0) return []

  const ids = workoutIds.map((w) => (w as { id: string }).id)

  const { data: sets, error: sErr } = await supabase
    .from('workout_sets')
    .select('exercise_id')
    .in('workout_id', ids)
    .eq('completed', true)

  if (sErr) throw sErr
  if (!sets || sets.length === 0) return []

  const exerciseIds = [...new Set(sets.map((s) => (s as { exercise_id: string }).exercise_id))]

  const { data: exercises, error: eErr } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, equipment')
    .in('id', exerciseIds)
    .order('name')

  if (eErr) throw eErr
  return (exercises ?? []) as Exercise[]
}

export async function fetchExerciseHistory(exerciseId: string): Promise<WorkoutEntry[]> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('workout_sets')
    .select('set_number, set_type, weight_kg, reps, completed, workout_id, workouts!inner(started_at, finished_at, user_id)')
    .eq('exercise_id', exerciseId)
    .eq('workouts.user_id', userId)
    .not('workouts.finished_at', 'is', null)
    .order('workouts(started_at)', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as Record<string, unknown>[]

  // Group by workout
  const grouped = new Map<string, { started_at: string; finished_at: string; sets: HistorySet[] }>()

  for (const row of rows) {
    const workoutId = row.workout_id as string
    const workout = row.workouts as { started_at: string; finished_at: string }

    if (!grouped.has(workoutId)) {
      grouped.set(workoutId, {
        started_at: workout.started_at,
        finished_at: workout.finished_at,
        sets: [],
      })
    }

    grouped.get(workoutId)!.sets.push({
      set_number: row.set_number as number,
      set_type: row.set_type as HistorySet['set_type'],
      weight_kg: row.weight_kg as number | null,
      reps: row.reps as number | null,
      completed: row.completed as boolean,
    })
  }

  // Sort sets within each workout
  const entries: WorkoutEntry[] = []
  for (const [workoutId, entry] of grouped) {
    entry.sets.sort((a, b) => a.set_number - b.set_number)
    entries.push({ workout_id: workoutId, ...entry })
  }

  // Sort by date desc
  entries.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

  return entries
}
