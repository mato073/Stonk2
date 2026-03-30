import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  remaining: number
  formatted: string
  progress: number
  onSkip: () => void
  onAdjust: (delta: number) => void
}

export function RestTimerOverlay({ remaining, formatted, progress, onSkip, onAdjust }: Props) {
  if (remaining <= 0) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-2">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-3 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-muted-foreground">Repos</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAdjust(-15)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              -15s
            </button>

            <span className={cn(
              'min-w-[3.5rem] text-center text-lg font-bold tabular-nums',
              remaining <= 5 ? 'text-red-400' : 'text-primary',
            )}>
              {formatted}
            </span>

            <button
              onClick={() => onAdjust(15)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              +15s
            </button>
          </div>

          <Button size="sm" variant="outline" onClick={onSkip}>
            Passer
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
