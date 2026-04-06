import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import { useExerciseHistory } from '../hooks/useProgression'
import type { Exercise, HistorySet, WorkoutEntry } from '../types/progression.types'
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

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function estimate1RM(weight: number, reps: number): number | null {
  if (reps <= 0 || weight <= 0) return null
  if (reps === 1) return Math.round(weight)
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

function getBest1RM(history: WorkoutEntry[]): number | null {
  let best: number | null = null
  for (const entry of history) {
    for (const s of entry.sets) {
      if (s.weight_kg && s.reps && s.completed) {
        const rm = estimate1RM(s.weight_kg, s.reps)
        if (rm && (best === null || rm > best)) best = rm
      }
    }
  }
  return best
}

// --- Chart data builders ---

function buildChartData(history: WorkoutEntry[]) {
  // Reverse so oldest first
  const sorted = [...history].reverse()

  return sorted.map((entry) => {
    const workingSets = entry.sets.filter(
      (s) => s.completed && s.set_type !== 'warmup' && s.weight_kg && s.reps,
    )

    let best1RM = 0
    let maxWeight = 0
    let totalVolume = 0
    let totalReps = 0

    for (const s of workingSets) {
      const w = s.weight_kg!
      const r = s.reps!
      const rm = estimate1RM(w, r) ?? 0
      if (rm > best1RM) best1RM = rm
      if (w > maxWeight) maxWeight = w
      totalVolume += w * r
      totalReps += r
    }

    return {
      date: formatShortDate(entry.started_at),
      best1RM,
      maxWeight,
      totalVolume,
      totalReps,
    }
  })
}

type Tab = 'history' | 'charts' | 'records'

type Props = {
  exercise: Exercise
  onBack: () => void
}

export function ExerciseHistory({ exercise, onBack }: Props) {
  const { data: history, isLoading } = useExerciseHistory(exercise.id)
  const [tab, setTab] = useState<Tab>('history')

  const bestRM = history ? getBest1RM(history) : null

  return (
    <div className="mx-auto max-w-lg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex items-center gap-3 px-4 py-3">
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

        {/* Tabs */}
        <div className="flex border-t border-border">
          {([
            { key: 'history', label: 'Historique' },
            { key: 'charts', label: 'Graphiques' },
            { key: 'records', label: 'Records' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 py-2.5 text-center text-xs font-semibold transition-colors',
                tab === key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
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

      {history && history.length > 0 && tab === 'history' && (
        <HistoryTab history={history} />
      )}

      {history && history.length > 0 && tab === 'charts' && (
        <ChartsTab history={history} />
      )}

      {history && history.length > 0 && tab === 'records' && (
        <RecordsTab history={history} />
      )}
    </div>
  )
}

// --- History tab ---

function HistoryTab({ history }: { history: WorkoutEntry[] }) {
  return (
    <div className="space-y-4 p-4">
      {history.map((entry) => (
        <div
          key={entry.workout_id}
          className="rounded-xl border border-border bg-card p-4 space-y-3"
        >
          <p className="text-xs text-muted-foreground">{formatDateTime(entry.started_at)}</p>

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
  )
}

// --- Charts tab ---

function ChartCard({ title, data, dataKey, color, unit }: {
  title: string
  data: ReturnType<typeof buildChartData>
  dataKey: string
  color: string
  unit: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value} ${unit}`, title]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartsTab({ history }: { history: WorkoutEntry[] }) {
  const data = buildChartData(history)

  if (data.length < 2) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Au moins 2 séances nécessaires pour les graphiques
      </p>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <ChartCard
        title="1RM estimé"
        data={data}
        dataKey="best1RM"
        color="hsl(var(--primary))"
        unit="kg"
      />
      <ChartCard
        title="Charge max"
        data={data}
        dataKey="maxWeight"
        color="#f59e0b"
        unit="kg"
      />
      <ChartCard
        title="Volume total"
        data={data}
        dataKey="totalVolume"
        color="#3b82f6"
        unit="kg"
      />
      <ChartCard
        title="Reps totales"
        data={data}
        dataKey="totalReps"
        color="#10b981"
        unit="reps"
      />
    </div>
  )
}

// --- Records tab ---

function RecordsTab({ history }: { history: WorkoutEntry[] }) {
  let best1RM = { value: 0, weight: 0, reps: 0, date: '' }
  let bestWeight = { value: 0, reps: 0, date: '' }
  let bestVolume = { value: 0, date: '' }
  let bestReps = { value: 0, weight: 0, date: '' }

  for (const entry of history) {
    let sessionVolume = 0

    for (const s of entry.sets) {
      if (!s.completed || s.set_type === 'warmup') continue
      const w = s.weight_kg ?? 0
      const r = s.reps ?? 0

      sessionVolume += w * r

      const rm = w > 0 && r > 0 ? estimate1RM(w, r) ?? 0 : 0
      if (rm > best1RM.value) {
        best1RM = { value: rm, weight: w, reps: r, date: entry.started_at }
      }

      if (w > bestWeight.value) {
        bestWeight = { value: w, reps: r, date: entry.started_at }
      }

      if (r > bestReps.value) {
        bestReps = { value: r, weight: w, date: entry.started_at }
      }
    }

    if (sessionVolume > bestVolume.value) {
      bestVolume = { value: sessionVolume, date: entry.started_at }
    }
  }

  const records = [
    {
      label: 'Meilleur 1RM estimé',
      value: `${best1RM.value} kg`,
      detail: `${best1RM.weight} kg × ${best1RM.reps}`,
      date: best1RM.date,
    },
    {
      label: 'Charge la plus lourde',
      value: `${bestWeight.value} kg`,
      detail: `${bestWeight.value} kg × ${bestWeight.reps}`,
      date: bestWeight.date,
    },
    {
      label: 'Plus de reps (une série)',
      value: `${bestReps.value} reps`,
      detail: `${bestReps.weight} kg × ${bestReps.value}`,
      date: bestReps.date,
    },
    {
      label: 'Meilleur volume (séance)',
      value: `${bestVolume.value.toLocaleString()} kg`,
      detail: 'poids × reps cumulés',
      date: bestVolume.date,
    },
  ]

  return (
    <div className="space-y-3 p-4">
      {records.map((r) => (
        <div key={r.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{r.label}</p>
          <p className="text-2xl font-bold">{r.value}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{r.detail}</span>
            {r.date && <span>{formatShortDate(r.date)}</span>}
          </div>
        </div>
      ))}

      <p className="pt-2 text-center text-[10px] text-muted-foreground">
        {history.length} séance{history.length > 1 ? 's' : ''} au total
      </p>
    </div>
  )
}
