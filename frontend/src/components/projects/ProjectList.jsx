import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useProjectStore from '../../stores/projectStore'
import { Badge, Button, Card, EmptyState, Input, Modal, SectionHeader, Textarea } from '../ui/primitives'

export default function ProjectList() {
  const { projects, loading, error, fetchProjects, createProject, deleteProject, duplicateProject } = useProjectStore()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async (e) => {
    e?.preventDefault?.()
    if (!newName.trim()) return
    setCreating(true)
    const project = await createProject(newName.trim(), newDescription.trim())
    setCreating(false)
    if (project) {
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
      navigate(`/projects/${project.id}`)
    }
  }

  return (
    <div className="flex h-full flex-col bg-secondary">
      <div className="border-b border-border-subtle px-5 py-4 md:px-7">
        <SectionHeader
          title="Projects"
          subtitle={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
          actions={<Button onClick={() => setShowCreate(true)}>New Project</Button>}
        />
      </div>

      {error ? <div className="mx-5 mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 md:mx-7">{error}</div> : null}

      <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
        {loading ? (
          <div className="flex h-48 items-center justify-center"><svg className="spinner h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg></div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<svg className="h-7 w-7 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" /></svg>}
            title="No projects yet"
            description="Create your first project to start building architecture flows."
            action={<Button onClick={() => setShowCreate(true)}>Create first project</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="group cursor-pointer p-5 transition hover:-translate-y-0.5 hover:border-indigo-400/50" onClick={() => navigate(`/projects/${project.id}`)}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg>
                    </div>
                    {project.readOnly ? <Badge tone="warning">Read-only</Badge> : <Badge tone="success">Editable</Badge>}
                  </div>
                  <h3 className="truncate text-base font-semibold text-content">{project.name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-content-muted">{project.description || 'No description provided.'}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-content-muted">
                    <span>{project._count?.nodes || 0} nodes • {project._count?.edges || 0} edges</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="mt-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={(e) => { e.stopPropagation(); duplicateProject(project.id).then((dup) => dup && navigate(`/projects/${dup.id}`)) }}>Duplicate</Button>
                    <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); window.confirm(`Delete project "${project.name}"? This cannot be undone.`) && deleteProject(project.id) }}>Delete</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create project"
        description="Define the project name and optional summary."
        footer={[
          <Button key="create" onClick={handleCreate} disabled={creating || !newName.trim()}>{creating ? 'Creating...' : 'Create project'}</Button>,
          <Button key="cancel" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
        ]}
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">Project name</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My awesome app" autoFocus required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">Description</label>
            <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} placeholder="Brief description of this project..." />
          </div>
        </form>
      </Modal>
    </div>
  )
}
