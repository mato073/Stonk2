import { useQuery } from '@tanstack/react-query'
import { fetchExercisesWithHistory, fetchExerciseHistory } from '../api/progression.api'

export function useExerciseList() {
  return useQuery({
    queryKey: ['progression-exercises'],
    queryFn: fetchExercisesWithHistory,
  })
}

export function useExerciseHistory(exerciseId: string | null) {
  return useQuery({
    queryKey: ['progression-history', exerciseId],
    queryFn: () => fetchExerciseHistory(exerciseId!),
    enabled: !!exerciseId,
  })
}
