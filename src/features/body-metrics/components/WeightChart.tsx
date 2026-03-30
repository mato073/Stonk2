import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { BodyMetric } from '../types/body-metrics.types'

type Props = {
  data: BodyMetric[]
}

export function WeightChart({ data }: Props) {
  const points = data
    .filter((m) => m.weight_kg !== null)
    .map((m) => ({ date: m.recorded_at, poids: m.weight_kg }))
    .reverse()

  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ajoute au moins 2 entrées pour voir le graphique
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={points}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="poids"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Poids (kg)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
