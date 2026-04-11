import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import useProjectStore from '../../stores/projectStore'
import CustomNode from './CustomNode'
import NodePanel from './NodePanel'
import {
  Badge,
  Button,
  ConfirmDialog,
  Modal,
  Textarea,
  useToast
} from '../ui/primitives'

const NODE_TYPES = { custom: CustomNode }
const EDGE_STYLE = { stroke: '#5f74dd', strokeWidth: 2 }
const DEFAULT_EDGE_OPTIONS = { type: 'smoothstep', style: EDGE_STYLE }
const FIT_VIEW_OPTIONS = { padding: 0.2 }
const CANVAS_STYLE = { background: '#0b111d' }

// Approximate dimensions used for the non-overlap placement heuristic.
// React Flow doesn't provide measured rects synchronously, so we use a
// conservative bounding box.
const NEW_NODE_WIDTH = 240
const NEW_NODE_HEIGHT = 150
const GRID_STEP = 40
const PLACEMENT_PADDING = 32

const mapProjectToFlow = (project) => {
  const rfNodes = (project.nodes || []).map((n) => ({
    id: n.nodeId,
    type: 'custom',
    position: { x: n.posX, y: n.posY },
    data: {
      title: n.title,
      label: n.title,
      description: n.description || '',
      notes: n.notes || '',
      items: n.items || []
    }
  }))

  const rfEdges = (project.edges || []).map((e) => ({
    id: e.edgeId,
    source: e.source,
    target: e.target,
    ...DEFAULT_EDGE_OPTIONS
  }))

  return { rfNodes, rfEdges }
}

/**
 * Find a non-overlapping position for a new node, anchored near the
 * last-created node (or the existing cluster) and falling back to a
 * spiral sweep if collisions pile up.
 */
const findFreePosition = (existingNodes) => {
  if (!existingNodes || existingNodes.length === 0) {
    return { x: 160, y: 160 }
  }

  // Anchor near the rightmost node so the graph grows naturally left→right.
  const sorted = [...existingNodes].sort((a, b) => b.position.x - a.position.x)
  const anchor = sorted[0]
  let candidate = {
    x: anchor.position.x + NEW_NODE_WIDTH + PLACEMENT_PADDING,
    y: anchor.position.y
  }

  const overlaps = (pos) =>
    existingNodes.some((node) => {
      const dx = Math.abs(node.position.x - pos.x)
      const dy = Math.abs(node.position.y - pos.y)
      return dx < NEW_NODE_WIDTH && dy < NEW_NODE_HEIGHT
    })

  if (!overlaps(candidate)) return candidate

  // Spiral sweep: try positions around the anchor in expanding rings.
  const offsets = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ]
  for (let ring = 1; ring <= 12; ring += 1) {
    for (const [dx, dy] of offsets) {
      candidate = {
        x: anchor.position.x + dx * (NEW_NODE_WIDTH + PLACEMENT_PADDING) * ring,
        y: anchor.position.y + dy * (NEW_NODE_HEIGHT + PLACEMENT_PADDING) * ring
      }
      if (!overlaps(candidate)) return candidate
    }
  }

  // Fallback: snap to grid a few steps below the anchor.
  return {
    x: Math.round(anchor.position.x / GRID_STEP) * GRID_STEP,
    y: Math.round(anchor.position.y / GRID_STEP) * GRID_STEP + (NEW_NODE_HEIGHT + PLACEMENT_PADDING)
  }
}

