import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, X, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTemplateExercises, useTemplateSets } from '../hooks/useTemplates'
import type { Exercise, SetType, TemplateExercise, RestConfig } from '../types/workout.types'
import { AddExerciseDialog } from './AddExerciseDialog'
import { cn } from '@/lib/utils'

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

type Props = {
  templateId: string
  templateName: string
  onBack: () => void
  onRename: (name: string) => void
}

export function TemplateEditor({ templateId, templateName, onBack, onRename }: Props) {
  const { exercises, add, update, remove } = useTemplateExercises(templateId)
  const [addExOpen, setAddExOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(templateName)

  const data = exercises.data ?? []

  function handleAddExercise(exercise: Exercise) {
    add.mutate({
      template_id: templateId,
      exercise_id: exercise.id,
      position: data.length,
      sets_count: 0,
      set_type: 'normal',
    })
  }

  function handleNameBlur() {
    setEditingName(false)
    if (name.trim() && name.trim() !== templateName) {
      onRename(name.trim())
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </button>
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
            className="text-xl font-bold"
          >
            {templateName}
          </button>
        )}
      </div>

      {/* Exercise list */}
      <div className="space-y-4 px-4">
        {exercises.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
        )}

        {data.length === 0 && !exercises.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun exercice — ajoutes-en un
          </p>
        )}

        {data.map((te) => (
          <TemplateExerciseCard
            key={te.id}
            te={te}
            onUpdateRest={(rest) => update.mutate({ id: te.id, ...rest })}
            onRemove={() => remove.mutate(te.id)}
            removing={remove.isPending}
          />
        ))}

        {/* Add exercise button */}
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

// --- Exercise card with real set rows ---

const REST_FIELDS: { key: keyof RestConfig; label: string; color: string }[] = [
  { key: 'rest_warmup', label: 'Échauffement', color: 'text-orange-400' },
  { key: 'rest_normal', label: 'Normal', color: 'text-foreground' },
  { key: 'rest_dropset', label: 'Dropset', color: 'text-purple-400' },
  { key: 'rest_failure', label: 'Failure', color: 'text-red-400' },
]

function TemplateExerciseCard({
  te,
  onUpdateRest,
  onRemove,
  removing,
}: {
  te: TemplateExercise
  onUpdateRest: (rest: Partial<RestConfig>) => void
  onRemove: () => void
  removing: boolean
}) {
  const { sets, add, update, remove } = useTemplateSets(te.id)
  const [showRest, setShowRest] = useState(false)
  const setList = sets.data ?? []

  function handleAddSet() {
    const lastSet = setList[setList.length - 1]
    add.mutate({
      template_exercise_id: te.id,
      position: setList.length,
      set_type: lastSet?.set_type ?? 'normal',
      weight_kg: lastSet?.weight_kg ?? null,
      reps: lastSet?.reps ?? null,
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3">
        <h3 className="text-base font-bold text-primary">
          {te.exercise?.name ?? 'Exercice inconnu'}
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
          <Button variant="ghost" size="icon-sm" onClick={onRemove} disabled={removing}>
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {te.exercise?.equipment && (
        <p className="px-3 text-xs text-muted-foreground">{te.exercise.equipment}</p>
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
                  value={te[key]}
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
        {sets.isLoading && (
          <p className="py-4 text-center text-xs text-muted-foreground">Chargement...</p>
        )}

        {setList.map((s, i) => (
          <TemplateSetRow
            key={s.id}
            set={s}
            index={i}
            onUpdate={(field, value) => update.mutate({ id: s.id, [field]: value })}
            onRemove={() => remove.mutate(s.id)}
          />
        ))}

        {!sets.isLoading && setList.length === 0 && (
          <p className="py-3 text-center text-xs text-muted-foreground">Aucune série</p>
        )}
      </div>

      {/* Add set */}
      <button
        onClick={handleAddSet}
        className="flex w-full items-center justify-center gap-1 border-t border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="size-4" />
        Ajouter une série
      </button>
    </div>
  )
}

// --- Individual set row ---

function TemplateSetRow({
  set,
  index,
  onUpdate,
  onRemove,
}: {
  set: { id: string; set_type: SetType; weight_kg: number | null; reps: number | null }
  index: number
  onUpdate: (field: 'set_type' | 'weight_kg' | 'reps', value: SetType | number | null) => void
  onRemove: () => void
}) {
  const label = set.set_type === 'normal' || set.set_type === 'failure'
    ? String(index + 1)
    : SET_SHORT_LABELS[set.set_type]

  return (
    <div className={cn(
      'grid grid-cols-[2.5rem_1fr_4rem_4rem_1.5rem] items-center gap-1 px-2 py-1.5 rounded-lg',
      SET_BG_COLORS[set.set_type],
    )}>
      {/* Set label */}
      <span className={cn('text-center text-sm font-bold', SET_TEXT_COLORS[set.set_type])}>
        {label}
      </span>

      {/* Type dropdown */}
      <select
        value={set.set_type}
        onChange={(e) => onUpdate('set_type', e.target.value as SetType)}
        className={cn(
          'rounded-md px-2 py-1 text-xs font-medium border-0 cursor-pointer bg-transparent',
          SET_TEXT_COLORS[set.set_type],
        )}
      >
        {ALL_TYPES.map((t) => (
          <option key={t} value={t}>{SET_TYPE_LABELS[t]}</option>
        ))}
      </select>

      {/* Weight */}
      <Input
        type="number"
        step="0.5"
        min="0"
        placeholder="kg"
        className="h-8 px-1 text-center text-sm"
        value={set.weight_kg ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onUpdate('weight_kg', v === '' ? null : parseFloat(v))
        }}
      />

      {/* Reps */}
      <Input
        type="number"
        min="0"
        placeholder="reps"
        className="h-8 px-1 text-center text-sm"
        value={set.reps ?? ''}
        onChange={(e) => {
          const v = e.target.value
          onUpdate('reps', v === '' ? null : parseInt(v, 10))
        }}
      />

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-muted-foreground/50 hover:text-destructive"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
