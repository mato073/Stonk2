import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Trash2, X, Timer, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Exercise, SetType, TemplateSet, RestConfig } from '../types/workout.types'
import { AddExerciseDialog } from './AddExerciseDialog'
import { cn } from '@/lib/utils'
import * as api from '../api/workout.api'
import { useQueryClient } from '@tanstack/react-query'

const SET_TYPE_LABELS: Record<SetType, string> = {
  normal: 'Normal',
  warmup: 'Échauffement',
  dropset: 'Dropset',
  failure: 'Failure',
}

const SET_SHORT_LABELS: Record<SetType, string> = {
  warmup: 'E',
  normal: '#',
  dropset: 'D',
  failure: 'F',
}

const SET_BG_COLORS: Record<SetType, string> = {
  warmup: 'bg-orange-400/10',
  normal: 'bg-muted/50',
  dropset: 'bg-purple-400/10',
  failure: 'bg-red-400/10',
}

const SET_TEXT_COLORS: Record<SetType, string> = {
  warmup: 'text-orange-400',
  normal: 'text-foreground',
  dropset: 'text-purple-400',
  failure: 'text-red-400',
}

const ALL_TYPES: SetType[] = ['normal', 'warmup', 'dropset', 'failure']

// --- Local types for editing ---

type LocalSet = {
  localId: string
  dbId: string | null // null = new set
  set_type: SetType
  weight_kg: number | null
  reps: number | null
}

type LocalExercise = {
  localId: string
  dbId: string | null // null = new
  exercise: Exercise
  rest_warmup: number
  rest_normal: number
  rest_dropset: number
  rest_failure: number
  sets: LocalSet[]
  removed: boolean
}

type Props = {
  templateId: string
  templateName: string
  onBack: () => void
  onRename: (name: string) => void
}

