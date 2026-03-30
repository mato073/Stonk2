import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { BodyMetric } from '../types/body-metrics.types'

type Props = {
  data: BodyMetric[]
}

const series = [
  { key: 'neck_cm', name: 'Cou', color: '#facc15' },
  { key: 'shoulders_cm', name: 'Épaules', color: '#fb923c' },
  { key: 'chest_cm', name: 'Poitrine', color: '#f97316' },
  { key: 'waist_cm', name: 'Taille', color: '#06b6d4' },
  { key: 'arms_left_cm', name: 'Bras G', color: '#8b5cf6' },
  { key: 'arms_right_cm', name: 'Bras D', color: '#a78bfa' },
  { key: 'forearms_left_cm', name: 'Av-bras G', color: '#7c3aed' },
  { key: 'forearms_right_cm', name: 'Av-bras D', color: '#c4b5fd' },
  { key: 'hips_cm', name: 'Hanches', color: '#ec4899' },
  { key: 'legs_left_cm', name: 'Cuisse G', color: '#22c55e' },
  { key: 'legs_right_cm', name: 'Cuisse D', color: '#4ade80' },
  { key: 'calves_left_cm', name: 'Mollet G', color: '#14b8a6' },
  { key: 'calves_right_cm', name: 'Mollet D', color: '#5eead4' },
] as const

export function MeasurementsChart({ data }: Props) {
  const points = data
    .filter((m) =>
      series.some(({ key }) => m[key] !== null),
    )
    .map((m) => ({
      date: m.recorded_at,
      ...Object.fromEntries(series.map(({ key }) => [key, m[key]])),
    }))
    .reverse()

  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ajoute au moins 2 entrées pour voir le graphique
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={points}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {series.map(({ key, name, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            name={name}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
