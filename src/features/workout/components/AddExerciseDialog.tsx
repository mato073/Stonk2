import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useExercises } from '../hooks/useExercises'
import { createCustomExercise } from '../api/workout.api'
import type { Exercise } from '../types/workout.types'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (exercise: Exercise) => void
}

const GROUP_LABELS: Record<string, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Jambes',
  core: 'Abdominaux',
  cardio: 'Cardio',
  other: 'Autre',
}

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'cardio', 'other']

export function AddExerciseDialog({ open, onOpenChange, onSelect }: Props) {
  const { data: exercises, isLoading } = useExercises()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState('other')
  const [newEquipment, setNewEquipment] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    if (!exercises) return []
    if (!search.trim()) return exercises
    const q = search.toLowerCase()
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_group.toLowerCase().includes(q) ||
        (e.equipment ?? '').toLowerCase().includes(q),
    )
  }, [exercises, search])

  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>()
    for (const ex of filtered) {
      const group = ex.muscle_group || 'other'
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(ex)
    }
    return map
  }, [filtered])

  function handleClose() {
    onOpenChange(false)
    setSearch('')
    setShowCreate(false)
    resetCreateForm()
  }

  function resetCreateForm() {
    setNewName('')
    setNewGroup('other')
    setNewEquipment('')
  }

  async function handleCreateExercise() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const ex = await createCustomExercise(
        newName.trim(),
        newGroup,
        newEquipment.trim() || null,
      )
      await queryClient.invalidateQueries({ queryKey: ['exercises'] })
      onSelect(ex)
      handleClose()
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
  }

  if (showCreate) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un exercice</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ex-name">Nom</Label>
              <Input
                id="ex-name"
                placeholder="Ex: Bulgarian Split Squat"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ex-group">Groupe musculaire</Label>
              <select
                id="ex-group"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {GROUP_LABELS[g] ?? g}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ex-equip">Équipement (optionnel)</Label>
              <Input
                id="ex-equip"
                placeholder="Ex: Barre, Haltères, Machine..."
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreate(false)
                  resetCreateForm()
                }}
              >
                Retour
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateExercise}
                disabled={!newName.trim() || creating}
              >
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter un exercice</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
          )}

          {!isLoading && filtered.length === 0 && search.trim() && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Aucun exercice trouvé pour "{search}"
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setNewName(search.trim())
                  setShowCreate(true)
                }}
              >
                <Plus className="size-4" />
                Créer "{search.trim()}"
              </Button>
            </div>
          )}

          {!isLoading && filtered.length === 0 && !search.trim() && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun exercice disponible
            </p>
          )}

          {Array.from(grouped.entries()).map(([group, exs]) => (
            <div key={group} className="mb-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {GROUP_LABELS[group] ?? group}
              </p>
              <div className="grid gap-1">
                {exs.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      onSelect(ex)
                      handleClose()
                    }}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted active:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium">{ex.name}</p>
                      {ex.equipment && (
                        <p className="text-xs text-muted-foreground">{ex.equipment}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create custom button always visible at bottom */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 border-t border-border pt-3 text-sm font-medium text-primary"
        >
          <Plus className="size-4" />
          Créer un exercice personnalisé
        </button>
      </DialogContent>
    </Dialog>
  )
}
