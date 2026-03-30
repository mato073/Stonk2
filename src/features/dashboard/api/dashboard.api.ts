import { supabase } from '../hooks/useSupabase'
import type { WorkoutSummary, BodyMetricsSummary } from '../types/dashboard.types'

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return user.id
}

const MEASUREMENT_LABELS: { key: string; label: string }[] = [
  { key: 'neck_cm', label: 'Cou' },
  { key: 'shoulders_cm', label: 'Épaules' },
  { key: 'chest_cm', label: 'Poitrine' },
  { key: 'waist_cm', label: 'Taille' },
  { key: 'hips_cm', label: 'Hanches' },
  { key: 'arms_left_cm', label: 'Bras G' },
  { key: 'arms_right_cm', label: 'Bras D' },
  { key: 'legs_left_cm', label: 'Cuisse G' },
  { key: 'legs_right_cm', label: 'Cuisse D' },
]

export async function fetchWorkoutSummary(since: string): Promise<WorkoutSummary> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('workouts')
    .select('id, started_at, finished_at')
    .eq('user_id', userId)
    .gte('started_at', since)
    .not('finished_at', 'is', null)
    .order('started_at', { ascending: false })

  if (error) throw error

  const workouts = (data ?? []) as { id: string; started_at: string; finished_at: string }[]

  if (workouts.length === 0) {
    return { totalWorkouts: 0, totalSets: 0, totalVolume: 0, avgDuration: 0, workouts: [] }
  }

  // Fetch sets for these workouts
  const ids = workouts.map((w) => w.id)
  const { data: setsData, error: sErr } = await supabase
    .from('workout_sets')
    .select('workout_id, weight_kg, reps, completed')
    .in('workout_id', ids)
    .eq('completed', true)

  if (sErr) throw sErr

  const sets = (setsData ?? []) as { workout_id: string; weight_kg: number | null; reps: number | null; completed: boolean }[]

  let totalSets = 0
  let totalVolume = 0
  const setsPerWorkout = new Map<string, number>()

  for (const s of sets) {
    totalSets++
    totalVolume += (s.weight_kg ?? 0) * (s.reps ?? 0)
    setsPerWorkout.set(s.workout_id, (setsPerWorkout.get(s.workout_id) ?? 0) + 1)
  }

  let totalDuration = 0
  for (const w of workouts) {
    const start = new Date(w.started_at).getTime()
    const end = new Date(w.finished_at).getTime()
    totalDuration += (end - start) / 1000 / 60
  }

  return {
    totalWorkouts: workouts.length,
    totalSets,
    totalVolume: Math.round(totalVolume),
    avgDuration: Math.round(totalDuration / workouts.length),
    workouts: workouts.map((w) => ({
      ...w,
      sets_count: setsPerWorkout.get(w.id) ?? 0,
    })),
  }
}

export async function fetchBodyMetricsSummary(since: string): Promise<BodyMetricsSummary> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as Record<string, unknown>[]

  if (rows.length === 0) {
    return {
      weightStart: null,
      weightEnd: null,
      weightDelta: null,
      measurements: MEASUREMENT_LABELS.map((m) => ({
        ...m,
        start: null,
        end: null,
        delta: null,
      })),
    }
  }

  function firstNonNull(key: string): number | null {
    for (const r of rows) {
      if (r[key] != null) return r[key] as number
    }
    return null
  }

  function lastNonNull(key: string): number | null {
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i][key] != null) return rows[i][key] as number
    }
    return null
  }

  const weightStart = firstNonNull('weight_kg')
  const weightEnd = lastNonNull('weight_kg')

  return {
    weightStart,
    weightEnd,
    weightDelta: weightStart != null && weightEnd != null
      ? Math.round((weightEnd - weightStart) * 10) / 10
      : null,
    measurements: MEASUREMENT_LABELS.map((m) => {
      const start = firstNonNull(m.key)
      const end = lastNonNull(m.key)
      return {
        ...m,
        start,
        end,
        delta: start != null && end != null ? Math.round((end - start) * 10) / 10 : null,
      }
    }),
  }
}