export default function FlowCanvas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const currentProject = useProjectStore((state) => state.currentProject)
  const versions = useProjectStore((state) => state.versions)
  const error = useProjectStore((state) => state.error)
  const fetchProject = useProjectStore((state) => state.fetchProject)
  const saveProject = useProjectStore((state) => state.saveProject)
  const exportProject = useProjectStore((state) => state.exportProject)
  const importProject = useProjectStore((state) => state.importProject)
  const fetchVersions = useProjectStore((state) => state.fetchVersions)
  const rollback = useProjectStore((state) => state.rollback)

  const [nodes, setNodes, applyNodeChanges] = useNodesState([])
  const [edges, setEdges, applyEdgeChanges] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [showVersions, setShowVersions] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importAcknowledged, setImportAcknowledged] = useState(false)
  const [importing, setImporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(null)

  const autoSaveTimer = useRef(null)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const isReadOnly = currentProject?.readOnly || false

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  )

  const edgeCountForSelection = useMemo(() => {
    if (!selectedNodeId) return 0
    return edges.filter(
      (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
    ).length
  }, [edges, selectedNodeId])

  const performSave = useCallback(async () => {
    if (isReadOnly || !id) return

    setSaving(true)
    const saved = await saveProject(id, nodesRef.current, edgesRef.current)

    if (saved) {
      setLastSaved(new Date())
    }

    setSaving(false)
  }, [id, isReadOnly, saveProject])

  const triggerAutoSave = useCallback(() => {
    if (isReadOnly) return

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    autoSaveTimer.current = setTimeout(() => {
      performSave()
    }, 1500)
  }, [isReadOnly, performSave])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const project = await fetchProject(id)

      if (!project) {
        navigate('/projects')
        return
      }

      const { rfNodes, rfEdges } = mapProjectToFlow(project)
      setNodes(rfNodes)
      setEdges(rfEdges)
      setLoading(false)
    }

    load()
  }, [id, fetchProject, navigate, setNodes, setEdges])

  useEffect(
    () => () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    },
    []
  )

  const handleNodesChange = useCallback(
    (changes) => {
      applyNodeChanges(changes)

      const shouldSave = changes.some((change) => {
        if (change.type === 'position') {
          return !change.dragging
        }

        return change.type === 'remove' || change.type === 'add' || change.type === 'replace'
      })

      if (shouldSave) {
        triggerAutoSave()
      }
    },
    [applyNodeChanges, triggerAutoSave]
  )

  const handleEdgesChange = useCallback(
    (changes) => {
      applyEdgeChanges(changes)

      if (changes.some((change) => change.type === 'remove' || change.type === 'add' || change.type === 'replace')) {
        triggerAutoSave()
      }
    },
    [applyEdgeChanges, triggerAutoSave]
  )

  const handleConnect = useCallback(
    (params) => {
      if (isReadOnly) return

      setEdges((currentEdges) => addEdge({ ...params, ...DEFAULT_EDGE_OPTIONS }, currentEdges))
      triggerAutoSave()
    },
    [isReadOnly, setEdges, triggerAutoSave]
  )

  const handleAddNode = useCallback(() => {
    const position = findFreePosition(nodesRef.current)
    const node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position,
      data: {
        title: 'New Node',
        label: 'New Node',
        description: '',
        notes: '',
        items: []
      }
    }

    setNodes((currentNodes) => [...currentNodes, node])
    setSelectedNodeId(node.id)
    triggerAutoSave()
  }, [setNodes, triggerAutoSave])

  const performDeleteNode = useCallback(() => {
    if (!selectedNodeId) return

    const nodeLabel =
      nodesRef.current.find((n) => n.id === selectedNodeId)?.data?.title || 'Node'

    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNodeId))
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    )
    setSelectedNodeId(null)
    setConfirmDelete(false)
    triggerAutoSave()
    toast.info(`"${nodeLabel}" removed`)
  }, [selectedNodeId, setNodes, setEdges, triggerAutoSave, toast])

  const handleNodeUpdate = useCallback(
    (nodeId, data) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data, label: data.title || node.data.label } }
            : node
        )
      )
      triggerAutoSave()
    },
    [setNodes, triggerAutoSave]
  )

  const handleManualSave = useCallback(async () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    await performSave()
    toast.success('Project saved')
  }, [performSave, toast])

  const handleRestoreVersion = useCallback(async () => {
    if (!confirmRestore) return

    const project = await rollback(id, confirmRestore.id)
    setConfirmRestore(null)
    if (!project) {
      toast.error('Failed to restore version')
      return
    }

    const { rfNodes, rfEdges } = mapProjectToFlow(project)
    setNodes(rfNodes)
    setEdges(rfEdges)
    setSelectedNodeId(null)
    setShowVersions(false)
    toast.success('Version restored')
  }, [confirmRestore, id, rollback, setNodes, setEdges, toast])

  const handleImport = useCallback(async () => {
    if (!importText.trim() || !importAcknowledged) return

    setImporting(true)
    const project = await importProject(id, importText)
    setImporting(false)
    if (!project) {
      toast.error('Import failed. Check the markdown format.')
      return
    }

    const { rfNodes, rfEdges } = mapProjectToFlow(project)
    setNodes(rfNodes)
    setEdges(rfEdges)
    setSelectedNodeId(null)
    setShowImport(false)
    setImportText('')
    setImportAcknowledged(false)
    toast.success('Project imported')
  }, [id, importProject, importText, importAcknowledged, setNodes, setEdges, toast])

  const handleExport = useCallback(async () => {
    const ok = await exportProject(id)
    if (ok) {
      toast.success('Project exported as markdown')
    } else {
      toast.error('Export failed')
    }
  }, [exportProject, id, toast])

  const openVersions = useCallback(async () => {
    await fetchVersions(id)
    setShowVersions(true)
  }, [fetchVersions, id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-secondary">
        <svg className="spinner h-10 w-10 text-indigo-300" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-secondary">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 md:px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="icon-btn icon-btn-ghost"
              aria-label="Back to projects"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-sm font-semibold text-content md:text-base">
                {currentProject?.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-content-muted">
                {saving ? (
                  <span className="flex items-center gap-1">
                    <svg className="spinner h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : null}
                {!saving && lastSaved ? (
                  <span>
                    Saved{' '}
                    {lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : null}
                {isReadOnly ? <Badge tone="warning">Read-only</Badge> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isReadOnly ? (
              <Button size="sm" onClick={handleAddNode}>
                Add Node
              </Button>
            ) : null}
            {!isReadOnly && selectedNodeId ? (
              <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete Node
              </Button>
            ) : null}
            {!isReadOnly ? (
              <Button size="sm" variant="secondary" disabled={saving} onClick={handleManualSave}>
                Save
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => setShowImport(true)}>
              Import
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExport}>
              Export
            </Button>
            <Button size="sm" variant="secondary" onClick={openVersions}>
              History
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mx-4 mt-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={NODE_TYPES}
            defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
            fitView
            fitViewOptions={FIT_VIEW_OPTIONS}
            nodesDraggable={!isReadOnly}
            nodesConnectable={!isReadOnly}
            elementsSelectable
            deleteKeyCode={null}
            style={CANVAS_STYLE}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2c41" />
            <Controls />
            <MiniMap nodeColor="#6f82ef" maskColor="rgba(11,17,29,0.76)" />
            {nodes.length === 0 ? (
              <Panel position="top-center">
                <div className="pointer-events-auto mt-20 max-w-sm rounded-2xl border border-border-subtle bg-surface px-6 py-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-surface-elevated">
                    <svg className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-content">Canvas is empty</p>
                  <p className="mt-1 text-sm text-content-muted">
                    {isReadOnly
                      ? 'This project is read-only.'
                      : 'Add your first node to start mapping out your flow.'}
                  </p>
                  {!isReadOnly ? (
                    <div className="mt-4">
                      <Button size="sm" onClick={handleAddNode}>
                        Add first node
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Panel>
            ) : null}
          </ReactFlow>
        </div>
      </div>

      {selectedNode ? (
        <NodePanel
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onClose={() => setSelectedNodeId(null)}
          readOnly={isReadOnly}
        />
      ) : null}

      <Modal
        open={showVersions}
        onClose={() => setShowVersions(false)}
        title="Version history"
        description="AppForge snapshots your project automatically. Restore any previous state here."
      >
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {versions.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-elevated px-4 py-6 text-center text-sm text-content-muted">
              No versions saved yet.
            </div>
          ) : (
            versions.map((version, index) => {
              const isLatest = index === 0
              const label = isLatest ? 'Latest version' : `Version ${versions.length - index}`
              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="surface-card flex items-start justify-between gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-content">{label}</p>
                      {isLatest ? <Badge tone="success">Current</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-content-muted">
                      {new Date(version.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!isReadOnly && !isLatest ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfirmRestore(version)}
                    >
                      Restore
                    </Button>
                  ) : null}
                </motion.div>
              )
            })
          )}
        </div>
      </Modal>

      <Modal
        open={showImport}
        onClose={() => {
          if (!importing) {
            setShowImport(false)
            setImportAcknowledged(false)
          }
        }}
        title="Import project"
        description="Paste project markdown below. The current canvas will be completely replaced."
        footer={[
          <Button
            key="cancel"
            variant="secondary"
            onClick={() => setShowImport(false)}
            disabled={importing}
          >
            Cancel
          </Button>,
          <Button
            key="import"
            variant="danger"
            onClick={handleImport}
            disabled={!importText.trim() || !importAcknowledged || importing}
          >
            {importing ? 'Importing...' : 'Replace project'}
          </Button>
        ]}
      >
        <div className="mb-3 flex items-center gap-2">
          <Badge tone="warning">Destructive action</Badge>
          <span className="text-xs text-content-muted">
            A new version will be created automatically before replacement.
          </span>
        </div>
        <Textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={12}
          className="font-mono"
          placeholder={'# PROJECT: My App\n## FLOW\nLogin → Dashboard'}
          aria-label="Project markdown"
        />
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-content-muted">
          <input
            type="checkbox"
            checked={importAcknowledged}
            onChange={(e) => setImportAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border-subtle bg-surface accent-indigo-400"
          />
          <span>I understand this will replace the current canvas content.</span>
        </label>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={performDeleteNode}
        title="Delete node?"
        description={
          selectedNode
            ? `"${selectedNode.data?.title || 'Untitled'}" will be removed from the canvas.`
            : undefined
        }
        details={[
          'The node and its content will be permanently removed.',
          edgeCountForSelection
            ? `${edgeCountForSelection} connected ${
                edgeCountForSelection === 1 ? 'edge' : 'edges'
              } will also be removed.`
            : 'No connected edges.'
        ]}
        confirmLabel="Delete node"
      />

      <ConfirmDialog
        open={Boolean(confirmRestore)}
        onClose={() => setConfirmRestore(null)}
        onConfirm={handleRestoreVersion}
        title="Restore this version?"
        description="The current canvas state will be replaced."
        details={[
          'Unsaved changes will be lost.',
          'A new entry will be added to version history.'
        ]}
        confirmLabel="Restore"
        tone="warning"
      />
    </div>
  )
}
