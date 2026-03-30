import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
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
  placeholder: string // SVG placeholder description
  color: string
}

const BODY_PARTS: BodyPartGroup[] = [
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
      { key: 'arms_left_cm', label: 'Gauche', unit: 'cm' },
      { key: 'arms_right_cm', label: 'Droit', unit: 'cm' },
    ],
    placeholder: 'arms',
    color: '#f87171',
  },
  {
    id: 'forearms',
    label: 'Avant-bras',
    metrics: [
      { key: 'forearms_left_cm', label: 'Gauche', unit: 'cm' },
      { key: 'forearms_right_cm', label: 'Droit', unit: 'cm' },
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
      { key: 'legs_left_cm', label: 'Gauche', unit: 'cm' },
      { key: 'legs_right_cm', label: 'Droit', unit: 'cm' },
    ],
    placeholder: 'legs',
    color: '#4ade80',
  },
  {
    id: 'calves',
    label: 'Mollets',
    metrics: [
      { key: 'calves_left_cm', label: 'Gauche', unit: 'cm' },
      { key: 'calves_right_cm', label: 'Droit', unit: 'cm' },
    ],
    placeholder: 'calves',
    color: '#e879f9',
  },
]

function PlaceholderIcon({ type, color }: { type: string; color: string }) {
  const iconStyle = { stroke: color, fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (type) {
    case 'balance':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <circle cx="32" cy="32" r="22" {...iconStyle} />
          <path d="M32 16 L32 48 M22 32 L42 32" {...iconStyle} />
          <path d="M24 22 L32 16 L40 22" {...iconStyle} />
        </svg>
      )
    case 'neck':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <ellipse cx="32" cy="18" rx="14" ry="12" {...iconStyle} />
          <path d="M24 28 L22 48 L42 48 L40 28" {...iconStyle} />
        </svg>
      )
    case 'shoulders':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <path d="M12 36 C12 24 22 18 32 18 C42 18 52 24 52 36" {...iconStyle} />
          <circle cx="32" cy="14" r="6" {...iconStyle} />
          <path d="M12 36 L12 46 M52 36 L52 46" {...iconStyle} />
        </svg>
      )
    case 'chest':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <path d="M16 20 C16 20 20 16 32 16 C44 16 48 20 48 20 L50 38 C50 42 42 48 32 48 C22 48 14 42 14 38 Z" {...iconStyle} />
          <path d="M32 24 L32 42" {...iconStyle} />
        </svg>
      )
    case 'waist':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <path d="M18 16 C18 16 14 32 18 48 M46 16 C46 16 50 32 46 48" {...iconStyle} />
          <path d="M18 32 C24 28 40 28 46 32" {...iconStyle} strokeDasharray="4 2" />
        </svg>
      )
    case 'arms':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <path d="M20 14 C16 22 14 34 16 46 M22 14 C18 22 16 34 18 46" {...iconStyle} />
          <path d="M42 14 C46 22 48 34 46 46 M44 14 C48 22 50 34 48 46" {...iconStyle} />
          <circle cx="19" cy="28" r="5" {...iconStyle} strokeDasharray="3 2" />
          <circle cx="45" cy="28" r="5" {...iconStyle} strokeDasharray="3 2" />
        </svg>
      )
    case 'forearms':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <path d="M18 14 L14 50 M22 14 L18 50" {...iconStyle} />
          <path d="M42 14 L46 50 M46 14 L50 50" {...iconStyle} />
          <path d="M14 50 L12 54 M18 50 L16 54" {...iconStyle} />
          <path d="M46 50 L48 54 M50 50 L52 54" {...iconStyle} />
        </svg>
      )
    case 'hips':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <path d="M16 20 C16 20 14 36 20 48 L44 48 C50 36 48 20 48 20" {...iconStyle} />
          <path d="M16 20 L48 20" {...iconStyle} />
        </svg>
      )
    case 'legs':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <path d="M20 10 C18 22 16 34 16 50 M26 10 C24 22 22 34 22 50" {...iconStyle} />
          <path d="M38 10 C40 22 42 34 42 50 M44 10 C46 22 48 34 48 50" {...iconStyle} />
          <circle cx="21" cy="26" r="6" {...iconStyle} strokeDasharray="3 2" />
          <circle cx="43" cy="26" r="6" {...iconStyle} strokeDasharray="3 2" />
        </svg>
      )
    case 'calves':
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <path d="M18 10 C16 20 14 32 16 46 L20 50 M24 10 C22 20 20 32 22 46" {...iconStyle} />
          <path d="M40 10 C42 20 44 32 42 46 L44 50 M46 10 C48 20 50 32 48 46" {...iconStyle} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 64 64" className="size-16">
          <circle cx="32" cy="32" r="20" {...iconStyle} />
        </svg>
      )
  }
}