export function TemplateEditor({ templateId, templateName, onBack, onRename }: Props) {
  const qc = useQueryClient()
  const [addExOpen, setAddExOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(templateName)
  const [exercises, setExercises] = useState<LocalExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [originalJson, setOriginalJson] = useState('')

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const teList = await api.fetchTemplateExercises(templateId)
        const teIds = teList.map((te) => te.id)
        const allSets = teIds.length > 0 ? await api.fetchAllTemplateSets(teIds) : []

        const setsMap = new Map<string, TemplateSet[]>()
        for (const s of allSets) {
          if (!setsMap.has(s.template_exercise_id)) setsMap.set(s.template_exercise_id, [])
          setsMap.get(s.template_exercise_id)!.push(s)
        }

        const local: LocalExercise[] = teList.map((te) => ({
          localId: crypto.randomUUID(),
          dbId: te.id,
          exercise: te.exercise!,
          rest_warmup: te.rest_warmup,
          rest_normal: te.rest_normal,
          rest_dropset: te.rest_dropset,
          rest_failure: te.rest_failure,
          removed: false,
          sets: (setsMap.get(te.id) ?? []).map((s) => ({
            localId: crypto.randomUUID(),
            dbId: s.id,
            set_type: s.set_type,
            weight_kg: s.weight_kg,
            reps: s.reps,
          })),
        }))

        setExercises(local)
        setOriginalJson(JSON.stringify(local))
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [templateId])

  // Track dirty state
  useEffect(() => {
    if (!loading) {
      setDirty(JSON.stringify(exercises) !== originalJson || name !== templateName)
    }
  }, [exercises, name, originalJson, loading, templateName])

  function handleAddExercise(exercise: Exercise) {
    setExercises((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        dbId: null,
        exercise,
        rest_warmup: 60,
        rest_normal: 90,
        rest_dropset: 30,
        rest_failure: 120,
        removed: false,
        sets: [{ localId: crypto.randomUUID(), dbId: null, set_type: 'normal', weight_kg: null, reps: null }],
      },
    ])
  }

  function handleRemoveExercise(localId: string) {
    setExercises((prev) =>
      prev.map((e) => (e.localId === localId ? { ...e, removed: true } : e)),
    )
  }

  function handleUpdateRest(localId: string, rest: Partial<RestConfig>) {
    setExercises((prev) =>
      prev.map((e) => (e.localId === localId ? { ...e, ...rest } : e)),
    )
  }

  function handleAddSet(exLocalId: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.localId !== exLocalId) return e
        const last = e.sets[e.sets.length - 1]
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              localId: crypto.randomUUID(),
              dbId: null,
              set_type: last?.set_type ?? 'normal',
              weight_kg: last?.weight_kg ?? null,
              reps: last?.reps ?? null,
            },
          ],
        }
      }),
    )
  }

  function handleRemoveSet(exLocalId: string, setLocalId: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.localId !== exLocalId) return e
        return { ...e, sets: e.sets.filter((s) => s.localId !== setLocalId) }
      }),
    )
  }

  function handleUpdateSet(
    exLocalId: string,
    setLocalId: string,
    field: 'set_type' | 'weight_kg' | 'reps',
    value: SetType | number | null,
  ) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.localId !== exLocalId) return e
        return {
          ...e,
          sets: e.sets.map((s) =>
            s.localId === setLocalId ? { ...s, [field]: value } : s,
          ),
        }
      }),
    )
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // Rename if changed
      if (name.trim() && name.trim() !== templateName) {
        await api.updateTemplateName(templateId, name.trim())
        onRename(name.trim())
      }

      // Parse original to diff
      const original: LocalExercise[] = originalJson ? JSON.parse(originalJson) : []
      const originalExIds = new Set(original.filter((e) => e.dbId).map((e) => e.dbId!))
      // 1. Delete removed exercises
      for (const ex of exercises) {
        if (ex.removed && ex.dbId) {
          // Delete sets first
          for (const s of ex.sets) {
            if (s.dbId) await api.removeTemplateSet(s.dbId)
          }
          await api.removeTemplateExercise(ex.dbId)
        }
      }

      // Also delete exercises that were in original but no longer in list
      const currentExDbIds = new Set(exercises.filter((e) => !e.removed && e.dbId).map((e) => e.dbId!))
      for (const id of originalExIds) {
        if (!currentExDbIds.has(id)) {
          await api.removeTemplateExercise(id)
        }
      }

      const activeExercises = exercises.filter((e) => !e.removed)

      for (let i = 0; i < activeExercises.length; i++) {
        const ex = activeExercises[i]

        if (ex.dbId) {
          // Update existing exercise
          await api.updateTemplateExercise(ex.dbId, {
            position: i,
            rest_warmup: ex.rest_warmup,
            rest_normal: ex.rest_normal,
            rest_dropset: ex.rest_dropset,
            rest_failure: ex.rest_failure,
          })

          // Handle sets
          const currentSetDbIds = new Set(ex.sets.filter((s) => s.dbId).map((s) => s.dbId!))
          const origEx = original.find((o) => o.dbId === ex.dbId)
          const origSetIds2 = new Set(
            (origEx?.sets ?? []).filter((s) => s.dbId).map((s) => s.dbId!),
          )

          // Delete removed sets
          for (const sid of origSetIds2) {
            if (!currentSetDbIds.has(sid)) {
              await api.removeTemplateSet(sid)
            }
          }

          // Update or create sets
          for (let j = 0; j < ex.sets.length; j++) {
            const s = ex.sets[j]
            if (s.dbId) {
              await api.updateTemplateSet(s.dbId, {
                set_type: s.set_type,
                weight_kg: s.weight_kg,
                reps: s.reps,
              })
            } else {
              await api.addTemplateSet({
                template_exercise_id: ex.dbId,
                position: j,
                set_type: s.set_type,
                weight_kg: s.weight_kg,
                reps: s.reps,
              })
            }
          }
        } else {
          // Create new exercise
          const created = await api.addTemplateExercise({
            template_id: templateId,
            exercise_id: ex.exercise.id,
            position: i,
            sets_count: ex.sets.length,
            set_type: 'normal',
            rest_warmup: ex.rest_warmup,
            rest_normal: ex.rest_normal,
            rest_dropset: ex.rest_dropset,
            rest_failure: ex.rest_failure,
          })

          // Create sets
          for (let j = 0; j < ex.sets.length; j++) {
            const s = ex.sets[j]
            await api.addTemplateSet({
              template_exercise_id: created.id,
              position: j,
              set_type: s.set_type,
              weight_kg: s.weight_kg,
              reps: s.reps,
            })
          }
        }
      }

      // Invalidate queries
      qc.invalidateQueries({ queryKey: ['template-exercises'] })
      qc.invalidateQueries({ queryKey: ['template-sets'] })
      qc.invalidateQueries({ queryKey: ['workout-templates'] })

      // Update original snapshot
      const active = exercises.filter((e) => !e.removed)
      setOriginalJson(JSON.stringify(active))
      setExercises(active)
      setDirty(false)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }, [exercises, name, templateName, templateId, originalJson, onRename, qc])

  function handleNameBlur() {
    setEditingName(false)
  }

  const activeExercises = exercises.filter((e) => !e.removed)

  return (
    <div className="mx-auto max-w-lg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <Input
                autoFocus
                className="h-8 text-lg font-bold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-xl font-bold truncate block"
              >
                {name}
              </button>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            <Save className="size-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {loading && (
        <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
      )}

      {/* Exercise list */}
      <div className="space-y-4 p-4">
        {activeExercises.length === 0 && !loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun exercice — ajoutes-en un
          </p>
        )}

        {activeExercises.map((ex) => (
          <LocalExerciseCard
            key={ex.localId}
            ex={ex}
            onUpdateRest={(rest) => handleUpdateRest(ex.localId, rest)}
            onRemove={() => handleRemoveExercise(ex.localId)}
            onAddSet={() => handleAddSet(ex.localId)}
            onRemoveSet={(setLocalId) => handleRemoveSet(ex.localId, setLocalId)}
            onUpdateSet={(setLocalId, field, value) =>
              handleUpdateSet(ex.localId, setLocalId, field, value)
            }
          />
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setAddExOpen(true)}
        >
          <Plus className="size-4" />
          Ajouter un exercice
        </Button>
      </div>

      <AddExerciseDialog
        open={addExOpen}
        onOpenChange={setAddExOpen}
        onSelect={handleAddExercise}
      />
    </div>
  )
}

