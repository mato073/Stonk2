import type { BodyMetric } from '../types/body-metrics.types'
import { cn } from '@/lib/utils'

export type MetricKey = 'weight_kg' | 'neck_cm' | 'shoulders_cm' | 'chest_cm' | 'waist_cm' | 'arms_left_cm' | 'arms_right_cm' | 'forearms_left_cm' | 'forearms_right_cm' | 'hips_cm' | 'legs_left_cm' | 'legs_right_cm' | 'calves_left_cm' | 'calves_right_cm'

type Props = {
  latest: BodyMetric | null
  selected: MetricKey | null
  onSelect: (key: MetricKey) => void
}

// Overlay zones: SVG paths traced over the PNG image (viewBox matches image ratio 848:1264 → 400:596)
// Each path follows the muscle group boundaries visible in the image
type BodyZone = {
  metricKey: MetricKey
  label: string
  unit: string
  path: string
  // Badge position (% of viewBox)
  badgeX: number
  badgeY: number
  badgeSide: 'left' | 'right'
}

const ZONES: BodyZone[] = [
  {
    metricKey: 'neck_cm', label: 'Cou', unit: 'cm',
    path: 'M183,73 C190,80 210,80 217,73 L218,95 C212,98 188,98 182,95 Z',
    badgeX: 5, badgeY: 14, badgeSide: 'right',
  },
  {
    metricKey: 'shoulders_cm', label: 'Épaules', unit: 'cm',
    // Left shoulder (viewer's right) + right shoulder (viewer's left) combined
    path: 'M182,95 C170,92 145,88 120,90 C95,92 72,100 55,112 L62,128 L95,118 L108,110 L182,102 Z M218,95 C230,92 255,88 280,90 C305,92 328,100 345,112 L338,128 L305,118 L292,110 L218,102 Z',
    badgeX: 95, badgeY: 17, badgeSide: 'left',
  },
  {
    metricKey: 'chest_cm', label: 'Poitrine', unit: 'cm',
    path: 'M108,110 L95,118 C100,140 110,158 125,170 L145,175 L200,172 L255,175 L275,170 C290,158 300,140 305,118 L292,110 L218,102 C210,106 190,106 182,102 Z',
    badgeX: 95, badgeY: 26, badgeSide: 'left',
  },
  {
    metricKey: 'waist_cm', label: 'Taille', unit: 'cm',
    path: 'M125,170 L145,175 L200,172 L255,175 L275,170 C278,190 278,208 272,230 L260,240 L200,244 L140,240 L128,230 C122,208 122,190 125,170 Z',
    badgeX: 5, badgeY: 35, badgeSide: 'right',
  },
  {
    metricKey: 'hips_cm', label: 'Hanches', unit: 'cm',
    path: 'M128,230 L140,240 L200,244 L260,240 L272,230 C276,252 278,268 272,282 L258,292 L200,296 L142,292 L128,282 C122,268 124,252 128,230 Z',
    badgeX: 95, badgeY: 43, badgeSide: 'left',
  },
  {
    metricKey: 'arms_right_cm', label: 'Bras D', unit: 'cm',
    // Viewer's left = body's right
    path: 'M55,112 L62,128 L95,118 L108,110 L108,142 C102,158 94,178 86,198 L52,198 C42,178 40,155 48,135 Z',
    badgeX: 2, badgeY: 26, badgeSide: 'right',
  },
  {
    metricKey: 'arms_left_cm', label: 'Bras G', unit: 'cm',
    // Viewer's right = body's left
    path: 'M345,112 L338,128 L305,118 L292,110 L292,142 C298,158 306,178 314,198 L348,198 C358,178 360,155 352,135 Z',
    badgeX: 98, badgeY: 26, badgeSide: 'left',
  },
  {
    metricKey: 'forearms_right_cm', label: 'Av-bras D', unit: 'cm',
    path: 'M52,198 L86,198 C82,218 78,240 72,260 C66,278 58,295 50,308 C44,315 36,312 32,305 C26,285 28,258 35,232 Z',
    badgeX: 2, badgeY: 42, badgeSide: 'right',
  },
  {
    metricKey: 'forearms_left_cm', label: 'Av-bras G', unit: 'cm',
    path: 'M348,198 L314,198 C318,218 322,240 328,260 C334,278 342,295 350,308 C356,315 364,312 368,305 C374,285 372,258 365,232 Z',
    badgeX: 98, badgeY: 42, badgeSide: 'left',
  },
  {
    metricKey: 'legs_right_cm', label: 'Cuisse D', unit: 'cm',
    path: 'M128,282 L142,292 L200,296 L200,302 C192,308 180,315 172,325 C158,350 150,380 148,410 C146,435 148,450 152,458 L180,455 C184,435 185,408 184,380 C182,350 180,330 192,310 L200,302 Z',
    badgeX: 5, badgeY: 58, badgeSide: 'right',
  },
  {
    metricKey: 'legs_left_cm', label: 'Cuisse G', unit: 'cm',
    path: 'M272,282 L258,292 L200,296 L200,302 C208,308 220,315 228,325 C242,350 250,380 252,410 C254,435 252,450 248,458 L220,455 C216,435 215,408 216,380 C218,350 220,330 208,310 L200,302 Z',
    badgeX: 95, badgeY: 58, badgeSide: 'left',
  },
  {
    metricKey: 'calves_right_cm', label: 'Mollet D', unit: 'cm',
    path: 'M152,458 L180,455 C182,475 180,498 175,518 C170,535 162,550 155,562 C148,568 138,565 135,558 C130,542 132,520 138,498 C142,480 148,468 152,458 Z',
    badgeX: 5, badgeY: 80, badgeSide: 'right',
  },
  {
    metricKey: 'calves_left_cm', label: 'Mollet G', unit: 'cm',
    path: 'M248,458 L220,455 C218,475 220,498 225,518 C230,535 238,550 245,562 C252,568 262,565 265,558 C270,542 268,520 262,498 C258,480 252,468 248,458 Z',
    badgeX: 95, badgeY: 80, badgeSide: 'left',
  },
]

