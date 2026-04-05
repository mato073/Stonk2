import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Percent,
  Activity,
  Dumbbell,
  Ruler,
  Save,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfile, useRecentMetrics } from '../hooks/useProfile'
import { signOut } from '../api/profile.api'
import type { MetricRow } from '../api/profile.api'
import type { Gender, TrendResult, MuscleGainIndicator, BodyFatResult } from '../types/profile.types'
import { cn } from '@/lib/utils'

// --- Navy Body Fat Formula ---

function calcNavyBodyFat(
  gender: Gender,
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipsCm?: number,
): BodyFatResult | null {
  if (!heightCm || !neckCm || !waistCm) return null
  if (gender === 'female' && !hipsCm) return null

  // Ensure valid log inputs
  if (waistCm - neckCm <= 0) return null

  let bf: number

  if (gender === 'male') {
    // BF% = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
    bf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450
  } else {
    if (!hipsCm || (waistCm + hipsCm - neckCm) <= 0) return null
    // BF% = 495 / (1.29579 - 0.35004 * log10(waist + hips - neck) + 0.22100 * log10(height)) - 450
    bf = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipsCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450
  }

  bf = Math.round(bf * 10) / 10
  if (bf < 2 || bf > 60) return null

  let category: string
  if (gender === 'male') {
    if (bf < 6) category = 'Essentiel'
    else if (bf < 14) category = 'Athlétique'
    else if (bf < 18) category = 'Fitness'
    else if (bf < 25) category = 'Moyen'
    else category = 'Élevé'
  } else {
    if (bf < 14) category = 'Essentiel'
    else if (bf < 21) category = 'Athlétique'
    else if (bf < 25) category = 'Fitness'
    else if (bf < 32) category = 'Moyen'
    else category = 'Élevé'
  }

  return { percentage: bf, category }
}

// --- Trend computation ---

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

function getDirection(delta: number | null): 'up' | 'down' | 'stable' {
  if (delta == null || Math.abs(delta) < 0.3) return 'stable'
  return delta > 0 ? 'up' : 'down'
}

function computeTrends(rows: MetricRow[]): TrendResult[] {
  const fields: { key: keyof MetricRow; label: string }[] = [
    { key: 'weight_kg', label: 'Poids (kg)' },
    { key: 'neck_cm', label: 'Cou' },
    { key: 'waist_cm', label: 'Taille' },
    { key: 'hips_cm', label: 'Hanches' },
    { key: 'shoulders_cm', label: 'Épaules' },
    { key: 'chest_cm', label: 'Poitrine' },
    { key: 'arms_left_cm', label: 'Bras G' },
    { key: 'arms_right_cm', label: 'Bras D' },
    { key: 'legs_left_cm', label: 'Cuisse G' },
    { key: 'legs_right_cm', label: 'Cuisse D' },
  ]

  // rows are sorted desc (most recent first)
  return fields.map(({ key, label }) => {
    const values = rows
      .map((r) => r[key] as number | null)
      .filter((v): v is number => v != null)

    const recent = avg(values.slice(0, 3))
    const previous = avg(values.slice(3, 6))
    const delta = recent != null && previous != null
      ? Math.round((recent - previous) * 10) / 10
      : null

    return { label, recent, previous, delta, direction: getDirection(delta) }
  })
}

function computeMuscleGain(trends: TrendResult[]): MuscleGainIndicator {
  const weight = trends.find((t) => t.label === 'Poids (kg)')
  const waist = trends.find((t) => t.label === 'Taille')

  const weightTrend = weight?.direction ?? 'stable'
  const waistTrend = waist?.direction ?? 'stable'

  const likely = (weightTrend === 'up' || weightTrend === 'stable') && (waistTrend === 'down' || waistTrend === 'stable')

  let reason: string
  if (likely) {
    if (weightTrend === 'up' && waistTrend === 'down') {
      reason = 'Poids en hausse + tour de taille en baisse → recomposition probable'
    } else if (weightTrend === 'up' && waistTrend === 'stable') {
      reason = 'Poids en hausse + taille stable → prise de muscle probable'
    } else if (weightTrend === 'stable' && waistTrend === 'down') {
      reason = 'Poids stable + taille en baisse → recomposition probable'
    } else {
      reason = 'Poids et taille stables → maintien'
    }
  } else {
    if (weightTrend === 'up' && waistTrend === 'up') {
      reason = 'Poids et tour de taille en hausse → prise de gras probable'
    } else if (weightTrend === 'down') {
      reason = 'Poids en baisse → phase de sèche'
    } else {
      reason = 'Données insuffisantes pour conclure'
    }
  }

  return { likely, weightTrend, waistTrend, reason }
}

// --- Component ---

