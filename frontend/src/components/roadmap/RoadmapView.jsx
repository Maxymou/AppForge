import React, { useEffect, useState, useRef } from 'react'
import useRoadmapStore from '../../stores/roadmapStore'
import TreeNode from './TreeNode'
import { Badge, Button, EmptyState, Input, Modal, SectionHeader, Textarea } from '../ui/primitives'

export default function RoadmapView() {
  const { nodes, loading, error, fetchNodes, addNode, importMarkdown, exportMarkdown } = useRoadmapStore()
  const [newRootTitle, setNewRootTitle] = useState('')
  const [isAddingRoot, setIsAddingRoot] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const rootInputRef = useRef(null)

  useEffect(() => { fetchNodes() }, [])
  useEffect(() => { if (isAddingRoot && rootInputRef.current) rootInputRef.current.focus() }, [isAddingRoot])

  const handleAddRoot = async () => {
    if (newRootTitle.trim()) {
      await addNode(newRootTitle.trim(), null)
      setNewRootTitle('')
    }
    setIsAddingRoot(false)
  }

  const handleImport = async () => {
    if (!importText.trim()) return
    setImporting(true)
    await importMarkdown(importText)
    setImporting(false)
    setShowImport(false)
    setImportText('')
  }

  return (
    <div className="flex h-full flex-col bg-secondary">
      <div className="border-b border-border-subtle px-5 py-4 md:px-7">
        <SectionHeader
          title="Roadmap"
          subtitle={`${nodes.length} ${nodes.length === 1 ? 'section' : 'sections'}`}
          actions={[
            <Button key="export" variant="secondary" onClick={exportMarkdown}>Export</Button>,
            <Button key="import" variant="secondary" onClick={() => setShowImport(true)}>Import</Button>,
            <Button key="add" onClick={() => setIsAddingRoot(true)}>Add Section</Button>
          ]}
        />
      </div>

      {error ? <div className="mx-5 mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 md:mx-7">{error}</div> : null}

      <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
        {loading ? (
          <div className="flex h-48 items-center justify-center"><svg className="spinner h-8 w-8 text-indigo-300" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg></div>
        ) : nodes.length === 0 && !isAddingRoot ? (
          <EmptyState
            icon={<svg className="h-7 w-7 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
            title="No roadmap yet"
            description="Create your first section or import a markdown roadmap to get started."
            action={<Button onClick={() => setIsAddingRoot(true)}>Create first section</Button>}
          />
        ) : (
          <div className="max-w-4xl space-y-2">
            {nodes.map((node) => <TreeNode key={node.id} node={node} depth={0} />)}

            {isAddingRoot && (
              <div className="surface-card p-3">
                <Input
                  ref={rootInputRef}
                  type="text"
                  value={newRootTitle}
                  onChange={(e) => setNewRootTitle(e.target.value)}
                  onBlur={handleAddRoot}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddRoot()
                    if (e.key === 'Escape') { setNewRootTitle(''); setIsAddingRoot(false) }
                  }}
                  placeholder="New section title..."
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import roadmap"
        description="Paste roadmap markdown. Current roadmap will be replaced."
        footer={[
          <Button key="confirm" onClick={handleImport} disabled={importing || !importText.trim()}>{importing ? 'Importing...' : 'Import'}</Button>,
          <Button key="cancel" variant="secondary" onClick={() => setShowImport(false)}>Cancel</Button>
        ]}
      >
        <div className="mb-3"><Badge tone="warning">Replace action</Badge></div>
        <Textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={12}
          className="font-mono"
          placeholder="# Frontend\n- Navbar\n- Routing"
        />
      </Modal>
    </div>
  )
}
