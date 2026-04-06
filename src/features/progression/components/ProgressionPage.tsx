import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useExerciseList } from '../hooks/useProgression'
import { ExerciseHistory } from './ExerciseHistory'
import type { Exercise } from '../types/progression.types'

export function ProgressionPage() {
  const { data: exercises, isLoading } = useExerciseList()
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [search, setSearch] = useState('')

  if (selected) {
    return <ExerciseHistory exercise={selected} onBack={() => setSelected(null)} />
  }

  const filtered = (exercises ?? []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.muscle_group.toLowerCase().includes(search.toLowerCase()),
  )

  // Group by muscle group
  const groups = new Map<string, Exercise[]>()
  for (const ex of filtered) {
    const group = ex.muscle_group
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(ex)
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24">
      <h1 className="text-xl font-bold">Progression</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un exercice..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">Chargement...</p>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {exercises?.length === 0
            ? 'Termine un entraînement pour voir ta progression'
            : 'Aucun exercice trouvé'}
        </p>
      )}

      {/* Exercise list grouped by muscle */}
      {[...groups.entries()].map(([group, exs]) => (
        <div key={group}>
          <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group}
          </p>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {exs.map((ex) => (
              <button
                key={ex.id}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors active:bg-muted/50"
                onClick={() => setSelected(ex)}
              >
                <div>
                  <p className="text-sm font-medium">{ex.name}</p>
                  {ex.equipment && (
                    <p className="text-xs text-muted-foreground">{ex.equipment}</p>
                  )}
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
