import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/profile.api'
import type { Gender } from '../types/profile.types'

export function useProfile() {
  const qc = useQueryClient()

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: api.fetchProfile,
  })

  const update = useMutation({
    mutationFn: (data: { height_cm?: number | null; gender?: Gender | null }) =>
      api.upsertProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })

  return { profile, update }
}

export function useRecentMetrics() {
  return useQuery({
    queryKey: ['profile-metrics'],
    queryFn: () => api.fetchRecentMetrics(20),
  })
}
