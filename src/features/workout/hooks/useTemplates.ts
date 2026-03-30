import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/workout.api'
import type { TemplateSet } from '../types/workout.types'

const TEMPLATES_KEY = ['workout-templates']

export function useTemplates() {
  const qc = useQueryClient()

  const templates = useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: api.fetchTemplates,
  })

  const create = useMutation({
    mutationFn: (name: string) => api.createTemplate(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  })

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateTemplateName(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  })

  return { templates, create, rename, remove }
}

export function useTemplateExercises(templateId: string | null) {
  const qc = useQueryClient()
  const key = ['template-exercises', templateId]

  const exercises = useQuery({
    queryKey: key,
    queryFn: () => api.fetchTemplateExercises(templateId!),
    enabled: !!templateId,
  })

  const add = useMutation({
    mutationFn: api.addTemplateExercise,
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...updates }: { id: string; [key: string]: unknown }) =>
      api.updateTemplateExercise(id, updates as Parameters<typeof api.updateTemplateExercise>[1]),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.removeTemplateExercise(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { exercises, add, update, remove }
}

export function useTemplateSets(templateExerciseId: string | null) {
  const qc = useQueryClient()
  const key = ['template-sets', templateExerciseId]

  const sets = useQuery({
    queryKey: key,
    queryFn: () => api.fetchTemplateSets(templateExerciseId!),
    enabled: !!templateExerciseId,
  })

  const add = useMutation({
    mutationFn: api.addTemplateSet,
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const update = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Pick<TemplateSet, 'set_type' | 'weight_kg' | 'reps'>>) =>
      api.updateTemplateSet(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.removeTemplateSet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { sets, add, update, remove }
}