export function ProfilePage() {
  const { profile, update } = useProfile()
  const { data: metrics } = useRecentMetrics()

  const [height, setHeight] = useState<string>('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [initialized, setInitialized] = useState(false)

  // Init form from profile
  if (profile.data && !initialized) {
    if (profile.data.height_cm != null) setHeight(String(profile.data.height_cm))
    if (profile.data.gender) setGender(profile.data.gender)
    setInitialized(true)
  }

  const rows = metrics ?? []
  const latest = rows[0] ?? null

  // Body fat
  const p = profile.data
  const bodyFat = p?.gender && p?.height_cm && latest?.neck_cm && latest?.waist_cm
    ? calcNavyBodyFat(p.gender, p.height_cm, latest.neck_cm, latest.waist_cm, latest.hips_cm ?? undefined)
    : null

  // Trends
  const trends = rows.length >= 2 ? computeTrends(rows) : []
  const activeTrends = trends.filter((t) => t.recent != null)

  // Muscle gain
  const muscleGain = activeTrends.length >= 2 ? computeMuscleGain(trends) : null

  function handleSave() {
    const h = parseFloat(height)
    update.mutate({
      height_cm: !isNaN(h) && h > 0 ? h : null,
      gender: gender === 'male' || gender === 'female' ? gender : null,
    })
  }

  async function handleLogout() {
    await signOut()
    window.location.href = '/login'
  }

  if (profile.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <h1 className="text-xl font-bold">Profil</h1>

      {/* Profile settings */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="text-base font-semibold">Informations</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="height">Taille (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              min="100"
              max="250"
              placeholder="175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Sexe</Label>
            <select
              id="gender"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | '')}
            >
              <option value="">—</option>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
            </select>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={update.isPending}>
          <Save className="size-4" />
          {update.isPending ? 'Sauvegarde...' : 'Enregistrer'}
        </Button>
      </section>

      {/* Body fat */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Percent className="size-4 text-primary" />
          Taux de masse grasse
        </h2>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Méthode Navy (U.S.)</p>

        {bodyFat ? (
          <div className="flex items-center gap-4">
            <div className="flex size-20 items-center justify-center rounded-full border-4 border-primary">
              <span className="text-2xl font-bold">{bodyFat.percentage}%</span>
            </div>
            <div>
              <p className="text-lg font-semibold">{bodyFat.category}</p>
              <p className="text-xs text-muted-foreground">
                Basé sur cou ({latest?.neck_cm} cm), taille ({latest?.waist_cm} cm)
                {p?.gender === 'female' && latest?.hips_cm ? `, hanches (${latest.hips_cm} cm)` : ''}
                {' '}et hauteur ({p?.height_cm} cm)
              </p>
            </div>
          </div>
        ) : (
          <p className="py-2 text-sm text-muted-foreground">
            {!p?.gender || !p?.height_cm
              ? 'Renseigne ta taille et ton sexe ci-dessus'
              : 'Ajoute une mensuration avec cou + taille (+ hanches pour femme) dans Stats'}
          </p>
        )}
      </section>

      {/* Muscle gain indicator */}
      {muscleGain && (
        <section className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Dumbbell className="size-4 text-primary" />
            Prise de muscle
          </h2>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex size-10 items-center justify-center rounded-full',
              muscleGain.likely ? 'bg-green-500/15' : 'bg-orange-500/15',
            )}>
              {muscleGain.likely
                ? <TrendingUp className="size-5 text-green-500" />
                : <Activity className="size-5 text-orange-500" />
              }
            </div>
            <div>
              <p className={cn('text-sm font-semibold', muscleGain.likely ? 'text-green-500' : 'text-orange-500')}>
                {muscleGain.likely ? 'Probable' : 'Peu probable'}
              </p>
              <p className="text-xs text-muted-foreground">{muscleGain.reason}</p>
            </div>
          </div>
        </section>
      )}

      {/* Trends */}
      {activeTrends.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Ruler className="size-4 text-primary" />
            Tendances
          </h2>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Moyenne des 3 dernières entrées vs les 3 précédentes
          </p>
          <div className="grid gap-2">
            {activeTrends.map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
              >
                <div>
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t.previous != null ? `${t.previous} → ` : ''}{t.recent}
                  </span>
                </div>
                <TrendBadge direction={t.direction} delta={t.delta} />
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTrends.length === 0 && rows.length < 2 && (
        <p className="rounded-lg bg-muted/50 py-4 text-center text-sm text-muted-foreground">
          Ajoute au moins 2 entrées dans Stats pour voir les tendances
        </p>
      )}

      <Button variant="outline" className="w-full" onClick={handleLogout}>
        <LogOut className="size-4" />
        Se déconnecter
      </Button>
    </div>
  )
}

function TrendBadge({ direction, delta }: { direction: 'up' | 'down' | 'stable'; delta: number | null }) {
  if (direction === 'stable' || delta == null) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" />
        Stable
      </span>
    )
  }

  return (
    <span className={cn(
      'flex items-center gap-1 text-xs font-semibold',
      direction === 'up' ? 'text-green-500' : 'text-red-400',
    )}>
      {direction === 'up' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {delta > 0 ? '+' : ''}{delta}
    </span>
  )
}
