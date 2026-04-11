import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useProjectStore from '../../stores/projectStore'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  Modal,
  SectionHeader,
  Textarea,
  useToast
} from '../ui/primitives'

const DuplicateIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2h-2M6 21h8a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
)

const DeleteIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m3 0V5a2 2 0 012-2h4a2 2 0 012 2v2m-9 0h12"
    />
  </svg>
)

const ArrowIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
  </svg>
)

export default function ProjectList() {
  const {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    deleteProject,
    duplicateProject
  } = useProjectStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const trimmedName = newName.trim()
  const existingNames = useMemo(
    () => new Set((projects || []).map((p) => p.name?.toLowerCase())),
    [projects]
  )
  const isDuplicateName = trimmedName && existingNames.has(trimmedName.toLowerCase())
  const canCreate = Boolean(trimmedName) && !isDuplicateName && !creating

  const handleCreate = async (e) => {
    e?.preventDefault?.()
    if (!canCreate) return
    setCreating(true)
    const project = await createProject(trimmedName, newDescription.trim())
    setCreating(false)
    if (project) {
      toast.success(`Project "${project.name}" created`)
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
      navigate(`/projects/${project.id}`)
    } else {
      toast.error('Failed to create project')
    }
  }

  const handleDelete = async () => {
    if (!projectToDelete) return
    setDeleting(true)
    const ok = await deleteProject(projectToDelete.id)
    setDeleting(false)
    if (ok) {
      toast.success(`"${projectToDelete.name}" deleted`)
    } else {
      toast.error('Failed to delete project')
    }
    setProjectToDelete(null)
  }

  const handleDuplicate = async (project) => {
    const dup = await duplicateProject(project.id)
    if (dup) {
      toast.success(`Duplicated as "${dup.name}"`)
      navigate(`/projects/${dup.id}`)
    } else {
      toast.error('Failed to duplicate project')
    }
  }

  return (
    <div className="flex h-full flex-col bg-secondary">
      <div className="border-b border-border-subtle px-5 py-4 md:px-7">
        <SectionHeader
          title="Projects"
          subtitle={
            projects.length
              ? `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`
              : 'Create and organise visual architecture flows'
          }
          actions={<Button onClick={() => setShowCreate(true)}>New Project</Button>}
        />
      </div>

      {error ? (
        <div className="mx-5 mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 md:mx-7">
          {error}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <svg className="spinner h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
            </svg>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-7 w-7 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2"
                />
              </svg>
            }
            title="No projects yet"
            description="Create your first project to start building architecture flows."
            action={<Button onClick={() => setShowCreate(true)}>Create first project</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => {
              const nodeCount = project._count?.nodes || 0
              const edgeCount = project._count?.edges || 0
              const updatedAt = new Date(project.updatedAt)
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    className="project-card"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open project ${project.name}`}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/projects/${project.id}`)
                      }
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                          />
                        </svg>
                      </div>
                      {project.readOnly ? (
                        <Badge tone="warning">Read-only</Badge>
                      ) : (
                        <Badge tone="success">Editable</Badge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-content" title={project.name}>
                      {project.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm text-content-muted">
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                        {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                        {edgeCount} {edgeCount === 1 ? 'edge' : 'edges'}
                      </span>
                      <span className="ml-auto text-[0.7rem] uppercase tracking-wide">
                        Updated {updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
                      <span className="project-card__open">
                        Open project <ArrowIcon />
                      </span>
                      <div className="project-card__actions flex items-center gap-1">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicate(project)
                          }}
                          tooltip="Duplicate"
                          label={`Duplicate project ${project.name}`}
                        >
                          <DuplicateIcon />
                        </IconButton>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            setProjectToDelete(project)
                          }}
                          tooltip="Delete"
                          label={`Delete project ${project.name}`}
                          variant="danger"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => {
          if (!creating) {
            setShowCreate(false)
            setNewName('')
            setNewDescription('')
          }
        }}
        title="Create project"
        description="Define the project name and optional summary."
        footer={[
          <Button
            key="cancel"
            variant="secondary"
            onClick={() => setShowCreate(false)}
            disabled={creating}
          >
            Cancel
          </Button>,
          <Button key="create" onClick={handleCreate} disabled={!canCreate}>
            {creating ? 'Creating...' : 'Create project'}
          </Button>
        ]}
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
              Project name
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My awesome app"
              autoFocus
              required
              aria-invalid={isDuplicateName}
            />
            {isDuplicateName ? (
              <p className="mt-1.5 text-xs text-red-300">
                A project with this name already exists.
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
              Description <span className="text-content-muted/70">(optional)</span>
            </label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of this project..."
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(projectToDelete)}
        onClose={() => !deleting && setProjectToDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete project?"
        description={
          projectToDelete
            ? `"${projectToDelete.name}" will be permanently removed.`
            : undefined
        }
        details={
          projectToDelete
            ? [
                'All nodes and edges will be deleted.',
                'Saved version history will also be removed.',
                'This action cannot be undone.'
              ]
            : undefined
        }
        confirmLabel="Delete project"
      />
    </div>
  )
}
