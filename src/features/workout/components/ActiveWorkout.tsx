import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ActiveWorkoutState, Exercise, SetType, RestConfig } from '../types/workout.types'
import type { Action } from '../hooks/useActiveWorkout'
import { REST_DEFAULTS } from '../types/workout.types'
import { fetchLastSetsForExercise } from '../api/workout.api'
import { useWorkoutTimer } from '../hooks/useWorkoutTimer'
import { useRestTimer } from '../hooks/useRestTimer'
import { ExerciseCard } from './ExerciseCard'
import { RestTimerOverlay } from './RestTimerOverlay'
import { AddExerciseDialog } from './AddExerciseDialog'

type Props = {
  state: ActiveWorkoutState
  dispatch: React.Dispatch<Action>
  onFinish: (syncTemplate: boolean) => void
  onCancel: () => void
  saving: boolean
  hasTemplate: boolean
}

export function ActiveWorkout({ state, dispatch, onFinish, onCancel, saving, hasTemplate }: Props) {
  const { formatted: elapsed } = useWorkoutTimer(state.startedAt)
  const restTimer = useRestTimer()
  const [addExOpen, setAddExOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)

  function handleFinishClick() {
    if (hasTemplate) {
      setFinishOpen(true)
    } else {
      onFinish(false)
    }
  }

  async function handleAddExercise(exercise: Exercise) {
    // Fetch previous session's sets for this exercise
    let previousSets: { weight_kg: number | null; reps: number | null; set_type: SetType }[] = []
    try {
      const prev = await fetchLastSetsForExercise(exercise.id)
      previousSets = prev.map((s) => ({
        weight_kg: s.weight_kg,
        reps: s.reps,
        set_type: s.set_type,
      }))
    } catch {
      // No previous data, that's fine
    }

    dispatch({ type: 'ADD_EXERCISE', exercise, previousSets })
  }

  function handleSetCompleted(setType: SetType, restConfig?: RestConfig) {
    const restMap: Record<SetType, number> = restConfig
      ? { warmup: restConfig.rest_warmup, normal: restConfig.rest_normal, dropset: restConfig.rest_dropset, failure: restConfig.rest_failure }
      : REST_DEFAULTS
    restTimer.start(restMap[setType])
  }

  return (
    <div className="mx-auto max-w-lg pb-32">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tabular-nums">{elapsed}</span>
        </div>
        <Button
          size="sm"
          onClick={handleFinishClick}
          disabled={saving}
        >
          {saving ? 'Sauvegarde...' : 'Terminer'}
        </Button>
      </div>

      {/* Exercises */}
      <div className="space-y-4 p-4">
        {state.exercises.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Commence par ajouter un exercice
          </p>
        )}

        {state.exercises.map((ex) => (
          <ExerciseCard
            key={ex.localId}
            localExercise={ex}
            onUpdateNotes={(notes) =>
              dispatch({ type: 'UPDATE_EXERCISE_NOTES', localId: ex.localId, notes })
            }
            onAddSet={() =>
              dispatch({ type: 'ADD_SET', exerciseLocalId: ex.localId })
            }
            onRemoveExercise={() =>
              dispatch({ type: 'REMOVE_EXERCISE', localId: ex.localId })
            }
            onUpdateSet={(setLocalId, field, value) =>
              dispatch({ type: 'UPDATE_SET', exerciseLocalId: ex.localId, setLocalId, field, value })
            }
            onToggleSet={(setLocalId) =>
              dispatch({ type: 'TOGGLE_SET_COMPLETED', exerciseLocalId: ex.localId, setLocalId })
            }
            onRemoveSet={(setLocalId) =>
              dispatch({ type: 'REMOVE_SET', exerciseLocalId: ex.localId, setLocalId })
            }
            onSetCompleted={(setType) => handleSetCompleted(setType, ex.restConfig)}
          />
        ))}

        {/* Add exercise */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setAddExOpen(true)}
        >
          <Plus className="size-4" />
          Ajouter un exercice
        </Button>

        {/* Cancel workout */}
        {!confirmCancel ? (
          <button
            onClick={() => setConfirmCancel(true)}
            className="w-full py-3 text-center text-sm font-medium text-destructive"
          >
            Annuler l'entraînement
          </button>
        ) : (
          <div className="flex items-center justify-center gap-3 py-3">
            <span className="text-sm text-muted-foreground">Supprimer cette séance ?</span>
            <Button size="sm" variant="destructive" onClick={onCancel}>
              <X className="size-4" />
              Oui, supprimer
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmCancel(false)}>
              Non
            </Button>
          </div>
        )}
      </div>

      {/* Add exercise dialog */}
      <AddExerciseDialog
        open={addExOpen}
        onOpenChange={setAddExOpen}
        onSelect={handleAddExercise}
      />

      {/* Rest timer */}
      <RestTimerOverlay
        remaining={restTimer.remaining}
        formatted={restTimer.formatted}
        progress={restTimer.progress}
        onSkip={restTimer.stop}
        onAdjust={restTimer.adjust}
      />

      {/* Finish confirmation dialog */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminer la séance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mettre à jour le programme avec les charges et répétitions de cette séance ?
            </p>
            <div className="grid gap-2">
              <Button
                onClick={() => {
                  setFinishOpen(false)
                  onFinish(true)
                }}
                disabled={saving}
              >
                Oui, mettre à jour le programme
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFinishOpen(false)
                  onFinish(false)
                }}
                disabled={saving}
              >
                Non, garder le programme inchangé
              </Button>
              <Button
                variant="ghost"
                onClick={() => setFinishOpen(false)}
                disabled={saving}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
