import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useExerciseHistory } from '../hooks/useProgression'
import type { Exercise, HistorySet } from '../types/progression.types'
import { cn } from '@/lib/utils'

const MONTHS_FR = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const day = DAYS_FR[d.getDay()]
  const date = d.getDate()
  const month = MONTHS_FR[d.getMonth()]
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}, ${day} ${date} ${month} ${d.getFullYear()}`
}

function estimate1RM(weight: number, reps: number): number | null {
  if (reps <= 0 || weight <= 0) return null
  if (reps === 1) return Math.round(weight)
  // Epley formula
  return Math.round(weight * (1 + reps / 30))
}

function setTypeLabel(type: HistorySet['set_type']): string | null {
  switch (type) {
    case 'warmup': return 'W'
    case 'dropset': return 'D'
    case 'failure': return 'F'
    default: return null
  }
}

type Props = {
  exercise: Exercise
  onBack: () => void
}

export function ExerciseHistory({ exercise, onBack }: Props) {
  const { data: history, isLoading } = useExerciseHistory(exercise.id)

  // Find all-time best 1RM
  let bestRM: number | null = null
  if (history) {
    for (const entry of history) {
      for (const s of entry.sets) {
        if (s.weight_kg && s.reps && s.completed) {
          const rm = estimate1RM(s.weight_kg, s.reps)
          if (rm && (bestRM === null || rm > bestRM)) bestRM = rm
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{exercise.name}</h1>
          <p className="text-xs text-muted-foreground">
            {exercise.muscle_group}
            {bestRM && <span className="ml-2">· Record 1RM : {bestRM} kg</span>}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      )}

      {history && history.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Aucun historique pour cet exercice
        </p>
      )}

      {/* Workout entries */}
      <div className="space-y-4 p-4">
        {history?.map((entry) => (
          <div
            key={entry.workout_id}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <p className="text-xs text-muted-foreground">{formatDateTime(entry.started_at)}</p>

            {/* Sets table */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Série</span>
                <span>1RM est.</span>
              </div>

              {entry.sets.map((s, i) => {
                const label = setTypeLabel(s.set_type)
                const rm = s.weight_kg && s.reps ? estimate1RM(s.weight_kg, s.reps) : null
                const isWarmup = s.set_type === 'warmup'

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between rounded px-2 py-1.5 text-sm',
                      !s.completed && 'opacity-40',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'w-5 text-center font-semibold tabular-nums',
                        isWarmup ? 'text-amber-500' : s.set_type === 'dropset' ? 'text-blue-400' : s.set_type === 'failure' ? 'text-red-400' : 'text-foreground',
                      )}>
                        {label ?? s.set_number}
                      </span>
                      <span className={cn(isWarmup && 'text-amber-500/80')}>
                        {s.weight_kg ?? '—'} kg × {s.reps ?? '—'}
                      </span>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {rm ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
