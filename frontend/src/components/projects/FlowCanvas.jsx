import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReactFlow, Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState, BackgroundVariant } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useProjectStore from '../../stores/projectStore'
import CustomNode from './CustomNode'
import NodePanel from './NodePanel'
import { ActionMenu, Badge, Button, Modal, Textarea, useToast } from '../ui/primitives'
import MobileHeader from '../layout/MobileHeader'
import SettingsModal from '../layout/SettingsModal'
import useDeviceMode from '../../hooks/useDeviceMode'

const NODE_TYPES = { custom: CustomNode }
const DEFAULT_EDGE_OPTIONS = { type: 'smoothstep', style: { stroke: '#5f74dd', strokeWidth: 2 } }
const FIT_VIEW_OPTIONS = { padding: 0.01, includeHiddenNodes: false, duration: 240 }
const mapProjectToFlow = (project) => ({
  rfNodes: (project.nodes || []).map((n) => ({ id: n.nodeId, type: 'custom', position: { x: n.posX, y: n.posY }, data: { title: n.title, label: n.title, description: n.description || '', notes: n.notes || '', items: n.items || [] } })),
  rfEdges: (project.edges || []).map((e) => ({ id: e.edgeId, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null, targetHandle: e.targetHandle || null, ...DEFAULT_EDGE_OPTIONS }))
})