function getEvolution(data: BodyMetric[], key: MetricKey): { first: number; latest: number; delta: number; percent: number } | null {
  const sorted = data
    .filter((m) => m[key] !== null)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))

  if (sorted.length < 2) return null

  const first = sorted[0][key] as number
  const latest = sorted[sorted.length - 1][key] as number
  const delta = Math.round((latest - first) * 10) / 10
  const percent = first !== 0 ? Math.round((delta / first) * 1000) / 10 : 0

  return { first, latest, delta, percent }
}

function MiniChart({ data, metricKey, color }: { data: BodyMetric[]; metricKey: MetricKey; color: string }) {
  const chartData = data
    .filter((m) => m[metricKey] !== null)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
    .map((m) => ({ value: m[metricKey] as number }))

  if (chartData.length < 2) return null

  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={chartData}>
        <YAxis domain={['auto', 'auto']} hide />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
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

export function BodyPartCarousel({ data, latest, onSelectMetric }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function scrollTo(index: number) {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[index] as HTMLElement | undefined
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  function handlePrev() {
    const next = Math.max(0, activeIndex - 1)
    setActiveIndex(next)
    scrollTo(next)
  }

  function handleNext() {
    const next = Math.min(BODY_PARTS.length - 1, activeIndex + 1)
    setActiveIndex(next)
    scrollTo(next)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Array.from(el.children).indexOf(entry.target as HTMLElement)
            if (idx >= 0) setActiveIndex(idx)
          }
        }
      },
      { root: el, threshold: 0.6 },
    )

    for (const child of el.children) {
      observer.observe(child)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-3">
      {/* Navigation arrows + dots */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="text-muted-foreground disabled:opacity-20"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex gap-1.5">
          {BODY_PARTS.map((part, i) => (
            <button
              key={part.id}
              onClick={() => {
                setActiveIndex(i)
                scrollTo(i)
              }}
              className={cn(
                'size-2 rounded-full transition-all',
                i === activeIndex
                  ? 'bg-primary scale-125'
                  : 'bg-muted-foreground/30',
              )}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={activeIndex === BODY_PARTS.length - 1}
          className="text-muted-foreground disabled:opacity-20"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {BODY_PARTS.map((part) => {
          const primaryMetric = part.metrics[0]
          const evo = getEvolution(data, primaryMetric.key)
          const entryCount = data.filter((m) => m[primaryMetric.key] !== null).length

          return (
            <div
              key={part.id}
              className="min-w-[85%] snap-center rounded-xl border border-border bg-card p-4 space-y-3"
            >
              {/* Header: icon + title + current value */}
              <div className="flex items-center gap-4">
                <div
                  className="flex size-16 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${part.color}15` }}
                >
                  <PlaceholderIcon type={part.placeholder} color={part.color} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{part.label}</h3>
                  {part.metrics.length === 1 ? (
                    <p className="text-2xl font-bold" style={{ color: part.color }}>
                      {latest && latest[primaryMetric.key] !== null
                        ? `${latest[primaryMetric.key]} ${primaryMetric.unit}`
                        : '—'}
                    </p>
                  ) : (
                    <div className="flex gap-3">
                      {part.metrics.map((m) => (
                        <div key={m.key}>
                          <span className="text-xs text-muted-foreground">{m.label}</span>
                          <p className="text-lg font-bold" style={{ color: part.color }}>
                            {latest && latest[m.key] !== null
                              ? `${latest[m.key]} ${m.unit}`
                              : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mini chart */}
              <MiniChart data={data} metricKey={primaryMetric.key} color={part.color} />

              {/* Evolution summary */}
              {evo ? (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    <span>{evo.first} → {evo.latest} {primaryMetric.unit}</span>
                    <span className="ml-2 text-[10px]">({entryCount} entrées)</span>
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-semibold',
                    evo.delta > 0 ? 'text-green-500' : evo.delta < 0 ? 'text-red-400' : 'text-muted-foreground',
                  )}>
                    {evo.delta > 0 ? <TrendingUp className="size-4" /> : evo.delta < 0 ? <TrendingDown className="size-4" /> : <Minus className="size-4" />}
                    {evo.delta > 0 ? '+' : ''}{evo.delta} {primaryMetric.unit}
                    <span className="text-xs font-normal">({evo.percent > 0 ? '+' : ''}{evo.percent}%)</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
                  {entryCount === 0 ? 'Aucune donnée' : 'Ajoute plus d\'entrées pour voir l\'évolution'}
                </div>
              )}

              {/* Detail buttons per metric */}
              <div className={cn('grid gap-2', part.metrics.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                {part.metrics.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => onSelectMetric(m.key)}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {part.metrics.length > 1 ? `Détails ${m.label}` : 'Voir l\'historique détaillé'}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { BODY_PARTS }
