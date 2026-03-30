import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BodyMetric } from '../types/body-metrics.types'

type Props = {
  data: BodyMetric[]
  onDelete: (id: string) => void
  deleting: boolean
}

function formatValue(v: number | null, label: string) {
  return v !== null ? `${label}: ${v}` : null
}

export function MetricsHistory({ data, onDelete, deleting }: Props) {
  const entries = data.slice(0, 10)

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune entrée pour l'instant
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      {entries.map((m) => {
        const values = [
          formatValue(m.weight_kg, 'Poids'),
          formatValue(m.neck_cm, 'Cou'),
          formatValue(m.shoulders_cm, 'Épaules'),
          formatValue(m.chest_cm, 'Poitrine'),
          formatValue(m.waist_cm, 'Taille'),
          formatValue(m.arms_left_cm, 'Bras G'),
          formatValue(m.arms_right_cm, 'Bras D'),
          formatValue(m.forearms_left_cm, 'Av-bras G'),
          formatValue(m.forearms_right_cm, 'Av-bras D'),
          formatValue(m.hips_cm, 'Hanches'),
          formatValue(m.legs_left_cm, 'Cuisse G'),
          formatValue(m.legs_right_cm, 'Cuisse D'),
          formatValue(m.calves_left_cm, 'Mollet G'),
          formatValue(m.calves_right_cm, 'Mollet D'),
        ].filter(Boolean)

        return (
          <div
            key={m.id}
            className="flex items-start justify-between rounded-lg border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium">{m.recorded_at}</p>
              <p className="text-sm text-muted-foreground">
                {values.length > 0 ? values.join(' · ') : 'Aucune valeur'}
              </p>
              {m.notes && (
                <p className="mt-1 text-xs text-muted-foreground italic">{m.notes}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(m.id)}
              disabled={deleting}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
