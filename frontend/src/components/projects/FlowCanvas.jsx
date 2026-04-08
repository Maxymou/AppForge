import React, { useEffect, useState, useCallback, useRef } from 'react'
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
import { motion, AnimatePresence } from 'framer-motion'
import useProjectStore from '../../stores/projectStore'
import CustomNode from './CustomNode'
import NodePanel from './NodePanel'

const nodeTypes = { custom: CustomNode }

const initialNodes = []
const initialEdges = []

export default function FlowCanvas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProject, fetchProject, saveProject, exportProject, importProject, fetchVersions, rollback, versions, error } = useProjectStore()

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [showVersions, setShowVersions] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  const autoSaveTimer = useRef(null)
  const isReadOnly = currentProject?.readOnly || false

  // Load project on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const project = await fetchProject(id)
      if (!project) {
        navigate('/projects')
        return
      }

      // Convert DB nodes to React Flow nodes
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

      // Convert DB edges to React Flow edges
      const rfEdges = (project.edges || []).map((e) => ({
        id: e.edgeId,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        animated: false
      }))

      setNodes(rfNodes)
      setEdges(rfEdges)
      setLoading(false)
    }

    load()
  }, [id])

  // Auto-save on change (debounced 2s)
  const triggerAutoSave = useCallback(() => {
    if (isReadOnly) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      performSave()
    }, 2000)
  }, [nodes, edges, isReadOnly])

  const performSave = useCallback(async () => {
    if (isReadOnly) return
    setSaving(true)
    // Get latest nodes/edges from state
    setNodes((currentNodes) => {
      setEdges((currentEdges) => {
        saveProject(id, currentNodes, currentEdges).then(() => {
          setLastSaved(new Date())
          setSaving(false)
        })
        return currentEdges
      })
      return currentNodes
    })
  }, [id, isReadOnly])

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [])

  const onConnect = useCallback((params) => {
    if (isReadOnly) return
    const newEdge = {
      ...params,
      type: 'smoothstep',
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    }
    setEdges((eds) => addEdge(newEdge, eds))
    triggerAutoSave()
  }, [isReadOnly, triggerAutoSave])

  const onNodesChangeHandler = useCallback((changes) => {
    onNodesChange(changes)
    const hasPositionChange = changes.some(c => c.type === 'position' && !c.dragging)
    if (hasPositionChange) triggerAutoSave()
  }, [onNodesChange, triggerAutoSave])

  const onEdgesChangeHandler = useCallback((changes) => {
    onEdgesChange(changes)
    const hasRemoval = changes.some(c => c.type === 'remove')
    if (hasRemoval) triggerAutoSave()
  }, [onEdgesChange, triggerAutoSave])

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleNodeUpdate = useCallback((nodeId, data) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...data, label: data.title || n.data.label } }
          : n
      )
    )
    setSelectedNode((prev) =>
      prev?.id === nodeId
        ? { ...prev, data: { ...prev.data, ...data, label: data.title || prev.data.label } }
        : prev
    )
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleAddNode = () => {
    if (isReadOnly) return
    const id = `node-${Date.now()}`
    const centerX = Math.random() * 400 + 100
    const centerY = Math.random() * 300 + 100
    const newNode = {
      id,
      type: 'custom',
      position: { x: centerX, y: centerY },
      data: { title: 'New Node', label: 'New Node', description: '', notes: '', items: [] }
    }
    setNodes((nds) => [...nds, newNode])
    setSelectedNode(newNode)
    triggerAutoSave()
  }

  const handleDeleteSelectedNode = () => {
    if (!selectedNode || isReadOnly) return
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
    setSelectedNode(null)
    triggerAutoSave()
  }

  const handleManualSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setSaving(true)
    await saveProject(id, nodes, edges)
    setLastSaved(new Date())
    setSaving(false)
  }

  const handleExport = () => {
    exportProject(id)
  }

  const handleShowVersions = async () => {
    await fetchVersions(id)
    setShowVersions(true)
  }

  const handleRollback = async (versionId) => {
    const project = await rollback(id, versionId)
    if (project) {
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
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      }))
      setNodes(rfNodes)
      setEdges(rfEdges)
      setSelectedNode(null)
      setShowVersions(false)
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) return
    const project = await importProject(id, importText)
    if (project) {
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
        type: 'smoothstep',
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      }))
      setNodes(rfNodes)
      setEdges(rfEdges)
      setSelectedNode(null)
      setShowImport(false)
      setImportText('')
    }
  }

  const formatTime = (date) => {
    if (!date) return null
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatVersionDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <svg className="w-10 h-10 text-blue-500 spinner" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-slate-900">
      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/projects')}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            <div>
              <h2 className="text-white font-semibold text-sm">{currentProject?.name}</h2>
              <div className="flex items-center gap-2">
                {saving && (
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3 spinner" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                )}
                {lastSaved && !saving && (
                  <span className="text-slate-500 text-xs">Saved {formatTime(lastSaved)}</span>
                )}
                {isReadOnly && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">Read-only</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddNode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Node
                </motion.button>
                {selectedNode && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteSelectedNode}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-700 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleManualSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </motion.button>
              </>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Import
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShowVersions}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </motion.button>
          </div>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-4 mt-2 bg-red-900/40 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-xs"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* React Flow canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={!isReadOnly}
            nodesConnectable={!isReadOnly}
            elementsSelectable={true}
            deleteKeyCode={null}
            style={{ background: '#0f172a' }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#1e293b"
            />
            <Controls
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            <MiniMap
              nodeColor="#3b82f6"
              maskColor="rgba(15, 23, 42, 0.7)"
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />

            {/* Empty state overlay */}
            {nodes.length === 0 && (
              <Panel position="top-center">
                <div className="mt-20 text-center pointer-events-none">
                  <p className="text-slate-500 text-lg font-medium">Canvas is empty</p>
                  <p className="text-slate-600 text-sm mt-1">
                    {isReadOnly ? 'This project is read-only' : 'Click "Add Node" to start building your flow'}
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>

      {/* Node panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodePanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
            readOnly={isReadOnly}
          />
        )}
      </AnimatePresence>

      {/* Versions panel modal */}
      <AnimatePresence>
        {showVersions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowVersions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-700">
                <h2 className="text-lg font-bold text-white">Version History</h2>
                <button
                  onClick={() => setShowVersions(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {versions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <svg className="w-10 h-10 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No versions saved yet</p>
                    <p className="text-sm mt-1 text-slate-500">Save your project to create version history</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {versions.map((version, index) => (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-mono">
                            v{versions.length - index}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {index === 0 ? 'Latest' : `Version ${versions.length - index}`}
                            </p>
                            <p className="text-slate-400 text-xs">{formatVersionDate(version.createdAt)}</p>
                          </div>
                        </div>
                        {!isReadOnly && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (window.confirm('Rollback to this version? Current changes will be lost.')) {
                                handleRollback(version.id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                          >
                            Restore
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowImport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-1">Import Project</h2>
              <p className="text-slate-400 text-sm mb-4">Paste your project.md content. This will replace the current flow.</p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="# PROJECT: My App&#10;&#10;## FLOW&#10;Login → Dashboard&#10;&#10;## NODES&#10;&#10;### Login&#10;- Email field&#10;- Password field"
                rows={12}
                className="w-full bg-slate-700 text-white text-sm px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none font-mono placeholder-slate-500 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Import
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowImport(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
