import React, { useEffect, useRef, useState } from 'react'
import useRoadmapStore from '../../stores/roadmapStore'
import TreeNode from './TreeNode'
import { ActionMenu, Badge, Button, EmptyState, Input, Modal, SectionHeader, Textarea, useToast } from '../ui/primitives'
import MobileHeader from '../layout/MobileHeader'
import SettingsModal from '../layout/SettingsModal'

export default function RoadmapView() {
  const { nodes, loading, error, fetchNodes, addNode, importMarkdown, exportMarkdown } = useRoadmapStore()
  const toast = useToast()
  const [newRootTitle, setNewRootTitle] = useState('')
  const [isAddingRoot, setIsAddingRoot] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importAcknowledged, setImportAcknowledged] = useState(false)
  const rootInputRef = useRef(null)

  useEffect(() => { fetchNodes() }, [])
  useEffect(() => { if (isAddingRoot && rootInputRef.current) rootInputRef.current.focus() }, [isAddingRoot])

  const handleAddRoot = async () => { const trimmed = newRootTitle.trim(); if (trimmed) await addNode(trimmed, null); setNewRootTitle(''); setIsAddingRoot(false) }
  const handleImport = async () => {
    if (!importText.trim() || !importAcknowledged) return
    setImporting(true)
    const ok = await importMarkdown(importText)
    setImporting(false)
    if (ok) { toast.success('Roadmap importée'); setShowImport(false); setImportText(''); setImportAcknowledged(false) } else toast.error("Échec de l'import")
  }

  const handleExport = async () => (await exportMarkdown()) ? toast.success('Roadmap exportée en roadmap.md') : toast.error("Échec de l'export")
  const totalItems = countAllNodes(nodes)

  return (
    <div className="flex h-full flex-col bg-secondary">
      <MobileHeader title="Roadmap" actions={[{ key: 'add', label: 'Ajouter', onClick: () => setIsAddingRoot(true) }]} menuActions={[{ key: 'import', label: 'Importer', onClick: () => setShowImport(true) }, { key: 'export', label: 'Exporter', onClick: handleExport }, { key: 'settings', label: 'Paramètres', onClick: () => setShowSettings(true) }]} />

      <div className="hidden border-b border-border-subtle px-5 py-4 md:block md:px-7">
        <SectionHeader
          title="Roadmap"
          subtitle={nodes.length ? `${nodes.length} sections • ${totalItems} éléments` : 'Structurez vos sections et éléments produit'}
          actions={[
            <ActionMenu key="menu" label="Actions" items={[{ key: 'import', label: 'Importer', onClick: () => setShowImport(true) }, { key: 'export', label: 'Exporter', onClick: handleExport }, { key: 'settings', label: 'Paramètres', onClick: () => setShowSettings(true) }]} />,
            <Button key="add" onClick={() => setIsAddingRoot(true)}>Ajouter une section</Button>
          ]}
        />
      </div>

      {error ? <div className="mx-5 mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 md:mx-7">{error}</div> : null}

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-7">
        {loading ? <div className="flex h-48 items-center justify-center"><svg className="spinner h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg></div> : nodes.length === 0 && !isAddingRoot ? (
          <EmptyState title="Aucune roadmap" description="Créez votre première section ou importez un markdown." action={<Button onClick={() => setIsAddingRoot(true)}>Créer la première section</Button>} />
        ) : (
          <div className="max-w-4xl space-y-2">
            {nodes.map((node) => <TreeNode key={node.id} node={node} depth={0} />)}
            {isAddingRoot && <div className="surface-card p-3"><Input ref={rootInputRef} value={newRootTitle} onChange={(e) => setNewRootTitle(e.target.value)} onBlur={handleAddRoot} placeholder="Titre de section..." /></div>}
          </div>
        )}
      </div>

      <Modal open={showImport} onClose={() => !importing && setShowImport(false)} title="Importer la roadmap" description="Le markdown remplacera entièrement le contenu actuel." footer={[<Button key="cancel" variant="secondary" onClick={() => setShowImport(false)} disabled={importing}>Annuler</Button>, <Button key="confirm" variant="danger" onClick={handleImport} disabled={importing || !importText.trim() || !importAcknowledged}>{importing ? 'Import en cours...' : 'Remplacer la roadmap'}</Button>]}>
        <div className="mb-3 flex items-center gap-2"><Badge tone="warning">Action destructive</Badge><span className="text-xs text-content-muted">Les sections actuelles seront supprimées.</span></div>
        <Textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={12} className="font-mono" placeholder={'# Frontend\n- Navbar'} />
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-content-muted"><input type="checkbox" checked={importAcknowledged} onChange={(e) => setImportAcknowledged(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border-subtle bg-surface accent-indigo-400" /><span>Je comprends que cela remplace la roadmap actuelle.</span></label>
      </Modal>
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

function countAllNodes(nodes) {
  if (!Array.isArray(nodes)) return 0
  let total = 0
  for (const n of nodes) { total += 1; if (n.children?.length) total += countAllNodes(n.children) }
  return total
}
