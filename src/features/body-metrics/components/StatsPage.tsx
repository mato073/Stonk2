import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import { MetricsForm } from './MetricsForm'
import { MetricDetailView } from './MetricDetailView'
import { BodyPartList, BODY_PARTS } from './BodyPartList'
import type { MetricKey } from './BodySilhouette'

const METRIC_INFO: Record<MetricKey, { label: string; unit: string }> = {
  weight_kg: { label: 'Poids', unit: 'kg' },
  neck_cm: { label: 'Cou', unit: 'cm' },
  shoulders_cm: { label: 'Épaules', unit: 'cm' },
  chest_cm: { label: 'Poitrine', unit: 'cm' },
  waist_cm: { label: 'Tour de taille', unit: 'cm' },
  arms_left_cm: { label: 'Bras gauche', unit: 'cm' },
  arms_right_cm: { label: 'Bras droit', unit: 'cm' },
  forearms_left_cm: { label: 'Avant-bras gauche', unit: 'cm' },
  forearms_right_cm: { label: 'Avant-bras droit', unit: 'cm' },
  hips_cm: { label: 'Hanches', unit: 'cm' },
  legs_left_cm: { label: 'Cuisse gauche', unit: 'cm' },
  legs_right_cm: { label: 'Cuisse droite', unit: 'cm' },
  calves_left_cm: { label: 'Mollet gauche', unit: 'cm' },
  calves_right_cm: { label: 'Mollet droit', unit: 'cm' },
}

export function StatsPage() {
  const { metrics } = useBodyMetrics()
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<MetricKey | null>(null)

  if (metrics.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Chargement...
      </div>
    )
  }

  const data = metrics.data ?? []
  const latest = data.length > 0 ? data[0] : null

  if (selected) {
    const info = METRIC_INFO[selected]
    // Find all metric keys in the same body part group
    const group = BODY_PARTS.find((g) => g.metrics.some((m) => m.key === selected))
    const filterKeys = group ? group.metrics.map((m) => m.key) : [selected]
    return (
      <MetricDetailView
        data={data}
        metricKey={selected}
        label={info.label}
        unit={info.unit}
        filterKeys={filterKeys}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Stats</h1>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="size-4" />
            Ajouter
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle entrée</DialogTitle>
            </DialogHeader>
            <MetricsForm onClose={() => setFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <BodyPartList
        data={data}
        latest={latest}
        onSelectMetric={setSelected}
      />
    </div>
  )
}
