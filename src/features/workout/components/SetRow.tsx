import { Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { LocalSet, SetType } from '../types/workout.types'

const SET_SHORT_LABELS: Record<SetType, string> = {
  warmup: 'E',
  normal: '#',
  dropset: 'D',
  failure: 'F',
}

const SET_FULL_LABELS: Record<SetType, string> = {
  normal: 'Normal',
  warmup: 'Échauffement',
  dropset: 'Dropset',
  failure: 'Failure',
}

const SET_TEXT_COLORS: Record<SetType, string> = {
  warmup: 'text-orange-400',
  normal: 'text-foreground',
  dropset: 'text-purple-400',
  failure: 'text-red-400',
}

const SET_BG_COLORS: Record<SetType, string> = {
  warmup: 'bg-orange-400/10',
  normal: 'bg-muted/50',
  dropset: 'bg-purple-400/10',
  failure: 'bg-red-400/10',
}

const ALL_TYPES: SetType[] = ['normal', 'warmup', 'dropset', 'failure']

type Props = {
  set: LocalSet
  exerciseLocalId: string
  onUpdate: (setLocalId: string, field: 'weight_kg' | 'reps' | 'set_type', value: number | null | SetType) => void
  onToggle: (setLocalId: string) => void
  onRemove: (setLocalId: string) => void
}

export function SetRow({ set, onUpdate, onToggle, onRemove }: Props) {
  const displayLabel = set.set_type === 'normal' || set.set_type === 'failure'
    ? String(set.set_number)
    : SET_SHORT_LABELS[set.set_type]

  return (
    <div className={cn(
      'grid grid-cols-[2.5rem_1fr_4rem_4rem_2.5rem_1.5rem] items-center gap-1 px-2 py-1.5 rounded-lg transition-colors',
      set.completed ? 'bg-green-500/15' : SET_BG_COLORS[set.set_type],
    )}>
      {/* Set type dropdown */}
      <div className="relative flex items-center justify-center">
        <span className={cn('text-sm font-bold pointer-events-none', set.completed ? 'text-green-500' : SET_TEXT_COLORS[set.set_type])}>
          {displayLabel}
        </span>
        <select
          value={set.set_type}
          onChange={(e) => onUpdate(set.localId, 'set_type', e.target.value as SetType)}
          className="absolute inset-0 cursor-pointer opacity-0"
          title="Changer le type de série"
        >
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>{SET_FULL_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Previous */}
      <span className="text-xs text-muted-foreground truncate">
        {set.previous ?? '—'}
      </span>

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
          onUpdate(set.localId, 'weight_kg', v === '' ? null : parseFloat(v))
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
          onUpdate(set.localId, 'reps', v === '' ? null : parseInt(v, 10))
        }}
      />

      {/* Complete toggle */}
      <button
        onClick={() => onToggle(set.localId)}
        className={cn(
          'flex size-7 items-center justify-center rounded-md border transition-colors',
          set.completed
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-border text-muted-foreground hover:border-primary',
        )}
      >
        <Check className="size-4" />
      </button>

      {/* Remove */}
      <button
        onClick={() => onRemove(set.localId)}
        className="text-muted-foreground/50 hover:text-destructive"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
