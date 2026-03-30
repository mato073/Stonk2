import { useQuery } from '@tanstack/react-query'
import { fetchExercises } from '../api/workout.api'

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    staleTime: 1000 * 60 * 10, // 10 min
  })
}
