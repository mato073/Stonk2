import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBodyMetrics } from '../hooks/useBodyMetrics'
import type { MetricKey } from './BodySilhouette'

type FieldDef = {
  id: string
  label: string
  metricKey: MetricKey
}

const ALL_FIELDS: FieldDef[] = [
  { id: 'weight', label: 'Poids (kg)', metricKey: 'weight_kg' },
  { id: 'neck', label: 'Cou (cm)', metricKey: 'neck_cm' },
  { id: 'shoulders', label: 'Épaules (cm)', metricKey: 'shoulders_cm' },
  { id: 'chest', label: 'Poitrine (cm)', metricKey: 'chest_cm' },
  { id: 'waist', label: 'Tour de taille (cm)', metricKey: 'waist_cm' },
  { id: 'arms_left', label: 'Bras gauche (cm)', metricKey: 'arms_left_cm' },
  { id: 'arms_right', label: 'Bras droit (cm)', metricKey: 'arms_right_cm' },
  { id: 'forearms_left', label: 'Avant-bras G (cm)', metricKey: 'forearms_left_cm' },
  { id: 'forearms_right', label: 'Avant-bras D (cm)', metricKey: 'forearms_right_cm' },
  { id: 'hips', label: 'Hanches (cm)', metricKey: 'hips_cm' },
  { id: 'legs_left', label: 'Cuisse gauche (cm)', metricKey: 'legs_left_cm' },
  { id: 'legs_right', label: 'Cuisse droite (cm)', metricKey: 'legs_right_cm' },
  { id: 'calves_left', label: 'Mollet gauche (cm)', metricKey: 'calves_left_cm' },
  { id: 'calves_right', label: 'Mollet droit (cm)', metricKey: 'calves_right_cm' },
]

type Props = {
  onClose: () => void
  filterKeys?: MetricKey[]
}

export function MetricsForm({ onClose, filterKeys }: Props) {
  const { insert } = useBodyMetrics()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')

  const fields = filterKeys
    ? ALL_FIELDS.filter((f) => filterKeys.includes(f.metricKey))
    : ALL_FIELDS

  function toNum(v: string | undefined) {
    if (!v) return null
    const n = parseFloat(v)
    return n > 0 ? n : null
  }

  function setValue(id: string, val: string) {
    setValues((prev) => ({ ...prev, [id]: val }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await insert.mutateAsync({
      recorded_at: date,
      weight_kg: toNum(values.weight),
      neck_cm: toNum(values.neck),
      shoulders_cm: toNum(values.shoulders),
      chest_cm: toNum(values.chest),
      waist_cm: toNum(values.waist),
      arms_left_cm: toNum(values.arms_left),
      arms_right_cm: toNum(values.arms_right),
      forearms_left_cm: toNum(values.forearms_left),
      forearms_right_cm: toNum(values.forearms_right),
      hips_cm: toNum(values.hips),
      legs_left_cm: toNum(values.legs_left),
      legs_right_cm: toNum(values.legs_right),
      calves_left_cm: toNum(values.calves_left),
      calves_right_cm: toNum(values.calves_right),
      notes: notes.trim() || null,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid gap-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className={fields.length === 1 ? 'grid gap-3' : 'grid grid-cols-2 gap-3'}>
        {fields.map(({ id, label }) => (
          <div key={id} className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
              id={id}
              type="number"
              step="0.01"
              min="0"
              value={values[id] ?? ''}
              onChange={(e) => setValue(id, e.target.value)}
              placeholder="—"
              autoFocus={fields.length === 1}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optionnel"
        />
      </div>

      {insert.error && (
        <p className="text-sm text-destructive">
          {insert.error instanceof Error ? insert.error.message : 'Erreur'}
        </p>
      )}

      <Button type="submit" disabled={insert.isPending} className="w-full">
        {insert.isPending ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </form>
  )
}