// --- Exercise card ---

const REST_FIELDS: { key: keyof RestConfig; label: string; color: string }[] = [
  { key: 'rest_warmup', label: 'Échauffement', color: 'text-orange-400' },
  { key: 'rest_normal', label: 'Normal', color: 'text-foreground' },
  { key: 'rest_dropset', label: 'Dropset', color: 'text-purple-400' },
  { key: 'rest_failure', label: 'Failure', color: 'text-red-400' },
]

function LocalExerciseCard({
  ex,
  onUpdateRest,
  onRemove,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
}: {
  ex: LocalExercise
  onUpdateRest: (rest: Partial<RestConfig>) => void
  onRemove: () => void
  onAddSet: () => void
  onRemoveSet: (setLocalId: string) => void
  onUpdateSet: (setLocalId: string, field: 'set_type' | 'weight_kg' | 'reps', value: SetType | number | null) => void
}) {
  const [showRest, setShowRest] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3">
        <h3 className="text-base font-bold text-primary">
          {ex.exercise?.name ?? 'Exercice inconnu'}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowRest(!showRest)}
            className={showRest ? 'text-primary' : ''}
          >
            <Timer className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {ex.exercise?.equipment && (
        <p className="px-3 text-xs text-muted-foreground">{ex.exercise.equipment}</p>
      )}

      {/* Rest timer config */}
      {showRest && (
        <div className="mx-3 mt-2 rounded-lg bg-muted/50 p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Temps de repos (secondes)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {REST_FIELDS.map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-2">
                <span className={cn('text-xs font-medium w-24 truncate', color)}>{label}</span>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  className="h-7 w-16 px-1 text-center text-xs"
                  value={ex[key]}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v) && v >= 0) onUpdateRest({ [key]: v })
                  }}
                />
                <span className="text-[10px] text-muted-foreground">s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table header */}
      <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_1.5rem] items-center gap-1 px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-center">Série</span>
        <span>Type</span>
        <span className="text-center">KG</span>
        <span className="text-center">Reps</span>
        <span />
      </div>

      {/* Set rows */}
      <div className="pb-1 px-1">
        {ex.sets.length === 0 && (
          <p className="py-3 text-center text-xs text-muted-foreground">Aucune série</p>
        )}

        {ex.sets.map((s, i) => {
          const label = s.set_type === 'normal' || s.set_type === 'failure'
            ? String(i + 1)
            : SET_SHORT_LABELS[s.set_type]

          return (
            <div
              key={s.localId}
              className={cn(
                'grid grid-cols-[2.5rem_1fr_4rem_4rem_1.5rem] items-center gap-1 px-2 py-1.5 rounded-lg',
                SET_BG_COLORS[s.set_type],
              )}
            >
              <span className={cn('text-center text-sm font-bold', SET_TEXT_COLORS[s.set_type])}>
                {label}
              </span>

              <select
                value={s.set_type}
                onChange={(e) => onUpdateSet(s.localId, 'set_type', e.target.value as SetType)}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium border-0 cursor-pointer bg-transparent',
                  SET_TEXT_COLORS[s.set_type],
                )}
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>{SET_TYPE_LABELS[t]}</option>
                ))}
              </select>

              <Input
                type="number"
                step="0.5"
                min="0"
                placeholder="kg"
                className="h-8 px-1 text-center text-sm"
                value={s.weight_kg ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  onUpdateSet(s.localId, 'weight_kg', v === '' ? null : parseFloat(v))
                }}
              />

              <Input
                type="number"
                min="0"
                placeholder="reps"
                className="h-8 px-1 text-center text-sm"
                value={s.reps ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  onUpdateSet(s.localId, 'reps', v === '' ? null : parseInt(v, 10))
                }}
              />

              <button
                onClick={() => onRemoveSet(s.localId)}
                className="text-muted-foreground/50 hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add set */}
      <button
        onClick={onAddSet}
        className="flex w-full items-center justify-center gap-1 border-t border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="size-4" />
        Ajouter une série
      </button>
    </div>
  )
}
