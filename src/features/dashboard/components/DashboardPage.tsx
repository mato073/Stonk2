import {
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Timer,
  Target,
  Scale,
  Ruler,
} from 'lucide-react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import { cn } from '@/lib/utils'

const MONTHS_FR = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

function DeltaBadge({ delta, unit, invert }: { delta: number | null; unit: string; invert?: boolean }) {
  if (delta == null || delta === 0) return <Minus className="size-3 text-muted-foreground" />

  const isPositive = invert ? delta < 0 : delta > 0
  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-semibold', isPositive ? 'text-green-500' : 'text-red-400')}>
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {delta > 0 ? '+' : ''}{delta} {unit}
    </span>
  )
}

export function DashboardPage() {
  const { workouts, metrics, weekly } = useDashboard()

  const isLoading = workouts.isLoading || metrics.isLoading
  const w = workouts.data
  const m = metrics.data
  const weeklyData = weekly.data ?? []

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <div>
        <h1 className="text-xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Résumé des 30 derniers jours</p>
      </div>

      {/* Workouts per week chart */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/15">
            <Dumbbell className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Séances par semaine</h2>
          </div>
        </div>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyData} barCategoryGap="20%">
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {weeklyData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === weeklyData.length - 1 ? '#863bff' : '#863bff66'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucune donnée</p>
        )}
      </section>

      {/* Workout stats */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Dumbbell className="size-4 text-primary" />
          Entraînements
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Flame className="size-5 text-orange-400" />}
            label="Séances"
            value={String(w?.totalWorkouts ?? 0)}
          />
          <StatCard
            icon={<Target className="size-5 text-blue-400" />}
            label="Séries complétées"
            value={String(w?.totalSets ?? 0)}
          />
          <StatCard
            icon={<Dumbbell className="size-5 text-purple-400" />}
            label="Volume total"
            value={`${((w?.totalVolume ?? 0) / 1000).toFixed(1)}t`}
            sub="kg × reps"
          />
          <StatCard
            icon={<Timer className="size-5 text-green-400" />}
            label="Durée moyenne"
            value={formatDuration(w?.avgDuration ?? 0)}
          />
        </div>

        {/* Recent workouts */}
        {w && w.workouts.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dernières séances
            </p>
            {w.workouts.slice(0, 5).map((wk) => {
              const duration = Math.round(
                (new Date(wk.finished_at).getTime() - new Date(wk.started_at).getTime()) / 1000 / 60,
              )
              return (
                <div
                  key={wk.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <span className="text-sm font-medium">{formatDate(wk.started_at)}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{wk.sets_count} séries</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {w && w.totalWorkouts === 0 && (
          <p className="rounded-lg bg-muted/50 py-4 text-center text-sm text-muted-foreground">
            Aucun entraînement ce mois-ci
          </p>
        )}
      </section>

      {/* Body metrics */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Ruler className="size-4 text-primary" />
          Mensurations
        </h2>

        {/* Weight card */}
        {m && (m.weightStart != null || m.weightEnd != null) && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Scale className="size-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium">Poids</p>
                <p className="text-xl font-bold">
                  {m.weightEnd ?? m.weightStart ?? '—'} <span className="text-sm font-normal text-muted-foreground">kg</span>
                </p>
              </div>
            </div>
            <DeltaBadge delta={m.weightDelta} unit="kg" />
          </div>
        )}

        {/* Measurements grid */}
        {m && m.measurements.some((x) => x.end != null) && (
          <div className="grid gap-2">
            {m.measurements
              .filter((x) => x.end != null)
              .map((x) => (
                <div
                  key={x.key}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium">{x.label}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {x.end} cm
                    </span>
                  </div>
                  <DeltaBadge delta={x.delta} unit="cm" />
                </div>
              ))}
          </div>
        )}

        {m && m.weightStart == null && !m.measurements.some((x) => x.end != null) && (
          <p className="rounded-lg bg-muted/50 py-4 text-center text-sm text-muted-foreground">
            Aucune mensuration ce mois-ci
          </p>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}
