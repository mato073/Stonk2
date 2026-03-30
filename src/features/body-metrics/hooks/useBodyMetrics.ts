import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/body-metrics.api'
import type { BodyMetricInsert } from '../types/body-metrics.types'

const QUERY_KEY = ['body-metrics']

export function useBodyMetrics() {
  const queryClient = useQueryClient()

  const metrics = useQuery({
    queryKey: QUERY_KEY,
    queryFn: api.fetchMetrics,
  })

  const insert = useMutation({
    mutationFn: (metric: BodyMetricInsert) => api.insertMetric(metric),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteMetric(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  return { metrics, insert, remove }
}
