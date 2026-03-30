import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
} from 'recharts'
import type { BodyMetric } from '../types/body-metrics.types'
import type { MetricKey } from './BodySilhouette'
import { cn } from '@/lib/utils'

type BodyPartGroup = {
  id: string
  label: string
  metrics: { key: MetricKey; label: string; unit: string }[]
  placeholder: string
  color: string
}

export const BODY_PARTS: BodyPartGroup[] = [
  {
    id: 'weight',
    label: 'Poids',
    metrics: [{ key: 'weight_kg', label: 'Poids', unit: 'kg' }],
    placeholder: 'balance',
    color: '#60a5fa',
  },
  {
    id: 'neck',
    label: 'Cou',
    metrics: [{ key: 'neck_cm', label: 'Cou', unit: 'cm' }],
    placeholder: 'neck',
    color: '#f472b6',
  },
  {
    id: 'shoulders',
    label: 'Épaules',
    metrics: [{ key: 'shoulders_cm', label: 'Épaules', unit: 'cm' }],
    placeholder: 'shoulders',
    color: '#34d399',
  },
  {
    id: 'chest',
    label: 'Poitrine',
    metrics: [{ key: 'chest_cm', label: 'Poitrine', unit: 'cm' }],
    placeholder: 'chest',
    color: '#fb923c',
  },
  {
    id: 'waist',
    label: 'Tour de taille',
    metrics: [{ key: 'waist_cm', label: 'Taille', unit: 'cm' }],
    placeholder: 'waist',
    color: '#a78bfa',
  },
  {
    id: 'arms',
    label: 'Bras',
    metrics: [
      { key: 'arms_left_cm', label: 'G', unit: 'cm' },
      { key: 'arms_right_cm', label: 'D', unit: 'cm' },
    ],
    placeholder: 'arms',
    color: '#f87171',
  },
  {
    id: 'forearms',
    label: 'Avant-bras',
    metrics: [
      { key: 'forearms_left_cm', label: 'G', unit: 'cm' },
      { key: 'forearms_right_cm', label: 'D', unit: 'cm' },
    ],
    placeholder: 'forearms',
    color: '#38bdf8',
  },
  {
    id: 'hips',
    label: 'Hanches',
    metrics: [{ key: 'hips_cm', label: 'Hanches', unit: 'cm' }],
    placeholder: 'hips',
    color: '#fbbf24',
  },
  {
    id: 'legs',
    label: 'Cuisses',
    metrics: [
      { key: 'legs_left_cm', label: 'G', unit: 'cm' },
      { key: 'legs_right_cm', label: 'D', unit: 'cm' },
    ],
    placeholder: 'legs',
    color: '#4ade80',
  },
  {
    id: 'calves',
    label: 'Mollets',
    metrics: [
      { key: 'calves_left_cm', label: 'G', unit: 'cm' },
      { key: 'calves_right_cm', label: 'D', unit: 'cm' },
    ],
    placeholder: 'calves',
    color: '#e879f9',
  },
]

