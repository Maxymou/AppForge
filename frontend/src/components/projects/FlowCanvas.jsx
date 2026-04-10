import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, BackgroundVariant, Panel } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import useProjectStore from '../../stores/projectStore'
import CustomNode from './CustomNode'
import NodePanel from './NodePanel'
import { Badge, Button, Modal, Textarea } from '../ui/primitives'

const NODE_TYPES = { custom: CustomNode }
const EDGE_STYLE = { stroke: '#5f74dd', strokeWidth: 2 }
const DEFAULT_EDGE_OPTIONS = { type: 'smoothstep', style: EDGE_STYLE }
const FIT_VIEW_OPTIONS = { padding: 0.2 }
const CANVAS_STYLE = { background: '#0b111d' }

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

export default function FlowCanvas() {
  const { id } = useParams()
  const navigate = useNavigate()

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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

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
    const node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { title: 'New Node', label: 'New Node', description: '', notes: '', items: [] }
    }

    setNodes((currentNodes) => [...currentNodes, node])
    setSelectedNodeId(node.id)
    triggerAutoSave()
  }, [setNodes, triggerAutoSave])

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return

    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNodeId))
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    )
    setSelectedNodeId(null)
    triggerAutoSave()
  }, [selectedNodeId, setNodes, setEdges, triggerAutoSave])

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
  }, [performSave])

  const handleRestoreVersion = useCallback(
    async (versionId) => {
      const confirmed = window.confirm('Rollback to this version? Current changes will be lost.')
      if (!confirmed) return

      const project = await rollback(id, versionId)
      if (!project) return

      const { rfNodes, rfEdges } = mapProjectToFlow(project)
      setNodes(rfNodes)
      setEdges(rfEdges)
      setSelectedNodeId(null)
      setShowVersions(false)
    },
    [id, rollback, setNodes, setEdges]
  )

  const handleImport = useCallback(async () => {
    if (!importText.trim()) return

    const project = await importProject(id, importText)
    if (!project) return

    const { rfNodes, rfEdges } = mapProjectToFlow(project)
    setNodes(rfNodes)
    setEdges(rfEdges)
    setSelectedNodeId(null)
    setShowImport(false)
    setImportText('')
  }, [id, importProject, importText, setNodes, setEdges])

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
            <button onClick={() => navigate('/projects')} className="icon-btn icon-btn-ghost">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-sm font-semibold text-content md:text-base">{currentProject?.name}</h2>
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
                    Saved {lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : null}
                {isReadOnly ? <Badge tone="warning">Read-only</Badge> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isReadOnly ? <Button size="sm" onClick={handleAddNode}>Add Node</Button> : null}
            {!isReadOnly && selectedNodeId ? (
              <Button size="sm" variant="danger" onClick={handleDeleteNode}>
                Delete
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
            <Button size="sm" variant="secondary" onClick={() => exportProject(id)}>
              Export
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await fetchVersions(id)
                setShowVersions(true)
              }}
            >
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
                <div className="pointer-events-none mt-20 rounded-2xl border border-border-subtle bg-surface px-6 py-5 text-center">
                  <p className="text-lg font-semibold text-content">Canvas is empty</p>
                  <p className="mt-1 text-sm text-content-muted">
                    {isReadOnly ? 'This project is read-only.' : 'Click Add Node to start building your flow.'}
                  </p>
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
        description="Restore a previous snapshot if needed."
      >
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-elevated px-4 py-6 text-center text-sm text-content-muted">
              No versions saved yet.
            </div>
          ) : (
            versions.map((version, index) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-card flex items-center justify-between p-3"
              >
                <div>
                  <p className="text-sm font-medium text-content">
                    {index === 0 ? 'Latest' : `Version ${versions.length - index}`}
                  </p>
                  <p className="text-xs text-content-muted">
                    {new Date(version.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {!isReadOnly ? (
                  <Button size="sm" variant="secondary" onClick={() => handleRestoreVersion(version.id)}>
                    Restore
                  </Button>
                ) : null}
              </motion.div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import project"
        description="Paste project markdown. Current flow will be replaced."
        footer={[
          <Button key="import" onClick={handleImport} disabled={!importText.trim()}>
            Import
          </Button>,
          <Button key="cancel" variant="secondary" onClick={() => setShowImport(false)}>
            Cancel
          </Button>
        ]}
      >
        <Textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={12}
          className="font-mono"
          placeholder="# PROJECT: My App\n## FLOW\nLogin → Dashboard"
        />
      </Modal>
    </div>
  )
}
