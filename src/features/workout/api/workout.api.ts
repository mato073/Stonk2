import { supabase } from '../hooks/useSupabase'
import type {
  Exercise,
  WorkoutInsert,
  WorkoutSetInsert,
  WorkoutSet,
  WorkoutTemplate,
  TemplateExercise,
  TemplateExerciseInsert,
  TemplateSet,
  TemplateSetInsert,
  SetType,
} from '../types/workout.types'

export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, equipment')
    .order('name')

  if (error) throw error
  return data as Exercise[]
}

export async function fetchLastSetsForExercise(exerciseId: string): Promise<WorkoutSet[]> {
  // Find the most recent completed workout containing this exercise
  const { data: recentSets, error } = await supabase
    .from('workout_sets')
    .select('*, workouts!inner(finished_at)')
    .eq('exercise_id', exerciseId)
    .eq('completed', true)
    .not('workouts.finished_at', 'is', null)
    .order('workouts(finished_at)', { ascending: false })
    .limit(20)

  if (error || !recentSets || recentSets.length === 0) return []

  // Get only sets from the most recent workout
  const latestWorkoutId = (recentSets[0] as Record<string, unknown>).workout_id as string
  return recentSets
    .filter((s: Record<string, unknown>) => s.workout_id === latestWorkoutId)
    .map((s: Record<string, unknown>) => ({
      id: s.id as string,
      workout_id: s.workout_id as string,
      exercise_id: s.exercise_id as string,
      set_number: s.set_number as number,
      set_type: s.set_type as WorkoutSet['set_type'],
      weight_kg: s.weight_kg as number | null,
      reps: s.reps as number | null,
      completed: s.completed as boolean,
      rest_seconds: s.rest_seconds as number | null,
    }))
    .sort((a: WorkoutSet, b: WorkoutSet) => a.set_number - b.set_number)
}

export async function saveWorkout(
  workout: WorkoutInsert,
  sets: WorkoutSetInsert[],
): Promise<string> {
  const { data, error: wErr } = await supabase
    .from('workouts')
    .insert(workout)
    .select('id')
    .single()

  if (wErr || !data) throw wErr ?? new Error('Erreur lors de la sauvegarde')

  const workoutId = data.id as string

  if (sets.length > 0) {
    const rows = sets.map((s) => ({ ...s, workout_id: workoutId }))
    const { error: sErr } = await supabase.from('workout_sets').insert(rows)

    if (sErr) {
      // Rollback: delete the workout
      await supabase.from('workouts').delete().eq('id', workoutId)
      throw sErr
    }
  }

  return workoutId
}

// --- Templates ---

export async function fetchTemplates(): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as WorkoutTemplate[]
}

export async function createTemplate(name: string): Promise<WorkoutTemplate> {
  const { data, error } = await supabase
    .from('workout_templates')
    .insert({ name })
    .select('*')
    .single()

  if (error || !data) throw error ?? new Error('Erreur création template')
  return data as WorkoutTemplate
}

export async function updateTemplateName(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('workout_templates')
    .update({ name })
    .eq('id', id)

  if (error) throw error
}

export async function deleteTemplate(id: string): Promise<void> {
  // Delete exercises first (cascade may not be set up)
  await supabase.from('template_exercises').delete().eq('template_id', id)
  const { error } = await supabase.from('workout_templates').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
  const { data, error } = await supabase
    .from('template_exercises')
    .select('*, exercises(id, name, muscle_group, equipment)')
    .eq('template_id', templateId)
    .order('position')

  if (error) throw error

  return (data as Record<string, unknown>[]).map((row) => mapTemplateExercise(row))
}

function mapTemplateExercise(row: Record<string, unknown>): TemplateExercise {
  const ex = row.exercises as Record<string, unknown> | null
  return {
    id: row.id as string,
    template_id: row.template_id as string,
    exercise_id: row.exercise_id as string,
    position: row.position as number,
    sets_count: row.sets_count as number,
    set_type: row.set_type as TemplateExercise['set_type'],
    rest_warmup: (row.rest_warmup as number) ?? 60,
    rest_normal: (row.rest_normal as number) ?? 90,
    rest_dropset: (row.rest_dropset as number) ?? 30,
    rest_failure: (row.rest_failure as number) ?? 120,
    exercise: ex
      ? {
          id: ex.id as string,
          name: ex.name as string,
          muscle_group: ex.muscle_group as string,
          equipment: ex.equipment as string | null,
        }
      : undefined,
  }
}

export async function addTemplateExercise(data: TemplateExerciseInsert): Promise<TemplateExercise> {
  const { data: row, error } = await supabase
    .from('template_exercises')
    .insert(data)
    .select('*, exercises(id, name, muscle_group, equipment)')
    .single()

  if (error || !row) throw error ?? new Error('Erreur ajout exercice')
  return mapTemplateExercise(row as Record<string, unknown>)
}

export async function updateTemplateExercise(
  id: string,
  updates: Partial<Pick<TemplateExerciseInsert, 'sets_count' | 'set_type' | 'position'>> & Partial<import('../types/workout.types').RestConfig>,
): Promise<void> {
  const { error } = await supabase
    .from('template_exercises')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function removeTemplateExercise(id: string): Promise<void> {
  const { error } = await supabase
    .from('template_exercises')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// --- Template sets ---

export async function fetchTemplateSets(templateExerciseId: string): Promise<TemplateSet[]> {
  const { data, error } = await supabase
    .from('template_sets')
    .select('*')
    .eq('template_exercise_id', templateExerciseId)
    .order('position')

  if (error) throw error
  return data as TemplateSet[]
}

export async function fetchAllTemplateSets(templateExerciseIds: string[]): Promise<TemplateSet[]> {
  if (templateExerciseIds.length === 0) return []
  const { data, error } = await supabase
    .from('template_sets')
    .select('*')
    .in('template_exercise_id', templateExerciseIds)
    .order('position')

  if (error) throw error
  return data as TemplateSet[]
}

export async function addTemplateSet(data: TemplateSetInsert): Promise<TemplateSet> {
  const { data: row, error } = await supabase
    .from('template_sets')
    .insert(data)
    .select('*')
    .single()

  if (error || !row) throw error ?? new Error('Erreur ajout set')
  return row as TemplateSet
}

export async function updateTemplateSet(
  id: string,
  updates: Partial<Pick<TemplateSet, 'set_type' | 'weight_kg' | 'reps'>>,
): Promise<void> {
  const { error } = await supabase
    .from('template_sets')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function removeTemplateSet(id: string): Promise<void> {
  const { error } = await supabase
    .from('template_sets')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function syncTemplateSetsFromWorkout(
  updates: { id: string; weight_kg: number | null; reps: number | null; set_type: SetType }[],
  newSets: TemplateSetInsert[],
): Promise<void> {
  // Update existing template sets
  for (const u of updates) {
    await supabase
      .from('template_sets')
      .update({ weight_kg: u.weight_kg, reps: u.reps, set_type: u.set_type })
      .eq('id', u.id)
  }
  // Insert new sets (added during workout)
  if (newSets.length > 0) {
    await supabase.from('template_sets').insert(newSets)
  }
}

// --- Custom exercises ---

export async function createCustomExercise(
  name: string,
  muscleGroup: string,
  equipment: string | null,
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ name, muscle_group: muscleGroup, equipment })
    .select('id, name, muscle_group, equipment')
    .single()

  if (error || !data) throw error ?? new Error('Erreur création exercice')
  return data as Exercise
}
