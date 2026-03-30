import { supabase } from '../hooks/useSupabase'
import type { BodyMetric, BodyMetricInsert } from '../types/body-metrics.types'

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return user.id
}

export async function fetchMetrics(): Promise<BodyMetric[]> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })

  if (error) throw error
  return data
}

export async function insertMetric(metric: BodyMetricInsert): Promise<BodyMetric> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('body_metrics')
    .insert({ ...metric, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMetric(id: string): Promise<void> {
  const userId = await getUserId()
  const { error } = await supabase
    .from('body_metrics')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}
