import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useProjectStore from '../../stores/projectStore'
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, SectionHeader, Textarea, useToast } from '../ui/primitives'
import MobileHeader from '../layout/MobileHeader'
import SettingsModal from '../layout/SettingsModal'

const statuses = ['idee', 'en_cours', 'deploye', 'termine']
const statusLabel = { idee: 'Idée', en_cours: 'En cours', deploye: 'Déployé', termine: 'Terminé' }
const statusTone = { idee: 'neutral', en_cours: 'warning', deploye: 'success', termine: 'neutral' }

export default function ProjectList() {
  const { projects, loading, error, fetchProjects, createProject, deleteProject, duplicateProject } = useProjectStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newStatus, setNewStatus] = useState('idee')
  const [newComment, setNewComment] = useState('')
  const [creating, setCreating] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)

  useEffect(() => { fetchProjects() }, [])
  const trimmedName = newName.trim()
  const existingNames = useMemo(() => new Set((projects || []).map((p) => p.name?.toLowerCase())), [projects])
  const canCreate = Boolean(trimmedName) && !existingNames.has(trimmedName.toLowerCase()) && !creating

  const handleCreate = async (e) => {
    e?.preventDefault?.(); if (!canCreate) return
    setCreating(true)
    const project = await createProject(trimmedName, newDescription.trim(), newStatus, newComment.trim())
    setCreating(false)
    if (project) { toast.success(`Projet « ${project.name} » créé`); setShowCreate(false); navigate(`/projects/${project.id}`) }
  }

  return (
    <div className="flex h-full min-w-0 flex-col bg-secondary">
      <MobileHeader
        title="Projets"
        subtitle={projects.length ? `${projects.length} projet(s)` : 'Créez et organisez vos flows visuels'}
        primaryAction={{ key: 'new', label: 'Nouveau', onClick: () => setShowCreate(true) }}
        menuActions={[{ key: 'settings', label: 'Paramètres', onClick: () => setShowSettings(true) }]}
      />
      <div className="hidden border-b border-border-subtle px-5 py-4 md:block md:px-7">
        <SectionHeader title="Projets" subtitle={projects.length ? `${projects.length} projet(s)` : 'Créez et organisez vos flows visuels'} actions={<Button onClick={() => setShowCreate(true)}>Nouveau projet</Button>} />
      </div>
      {error ? <div className="mx-4 mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</div> : null}

      <div className="app-scroll px-3 py-3 sm:px-4 md:px-7 md:py-4">
        {loading ? <div className="flex h-48 items-center justify-center"><svg className="spinner h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg></div> : !projects.length ? <EmptyState title="Aucun projet" description="Créez votre premier projet." action={<Button onClick={() => setShowCreate(true)}>Créer un projet</Button>} /> : (
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <article className="project-card surface-card">
                  <div className="mb-2 flex items-start justify-between gap-2"><h3 className="text-sm font-semibold text-content">{project.name}</h3><Badge tone={statusTone[project.status] || 'neutral'}>{statusLabel[project.status] || 'Idée'}</Badge></div>
                  <p className="line-clamp-2 text-xs text-content-muted">{project.description || 'Aucune description.'}</p>
                  <p className="mt-2 line-clamp-2 min-h-[32px] text-xs text-slate-300">💬 {project.comment || 'Espace commentaire prévu pour vos notes produit.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-content-muted"><span>{project._count?.nodes || 0} nœuds</span><span>•</span><span>{project._count?.edges || 0} liens</span><span>•</span><span>MAJ {new Date(project.updatedAt).toLocaleDateString('fr-FR')}</span></div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/projects/${project.id}`)}>Ouvrir le projet</Button><div className="project-card__actions flex w-full gap-2 sm:w-auto"><Button size="sm" className="flex-1 sm:flex-none" variant="secondary" onClick={() => duplicateProject(project.id)}>Dupliquer</Button><Button size="sm" className="flex-1 sm:flex-none" variant="danger" onClick={() => setProjectToDelete(project)}>Supprimer</Button></div></div>
                </article>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer un projet">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du projet" autoFocus />
          <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} placeholder="Description" />
          <select className="input-base" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>{statuses.map((s)=><option key={s} value={s}>{statusLabel[s]}</option>)}</select>
          <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} placeholder="Commentaire" />
          <Button type="submit" disabled={!canCreate} className="w-full">{creating ? 'Création...' : 'Créer le projet'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(projectToDelete)} onClose={() => setProjectToDelete(null)} onConfirm={async()=>{if(projectToDelete){await deleteProject(projectToDelete.id); setProjectToDelete(null)}}} title="Supprimer le projet ?" description={projectToDelete ? `« ${projectToDelete.name} » sera supprimé.` : undefined} confirmLabel="Supprimer" />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
