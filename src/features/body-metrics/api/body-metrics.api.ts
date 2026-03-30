import { supabase } from '../hooks/useSupabase'
import type { BodyMetric, BodyMetricInsert } from '../types/body-metrics.types'

export async function fetchMetrics(): Promise<BodyMetric[]> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .order('recorded_at', { ascending: false })

  if (error) throw error
  return data
}

export async function insertMetric(metric: BodyMetricInsert): Promise<BodyMetric> {
  const { data, error } = await supabase
    .from('body_metrics')
    .insert(metric)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMetric(id: string): Promise<void> {
  const { error } = await supabase
    .from('body_metrics')
    .delete()
    .eq('id', id)

  if (error) throw error
}
