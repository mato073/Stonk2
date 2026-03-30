import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Button } from '@/components/ui/button'
import type { BodyMetric } from '../types/body-metrics.types'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { MetricsForm } from './MetricsForm'
import { cn } from '@/lib/utils'

import type { MetricKey } from './BodySilhouette'
type Period = 'week' | 'month' | '3months' | 'year'

type Props = {
  data: BodyMetric[]
  metricKey: MetricKey
  label: string
  unit: string
  filterKeys?: MetricKey[]
  onBack: () => void
}

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Semaine',
  month: 'Mois',
  '3months': '3 mois',
  year: 'Année',
}

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]?.slice(0, 4)}.`
}

function getPeriodRange(period: Period, offset: number): { start: Date; end: Date; label: string } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (period === 'week') {
    const weekStart = getWeekStart(now)
    const start = addDays(weekStart, offset * 7)
    const end = addDays(start, 6)
    return {
      start,
      end,
      label: `${start.getDate()}–${end.getDate()} ${MONTHS_FR[start.getMonth()]} ${start.getFullYear()}`,
    }
  }

  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const start = d
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return {
      start,
      end,
      label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`,
    }
  }

  if (period === '3months') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset * 3, 1)
    const start = d
    const end = new Date(d.getFullYear(), d.getMonth() + 3, 0)
    const endMonth = new Date(end)
    return {
      start,
      end,
      label: `${MONTHS_FR[start.getMonth()]?.slice(0, 3)}. – ${MONTHS_FR[endMonth.getMonth()]?.slice(0, 3)}. ${end.getFullYear()}`,
    }
  }

  // year
  const year = now.getFullYear() + offset
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31),
    label: `${year}`,
  }
}

function getWeeklyBreakdown(
  data: BodyMetric[],
  metricKey: MetricKey,
  start: Date,
  end: Date,
): { rangeLabel: string; values: number[]; avg: number | null }[] {
  const weeks: { rangeLabel: string; values: number[]; avg: number | null }[] = []
  let weekStart = getWeekStart(start)

  while (weekStart <= end) {
    const weekEnd = addDays(weekStart, 6)
    const wsStr = weekStart.toISOString().slice(0, 10)
    const weStr = weekEnd.toISOString().slice(0, 10)

    const values = data
      .filter((m) => m.recorded_at >= wsStr && m.recorded_at <= weStr && m[metricKey] !== null)
      .map((m) => m[metricKey] as number)

    const avg = values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null

    const rangeLabel = `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTHS_FR[weekStart.getMonth()]} ${weekStart.getFullYear()}`

    weeks.push({ rangeLabel, values, avg })
    weekStart = addDays(weekStart, 7)
  }

  return weeks
}

export function MetricDetailView({ data, metricKey, label, unit, filterKeys, onBack }: Props) {
  const { remove } = useBodyMetrics()
  const [period, setPeriod] = useState<Period>('month')
  const [offset, setOffset] = useState(0)
  const [formOpen, setFormOpen] = useState(false)

  const { start, end, label: periodLabel } = useMemo(
    () => getPeriodRange(period, offset),
    [period, offset],
  )

  const filteredData = useMemo(() => {
    const startStr = start.toISOString().slice(0, 10)
    const endStr = end.toISOString().slice(0, 10)
    return data.filter(
      (m) => m.recorded_at >= startStr && m.recorded_at <= endStr && m[metricKey] !== null,
    )
  }, [data, start, end, metricKey])

  const chartData = useMemo(
    () =>
      filteredData
        .map((m) => ({
          date: m.recorded_at,
          value: m[metricKey] as number,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [filteredData, metricKey],
  )

  const weeklyBreakdown = useMemo(
    () => getWeeklyBreakdown(data, metricKey, start, end),
    [data, metricKey, start, end],
  )

  const metricEntries = useMemo(
    () => data.filter((m) => m[metricKey] !== null),
    [data, metricKey],
  )

  const rangeValues = chartData.map((d) => d.value)
  const minVal = rangeValues.length > 0 ? Math.min(...rangeValues) : 0
  const maxVal = rangeValues.length > 0 ? Math.max(...rangeValues) : 0
  const rangeStr =
    rangeValues.length > 0
      ? minVal === maxVal
        ? `${minVal} ${unit}`
        : `${maxVal} – ${minVal} ${unit}`
      : `Aucune donnée`

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-xl font-bold">{label}</h1>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger className="text-muted-foreground">
            <Plus className="size-5" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle entrée</DialogTitle>
            </DialogHeader>
            <MetricsForm onClose={() => setFormOpen(false)} filterKeys={filterKeys} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Period tabs */}
      <div className="flex border-b border-border">
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => {
              setPeriod(key)
              setOffset(0)
            }}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              period === key
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground',
            )}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Period navigation */}
      <div className="flex items-center justify-between px-4 py-4">
        <button onClick={() => setOffset((o) => o - 1)} className="text-muted-foreground">
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="font-semibold">{periodLabel}</p>
          <p className="text-sm text-muted-foreground">{rangeStr}</p>
        </div>
        <button
          onClick={() => setOffset((o) => Math.min(o + 1, 0))}
          className="text-muted-foreground"
          disabled={offset >= 0}
        >
          <ChevronRight className={cn('size-5', offset >= 0 && 'opacity-30')} />
        </button>
      </div>

      {/* Chart */}
      <div className="px-4">
        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid horizontal vertical={false} strokeOpacity={0.15} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00')
                  return formatShortDate(d)
                }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }}
                axisLine={false}
                tickLine={false}
                orientation="right"
                width={35}
              />
              <Tooltip
                formatter={(v) => [`${v} ${unit}`, label]}
                labelFormatter={(l) => {
                  const d = new Date(String(l) + 'T00:00:00')
                  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#60a5fa"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#60a5fa', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#60a5fa', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {chartData.length === 1
              ? 'Ajoute au moins 2 entrées pour voir le graphique'
              : 'Aucune donnée sur cette période'}
          </p>
        )}
      </div>

      {/* Weekly breakdown */}
      <div className="mt-4 divide-y divide-border">
        {weeklyBreakdown.map((week, i) => {
          const prev = i > 0 ? weeklyBreakdown[i - 1]?.avg : null
          const diff = week.avg !== null && prev !== null
            ? Math.round((week.avg - prev) * 10) / 10
            : null

          return (
            <div key={week.rangeLabel} className="px-4 py-4">
              <p className="text-sm text-muted-foreground">{week.rangeLabel}</p>
              {week.avg !== null ? (
                <>
                  <p className="text-lg font-bold">
                    {week.avg} {unit}
                  </p>
                  {diff !== null && diff !== 0 && (
                    <p
                      className={cn(
                        'text-sm',
                        diff < 0 ? 'text-green-500' : 'text-red-400',
                      )}
                    >
                      {diff > 0 ? '+' : ''}
                      {diff} {unit}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-lg font-bold">Aucune donnée</p>
              )}
            </div>
          )
        })}
      </div>

      {/* History for this metric */}
      <div className="mt-6 px-4 pb-6">
        <h2 className="mb-3 text-lg font-semibold">Historique</h2>
        {metricEntries.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucune entrée pour cette mesure
          </p>
        ) : (
          <div className="grid gap-2">
            {metricEntries.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium">{m.recorded_at}</span>
                  <span className="ml-3 text-sm text-muted-foreground">
                    {m[metricKey]} {unit}
                  </span>
                  {m.notes && (
                    <p className="text-xs text-muted-foreground italic">{m.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove.mutate(m.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
