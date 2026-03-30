import { useState } from 'react'
import { Dumbbell, Plus, Play, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useActiveWorkout } from '../hooks/useActiveWorkout'
import { useTemplates, useTemplateExercises } from '../hooks/useTemplates'
import { fetchAllTemplateSets } from '../api/workout.api'
import type { TemplateSet } from '../types/workout.types'
import { ActiveWorkout } from './ActiveWorkout'
import { TemplateEditor } from './TemplateEditor'
import type { WorkoutTemplate } from '../types/workout.types'

export function WorkoutPage() {
  const {
    state, dispatch, isActive,
    startWorkout, startFromTemplate,
    finishWorkout, cancelWorkout,
    saving, error,
  } = useActiveWorkout()
  const { templates, create, rename, remove } = useTemplates()

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)

  // Active workout view
  if (isActive && state) {
    return (
      <>
        <ActiveWorkout
          state={state}
          dispatch={dispatch}
          onFinish={finishWorkout}
          onCancel={cancelWorkout}
          saving={saving}
        />
        {error && (
          <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 text-center text-sm text-destructive">
            {error}
          </div>
        )}
      </>
    )
  }

  // Template editor view
  if (editingTemplate) {
    return (
      <TemplateEditor
        templateId={editingTemplate.id}
        templateName={editingTemplate.name}
        onBack={() => setEditingTemplate(null)}
        onRename={(name) => {
          rename.mutate({ id: editingTemplate.id, name })
          setEditingTemplate({ ...editingTemplate, name })
        }}
      />
    )
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const t = await create.mutateAsync(newName.trim())
    setCreateOpen(false)
    setNewName('')
    setEditingTemplate(t)
  }

  const templateList = templates.data ?? []

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Entraînement</h1>
      </div>

      {/* Quick start */}
      <Button className="w-full" size="lg" onClick={startWorkout}>
        <Dumbbell className="size-5" />
        Séance libre
      </Button>

      {/* Templates section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Mes programmes</h2>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Créer
          </Button>
        </div>

        {templates.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
        )}

        {templateList.length === 0 && !templates.isLoading && (
          <div className="rounded-xl border border-dashed border-border py-8 text-center">
            <Dumbbell className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Crée ton premier programme d'entraînement
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {templateList.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onStart={startFromTemplate}
              onEdit={() => setEditingTemplate(t)}
              onDelete={() => remove.mutate(t.id)}
              deleting={remove.isPending}
            />
          ))}
        </div>
      </div>

      {/* Create template dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau programme</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Input
              placeholder="Nom du programme (ex: Push, Pull, Legs...)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <Button onClick={handleCreate} disabled={!newName.trim() || create.isPending}>
              {create.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Template card sub-component ---

function TemplateCard({
  template,
  onStart,
  onEdit,
  onDelete,
  deleting,
}: {
  template: WorkoutTemplate
  onStart: (exercises: import('../types/workout.types').TemplateExercise[], sets: Record<string, TemplateSet[]>) => void
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const { exercises } = useTemplateExercises(template.id)
  const [launching, setLaunching] = useState(false)
  const exList = exercises.data ?? []

  async function handleStart() {
    if (exList.length === 0) return
    setLaunching(true)
    try {
      const ids = exList.map((e) => e.id)
      const allSets = await fetchAllTemplateSets(ids)
      // Group sets by template_exercise_id
      const grouped: Record<string, TemplateSet[]> = {}
      for (const s of allSets) {
        if (!grouped[s.template_exercise_id]) grouped[s.template_exercise_id] = []
        grouped[s.template_exercise_id].push(s)
      }
      onStart(exList, grouped)
    } catch {
      // fallback: start without sets
      onStart(exList, {})
    } finally {
      setLaunching(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{template.name}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="size-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} disabled={deleting}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Exercise preview */}
      {exList.length > 0 ? (
        <p className="mb-3 text-xs text-muted-foreground">
          {exList.map((e) => e.exercise?.name ?? '?').join(' · ')}
        </p>
      ) : (
        <p className="mb-3 text-xs text-muted-foreground italic">
          Aucun exercice — modifie le programme
        </p>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={handleStart}
        disabled={exList.length === 0 || launching}
      >
        <Play className="size-4" />
        {launching ? 'Chargement...' : 'Lancer'}
      </Button>
    </div>
  )
}