export function BodySilhouette({ latest, selected, onSelect }: Props) {
  function getValue(key: MetricKey): number | null {
    if (!latest) return null
    return latest[key] as number | null
  }

  return (
    <div className="relative mx-auto" style={{ maxWidth: 300 }}>
      {/* Weight badge top center */}
      <button
        onClick={() => onSelect('weight_kg')}
        className={cn(
          'absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-bold transition-all',
          selected === 'weight_kg'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border',
        )}
      >
        {getValue('weight_kg') !== null ? `${getValue('weight_kg')} kg` : 'Poids —'}
      </button>

      {/* Container with image + SVG overlay */}
      <div className="relative">
        {/* Original PNG image */}
        <img
          src="/body_image.png"
          alt="Silhouette corps"
          className="w-full select-none"
          draggable={false}
        />

        {/* SVG overlay for clickable zones */}
        <svg
          viewBox="0 0 400 596"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {ZONES.map((zone) => {
            const isActive = selected === zone.metricKey
            return (
              <path
                key={zone.metricKey}
                d={zone.path}
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  isActive
                    ? 'fill-primary/30 stroke-primary'
                    : 'fill-transparent stroke-transparent hover:fill-primary/15 hover:stroke-primary/40',
                )}
                strokeWidth={isActive ? 2 : 1}
                onClick={() => onSelect(zone.metricKey)}
              />
            )
          })}
        </svg>

        {/* Value badges positioned around the body */}
        {ZONES.map((zone) => {
          const isActive = selected === zone.metricKey
          const value = getValue(zone.metricKey)

          return (
            <button
              key={`badge-${zone.metricKey}`}
              onClick={() => onSelect(zone.metricKey)}
              className={cn(
                'absolute whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/80 text-foreground border border-border',
              )}
              style={{
                top: `${zone.badgeY}%`,
                ...(zone.badgeSide === 'left'
                  ? { right: `${100 - zone.badgeX}%` }
                  : { left: `${zone.badgeX}%` }),
                transform: 'translateY(-50%)',
              }}
            >
              <span className="text-[8px] font-normal opacity-70">{zone.label}</span>
              <br />
              {value !== null ? `${value} ${zone.unit}` : '—'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
