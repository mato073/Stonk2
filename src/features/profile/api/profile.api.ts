import { supabase } from '../hooks/useSupabase'
import type { Profile, Gender } from '../types/profile.types'

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data as Profile | null
}

export async function upsertProfile(updates: { height_cm?: number | null; gender?: Gender | null }): Promise<Profile> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates })
    .select('*')
    .single()

  if (error || !data) throw error ?? new Error('Erreur sauvegarde profil')
  return data as Profile
}

// Fetch body metrics (own copy — feature isolation)
export type MetricRow = {
  recorded_at: string
  weight_kg: number | null
  neck_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  shoulders_cm: number | null
  chest_cm: number | null
  arms_left_cm: number | null
  arms_right_cm: number | null
  legs_left_cm: number | null
  legs_right_cm: number | null
}

export async function fetchRecentMetrics(limit: number = 20): Promise<MetricRow[]> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('recorded_at, weight_kg, neck_cm, waist_cm, hips_cm, shoulders_cm, chest_cm, arms_left_cm, arms_right_cm, legs_left_cm, legs_right_cm')
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as MetricRow[]
}
