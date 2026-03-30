import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LocalExercise, SetType } from '../types/workout.types'
import { SetRow } from './SetRow'

type Props = {
  localExercise: LocalExercise
  onUpdateNotes: (notes: string) => void
  onAddSet: () => void
  onRemoveExercise: () => void
  onUpdateSet: (setLocalId: string, field: 'weight_kg' | 'reps' | 'set_type', value: number | null | SetType) => void
  onToggleSet: (setLocalId: string) => void
  onRemoveSet: (setLocalId: string) => void
  onSetCompleted: (setType: SetType) => void
}

export function ExerciseCard({
  localExercise,
  onUpdateNotes,
  onAddSet,
  onRemoveExercise,
  onUpdateSet,
  onToggleSet,
  onRemoveSet,
  onSetCompleted,
}: Props) {
  const { exercise, notes, sets } = localExercise

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3">
        <h3 className="text-base font-bold text-primary">{exercise.name}</h3>
        <Button variant="ghost" size="icon-sm" onClick={onRemoveExercise}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {exercise.equipment && (
        <p className="px-3 text-xs text-muted-foreground">{exercise.equipment}</p>
      )}

      {/* Notes */}
      <div className="px-3 pt-2">
        <Input
          placeholder="Notes sur l'exercice..."
          className="h-8 text-xs bg-muted/50 border-0"
          value={notes}
          onChange={(e) => onUpdateNotes(e.target.value)}
        />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_2.5rem_1.5rem] items-center gap-1 px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-center">Série</span>
        <span>Précédent</span>
        <span className="text-center">KG</span>
        <span className="text-center">Reps</span>
        <span />
        <span />
      </div>

      {/* Sets */}
      <div className="pb-1">
        {sets.map((set) => (
          <SetRow
            key={set.localId}
            set={set}
            exerciseLocalId={localExercise.localId}
            onUpdate={onUpdateSet}
            onToggle={(setLocalId) => {
              onToggleSet(setLocalId)
              // If toggling to completed, start rest timer
              const s = sets.find((x) => x.localId === setLocalId)
              if (s && !s.completed) {
                onSetCompleted(s.set_type)
              }
            }}
            onRemove={onRemoveSet}
          />
        ))}
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