export default function FlowCanvas() {
  const { id } = useParams(); const navigate = useNavigate(); const toast = useToast()
  const currentProject = useProjectStore((s) => s.currentProject)
  const versions = useProjectStore((s) => s.versions)
  const error = useProjectStore((s) => s.error)
  const { fetchProject, saveProject, exportProject, importProject, fetchVersions, rollback } = useProjectStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importAcknowledged, setImportAcknowledged] = useState(false)
  const [loading, setLoading] = useState(true)
  const { isMobileViewport, isStandalonePWA, isDesktop } = useDeviceMode()
  const showMiniMap = isDesktop && !isStandalonePWA
  const showControls = isDesktop && !isStandalonePWA
  const isReadOnly = currentProject?.readOnly || false
  const nodesRef = useRef(nodes); const edgesRef = useRef(edges)
  const flowContainerRef = useRef(null)
  const reactFlowInstanceRef = useRef(null)
  const fitTimeoutRef = useRef(null)
  const fitFrameRef = useRef(null)

  const runFitView = useCallback((delay = 0) => {
    if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current)
    fitTimeoutRef.current = window.setTimeout(() => {
      if (fitFrameRef.current) cancelAnimationFrame(fitFrameRef.current)
      fitFrameRef.current = window.requestAnimationFrame(() => {
        if (!reactFlowInstanceRef.current || nodesRef.current.length === 0) return
        reactFlowInstanceRef.current.fitView(FIT_VIEW_OPTIONS)
      })
    }, delay)
  }, [])

  useEffect(() => {
    return () => {
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current)
      if (fitFrameRef.current) cancelAnimationFrame(fitFrameRef.current)
    }
  }, [])

  useEffect(()=>{nodesRef.current=nodes},[nodes]); useEffect(()=>{edgesRef.current=edges},[edges])
  useEffect(() => { (async()=>{setLoading(true); const p=await fetchProject(id); if(!p){navigate('/projects');return}; const {rfNodes,rfEdges}=mapProjectToFlow(p); setNodes(rfNodes); setEdges(rfEdges); setLoading(false) })() }, [id])

  useEffect(() => {
    if (!flowContainerRef.current) return undefined
    const observer = new ResizeObserver(() => runFitView(48))
    observer.observe(flowContainerRef.current)
    return () => observer.disconnect()
  }, [runFitView])

  const layoutSignature = useMemo(() => {
    const nodeIds = nodes.map((node) => node.id).join('|')
    const edgeIds = edges.map((edge) => edge.id).join('|')
    return `${id}:${nodeIds}:${edgeIds}`
  }, [id, nodes, edges])

  useEffect(() => {
    if (loading || nodes.length === 0) return
    runFitView(56)
  }, [layoutSignature, showDesktopNodePanel, loading, nodes.length, runFitView])

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId])
  const showDesktopNodePanel = Boolean(selectedNode) && !isMobileViewport && !isStandalonePWA
  const showMobileNodePanel = Boolean(selectedNode) && (isMobileViewport || isStandalonePWA)
  const handleConnect = useCallback((params) => { if (!isReadOnly) setEdges((eds) => addEdge({ ...params, ...DEFAULT_EDGE_OPTIONS }, eds)) }, [isReadOnly])
  const handleAddNode = () => { const node = { id: `node-${Date.now()}`, type: 'custom', position: { x: 140, y: 140 }, data: { title: 'Nouveau nœud', label: 'Nouveau nœud', description: '', notes: '', items: [] } }; setNodes((c) => [...c, node]); setSelectedNodeId(node.id); runFitView(70) }
  const handleManualSave = async () => { await saveProject(id, nodesRef.current, edgesRef.current); toast.success('Projet enregistré') }
  const handleExport = async () => (await exportProject(id)) ? toast.success('Projet exporté') : toast.error("Échec de l'export")
  const handleImport = async () => { const p = await importProject(id, importText); if(p){const {rfNodes,rfEdges}=mapProjectToFlow(p); setNodes(rfNodes); setEdges(rfEdges); setShowImport(false); runFitView(70); toast.success('Projet importé')} }

  if (loading) return <div className="flex h-full items-center justify-center bg-secondary">Chargement...</div>

  return (
    <div className="flex h-full min-w-0 flex-1 bg-secondary">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileHeader
          title={currentProject?.name || 'Projet'}
          subtitle={isReadOnly ? 'Mode lecture seule' : `${nodes.length} nœud(s) • ${edges.length} lien(s)`}
          backAction={{ label: 'Projets', onClick: () => navigate('/projects') }}
          secondaryActions={[{ key: 'save', label: 'Enregistrer', onClick: handleManualSave, variant: 'secondary' }]}
          primaryAction={{ key: 'add', label: 'Ajouter', onClick: handleAddNode }}
          menuActions={[{ key: 'import', label: 'Importer', onClick: () => setShowImport(true) }, { key: 'export', label: 'Exporter', onClick: handleExport }, { key: 'versions', label: 'Historique', onClick: async()=>{await fetchVersions(id); setShowVersions(true)} }, { key: 'settings', label: 'Paramètres', onClick: () => setShowSettings(true) }]}
        />

        <div className="hidden items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 md:flex md:px-5">
          <div className="flex items-center gap-3"><button onClick={() => navigate('/projects')} className="icon-btn icon-btn-ghost">←</button><h2 className="text-sm font-semibold text-content md:text-base">{currentProject?.name}</h2>{isReadOnly ? <Badge tone="warning">Lecture seule</Badge> : null}</div>
          <div className="flex items-center gap-2"><Button size="sm" onClick={handleAddNode}>Ajouter un nœud</Button><Button size="sm" variant="secondary" onClick={handleManualSave}>Enregistrer</Button><ActionMenu label="Actions" items={[{ key: 'import', label: 'Importer', onClick: () => setShowImport(true) }, { key: 'export', label: 'Exporter', onClick: handleExport }, { key: 'history', label: 'Historique', onClick: async()=>{await fetchVersions(id); setShowVersions(true)} }, { key: 'settings', label: 'Paramètres', onClick: () => setShowSettings(true) }]} /></div>
        </div>

        {error ? <div className="mx-4 mt-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div> : null}
        <div ref={flowContainerRef} className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={handleConnect} onNodeClick={(_, node) => setSelectedNodeId(node.id)} onPaneClick={() => setSelectedNodeId(null)} onInit={(instance) => { reactFlowInstanceRef.current = instance; runFitView(72) }} nodeTypes={NODE_TYPES} defaultEdgeOptions={DEFAULT_EDGE_OPTIONS} fitView fitViewOptions={FIT_VIEW_OPTIONS} nodesDraggable={!isReadOnly} nodesConnectable={!isReadOnly} deleteKeyCode={null} style={{ background: '#0b111d' }}>
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2c41" />
            {showControls ? <Controls /> : null}
            {showMiniMap ? <MiniMap nodeColor="#6f82ef" maskColor="rgba(11,17,29,0.76)" /> : null}
          </ReactFlow>
        </div>
      </div>

      {showDesktopNodePanel ? <NodePanel mobile={false} node={selectedNode} onUpdate={(nodeId, data) => setNodes((curr)=>curr.map((n)=>n.id===nodeId?{...n,data:{...n.data,...data,label:data.title||n.data.label}}:n))} onClose={() => setSelectedNodeId(null)} readOnly={isReadOnly} /> : null}
      {showMobileNodePanel ? <NodePanel mobile node={selectedNode} onUpdate={(nodeId, data) => setNodes((curr)=>curr.map((n)=>n.id===nodeId?{...n,data:{...n.data,...data,label:data.title||n.data.label}}:n))} onClose={() => setSelectedNodeId(null)} readOnly={isReadOnly} /> : null}
      <Modal open={showVersions} onClose={() => setShowVersions(false)} title="Historique" description="Restaurez une version précédente.">{versions.map((v)=><div key={v.id} className="mb-2 flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2 text-sm"><span>{new Date(v.createdAt).toLocaleString('fr-FR')}</span><Button size="sm" variant="secondary" onClick={async()=>{const p=await rollback(id,v.id); if(p){const {rfNodes,rfEdges}=mapProjectToFlow(p); setNodes(rfNodes); setEdges(rfEdges); runFitView(70); setShowVersions(false)}}}>Restaurer</Button></div>)}</Modal>
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Importer un projet"><Textarea value={importText} onChange={(e)=>setImportText(e.target.value)} rows={10} className="font-mono"/><label className="mt-3 flex items-start gap-2 text-sm text-content-muted"><input type="checkbox" checked={importAcknowledged} onChange={(e)=>setImportAcknowledged(e.target.checked)} /><span>Je comprends que le canvas actuel sera remplacé.</span></label><Button className="mt-3 w-full" variant="danger" onClick={handleImport} disabled={!importText.trim()||!importAcknowledged}>Remplacer</Button></Modal>
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
