import { useQuery } from '@tanstack/react-query'
import { fetchWorkoutSummary, fetchBodyMetricsSummary, fetchWorkoutCounts } from '../api/dashboard.api'

function getDateNDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function useDashboard() {
  const since = getDateNDaysAgo(30)

  const workouts = useQuery({
    queryKey: ['dashboard-workouts', since],
    queryFn: () => fetchWorkoutSummary(since),
  })

  const metrics = useQuery({
    queryKey: ['dashboard-metrics', since],
    queryFn: () => fetchBodyMetricsSummary(since),
  })

  const counts = useQuery({
    queryKey: ['dashboard-counts'],
    queryFn: fetchWorkoutCounts,
  })

  return { workouts, metrics, counts }
}