function PlaceholderIcon({ type, color }: { type: string; color: string }) {
  const s = { stroke: color, fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  const icons: Record<string, React.ReactNode> = {
    balance: (
      <>
        <circle cx="32" cy="32" r="22" {...s} />
        <path d="M32 16 L32 48 M22 32 L42 32" {...s} />
        <path d="M24 22 L32 16 L40 22" {...s} />
      </>
    ),
    neck: (
      <>
        <ellipse cx="32" cy="18" rx="14" ry="12" {...s} />
        <path d="M24 28 L22 48 L42 48 L40 28" {...s} />
      </>
    ),
    shoulders: (
      <>
        <path d="M12 36 C12 24 22 18 32 18 C42 18 52 24 52 36" {...s} />
        <circle cx="32" cy="14" r="6" {...s} />
        <path d="M12 36 L12 46 M52 36 L52 46" {...s} />
      </>
    ),
    chest: (
      <>
        <path d="M16 20 C16 20 20 16 32 16 C44 16 48 20 48 20 L50 38 C50 42 42 48 32 48 C22 48 14 42 14 38 Z" {...s} />
        <path d="M32 24 L32 42" {...s} />
      </>
    ),
    waist: (
      <>
        <path d="M18 16 C18 16 14 32 18 48 M46 16 C46 16 50 32 46 48" {...s} />
        <path d="M18 32 C24 28 40 28 46 32" {...s} strokeDasharray="4 2" />
      </>
    ),
    arms: (
      <>
        <path d="M20 14 C16 22 14 34 16 46 M22 14 C18 22 16 34 18 46" {...s} />
        <path d="M42 14 C46 22 48 34 46 46 M44 14 C48 22 50 34 48 46" {...s} />
        <circle cx="19" cy="28" r="5" {...s} strokeDasharray="3 2" />
        <circle cx="45" cy="28" r="5" {...s} strokeDasharray="3 2" />
      </>
    ),
    forearms: (
      <>
        <path d="M18 14 L14 50 M22 14 L18 50" {...s} />
        <path d="M42 14 L46 50 M46 14 L50 50" {...s} />
        <path d="M14 50 L12 54 M18 50 L16 54" {...s} />
        <path d="M46 50 L48 54 M50 50 L52 54" {...s} />
      </>
    ),
    hips: (
      <>
        <path d="M16 20 C16 20 14 36 20 48 L44 48 C50 36 48 20 48 20" {...s} />
        <path d="M16 20 L48 20" {...s} />
      </>
    ),
    legs: (
      <>
        <path d="M20 10 C18 22 16 34 16 50 M26 10 C24 22 22 34 22 50" {...s} />
        <path d="M38 10 C40 22 42 34 42 50 M44 10 C46 22 48 34 48 50" {...s} />
        <circle cx="21" cy="26" r="6" {...s} strokeDasharray="3 2" />
        <circle cx="43" cy="26" r="6" {...s} strokeDasharray="3 2" />
      </>
    ),
    calves: (
      <>
        <path d="M18 10 C16 20 14 32 16 46 L20 50 M24 10 C22 20 20 32 22 46" {...s} />
        <path d="M40 10 C42 20 44 32 42 46 L44 50 M46 10 C48 20 50 32 48 46" {...s} />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 64 64" className="size-10">
      {icons[type] ?? <circle cx="32" cy="32" r="20" {...s} />}
    </svg>
  )
}

function getEvolution(data: BodyMetric[], key: MetricKey): { delta: number; percent: number } | null {
  const sorted = data
    .filter((m) => m[key] !== null)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))

  if (sorted.length < 2) return null

  const first = sorted[0][key] as number
  const latest = sorted[sorted.length - 1][key] as number
  const delta = Math.round((latest - first) * 10) / 10
  const percent = first !== 0 ? Math.round((delta / first) * 1000) / 10 : 0

  return { delta, percent }
}

function Sparkline({ data, metricKey, color }: { data: BodyMetric[]; metricKey: MetricKey; color: string }) {
  const chartData = data
    .filter((m) => m[metricKey] !== null)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
    .map((m) => ({ value: m[metricKey] as number }))

  if (chartData.length < 2) return null

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <YAxis domain={['auto', 'auto']} hide />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

type Props = {
  data: BodyMetric[]
  latest: BodyMetric | null
  onSelectMetric: (key: MetricKey) => void
}

export function BodyPartList({ data, latest, onSelectMetric }: Props) {
  return (
    <div className="grid gap-3">
      {BODY_PARTS.map((part) => {
        const primaryMetric = part.metrics[0]
        const evo = getEvolution(data, primaryMetric.key)

        return (
          <button
            key={part.id}
            onClick={() => onSelectMetric(primaryMetric.key)}
            className="flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 text-left transition-colors active:bg-muted"
          >
            {/* Icon */}
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${part.color}15` }}
            >
              <PlaceholderIcon type={part.placeholder} color={part.color} />
            </div>

            {/* Label + values */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{part.label}</p>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                {part.metrics.length === 1 ? (
                  <span className="truncate text-lg font-bold" style={{ color: part.color }}>
                    {latest && latest[primaryMetric.key] !== null
                      ? `${latest[primaryMetric.key]} ${primaryMetric.unit}`
                      : '—'}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-x-2">
                    {part.metrics.map((m) => (
                      <span key={m.key} className="text-sm font-bold" style={{ color: part.color }}>
                        {m.label}{' '}
                        {latest && latest[m.key] !== null ? `${latest[m.key]}` : '—'}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground self-center">{primaryMetric.unit}</span>
                  </div>
                )}

                {/* Evolution badge */}
                {evo && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    evo.delta > 0 ? 'text-green-500' : evo.delta < 0 ? 'text-red-400' : 'text-muted-foreground',
                  )}>
                    {evo.delta > 0 ? <TrendingUp className="size-3" /> : evo.delta < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                    {evo.delta > 0 ? '+' : ''}{evo.delta}
                  </span>
                )}
              </div>
            </div>

            {/* Sparkline */}
            <div className="w-16 shrink-0">
              <Sparkline data={data} metricKey={primaryMetric.key} color={part.color} />
            </div>

            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )
      })}
    </div>
  )
}
