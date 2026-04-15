import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject, duplicateProject } = useProjectStore()
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
  const [editingProject, setEditingProject] = useState(null)
  const [activeMenuProjectId, setActiveMenuProjectId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => { fetchProjects() }, [])

  useEffect(() => {
    if (!activeMenuProjectId) return undefined
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setActiveMenuProjectId(null)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setActiveMenuProjectId(null)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [activeMenuProjectId])
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
  const openEdit = (project) => {
    setEditingProject(project)
    setNewName(project.name || '')
    setNewDescription(project.description || '')
    setNewStatus(project.status || 'idee')
    setNewComment(project.comment || '')
    setShowCreate(true)
  }
  const handleSaveProject = async (e) => {
    if (editingProject) {
      e?.preventDefault?.()
      const updated = await updateProject(editingProject.id, {
        name: newName.trim(),
        description: newDescription.trim() || null,
        status: newStatus,
        comment: newComment.trim() || null
      })
      if (updated) {
        toast.success('Projet mis à jour')
        setShowCreate(false)
        setEditingProject(null)
      }
      return
    }
    return handleCreate(e)
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-secondary">
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
                <article
                  className="project-card surface-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/projects/${project.id}`)
                    }
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2"><h3 className="text-sm font-semibold text-content">{project.name}</h3><Badge tone={statusTone[project.status] || 'neutral'}>{statusLabel[project.status] || 'Idée'}</Badge></div>
                  <p className="line-clamp-2 text-xs text-content-muted">{project.description || 'Aucune description.'}</p>
                  <p className="mt-2 line-clamp-2 min-h-[32px] text-xs text-slate-300">💬 {project.comment || 'Espace commentaire prévu pour vos notes produit.'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-content-muted"><span>{project._count?.nodes || 0} nœuds</span><span>•</span><span>{project._count?.edges || 0} liens</span><span>•</span><span>MAJ {new Date(project.updatedAt).toLocaleDateString('fr-FR')}</span></div>
                  <div className="mt-4 project-card__primary-action"><Button size="sm" className="w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`) }}>Ouvrir</Button></div>
                  <div className="project-card__menu" ref={activeMenuProjectId === project.id ? menuRef : null}>
                    <button
                      type="button"
                      className="project-card__gear"
                      aria-label={`Actions du projet ${project.name}`}
                      aria-haspopup="menu"
                      aria-expanded={activeMenuProjectId === project.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenuProjectId((current) => (current === project.id ? null : project.id))
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.757.426 1.757 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.757-2.924 1.757-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.757-.426-1.757-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    {activeMenuProjectId === project.id ? (
                      <div className="project-card__menu-panel" role="menu" onClick={(e) => e.stopPropagation()}>
                        <button type="button" role="menuitem" className="project-card__menu-item" onClick={(e) => { e.stopPropagation(); openEdit(project); setActiveMenuProjectId(null) }}>Éditer</button>
                        <button type="button" role="menuitem" className="project-card__menu-item" onClick={(e) => { e.stopPropagation(); duplicateProject(project.id); setActiveMenuProjectId(null) }}>Dupliquer</button>
                        <button type="button" role="menuitem" className="project-card__menu-item project-card__menu-item--danger" onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); setActiveMenuProjectId(null) }}>Supprimer</button>
                      </div>
                    ) : null}
                  </div>
                </article>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setEditingProject(null) }} title={editingProject ? 'Éditer le projet' : 'Créer un projet'}>
        <form onSubmit={handleSaveProject} className="space-y-3">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du projet" autoFocus />
          <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} placeholder="Description" />
          <select className="input-base" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>{statuses.map((s)=><option key={s} value={s}>{statusLabel[s]}</option>)}</select>
          <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} placeholder="Commentaire" />
          <Button type="submit" disabled={editingProject ? !trimmedName : !canCreate} className="w-full">{editingProject ? 'Enregistrer les modifications' : creating ? 'Création...' : 'Créer le projet'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(projectToDelete)} onClose={() => setProjectToDelete(null)} onConfirm={async()=>{if(projectToDelete){await deleteProject(projectToDelete.id); setProjectToDelete(null)}}} title="Supprimer le projet ?" description={projectToDelete ? `« ${projectToDelete.name} » sera supprimé.` : undefined} confirmLabel="Supprimer" />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
