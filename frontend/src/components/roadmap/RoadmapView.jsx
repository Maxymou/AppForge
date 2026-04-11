import React, { useEffect, useRef, useState } from 'react'
import useRoadmapStore from '../../stores/roadmapStore'
import TreeNode from './TreeNode'
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  SectionHeader,
  Textarea,
  useToast
} from '../ui/primitives'

export default function RoadmapView() {
  const {
    nodes,
    loading,
    error,
    fetchNodes,
    addNode,
    importMarkdown,
    exportMarkdown
  } = useRoadmapStore()
  const toast = useToast()
  const [newRootTitle, setNewRootTitle] = useState('')
  const [isAddingRoot, setIsAddingRoot] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importAcknowledged, setImportAcknowledged] = useState(false)
  const rootInputRef = useRef(null)

  useEffect(() => {
    fetchNodes()
  }, [])

  useEffect(() => {
    if (isAddingRoot && rootInputRef.current) rootInputRef.current.focus()
  }, [isAddingRoot])

  const handleAddRoot = async () => {
    const trimmed = newRootTitle.trim()
    if (trimmed) {
      await addNode(trimmed, null)
      setNewRootTitle('')
    }
    setIsAddingRoot(false)
  }

  const handleCancelAddRoot = () => {
    setNewRootTitle('')
    setIsAddingRoot(false)
  }

  const handleOpenImport = () => {
    setImportAcknowledged(false)
    setShowImport(true)
  }

  const handleImport = async () => {
    if (!importText.trim() || !importAcknowledged) return
    setImporting(true)
    const ok = await importMarkdown(importText)
    setImporting(false)
    if (ok) {
      toast.success('Roadmap imported')
      setShowImport(false)
      setImportText('')
      setImportAcknowledged(false)
    } else {
      toast.error('Import failed. Check the markdown format.')
    }
  }

  const handleExport = async () => {
    const ok = await exportMarkdown()
    if (ok) {
      toast.success('Roadmap exported as roadmap.md')
    } else {
      toast.error('Export failed')
    }
  }

  const totalItems = countAllNodes(nodes)

  return (
    <div className="flex h-full flex-col bg-secondary">
      <div className="border-b border-border-subtle px-5 py-4 md:px-7">
        <SectionHeader
          title="Roadmap"
          subtitle={
            nodes.length
              ? `${nodes.length} ${nodes.length === 1 ? 'section' : 'sections'} • ${totalItems} total ${
                  totalItems === 1 ? 'item' : 'items'
                }`
              : 'Outline sections and items to plan your product'
          }
          actions={[
            <Button key="export" variant="secondary" onClick={handleExport}>
              Export
            </Button>,
            <Button key="import" variant="secondary" onClick={handleOpenImport}>
              Import
            </Button>,
            <Button key="add" onClick={() => setIsAddingRoot(true)}>
              Add Section
            </Button>
          ]}
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
        ) : nodes.length === 0 && !isAddingRoot ? (
          <EmptyState
            icon={
              <svg className="h-7 w-7 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            }
            title="No roadmap yet"
            description="Create your first section or import a markdown roadmap to get started."
            action={<Button onClick={() => setIsAddingRoot(true)}>Create first section</Button>}
          />
        ) : (
          <div className="max-w-4xl space-y-2">
            {nodes.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} />
            ))}

            {isAddingRoot && (
              <div className="surface-card p-3">
                <Input
                  ref={rootInputRef}
                  type="text"
                  value={newRootTitle}
                  onChange={(e) => setNewRootTitle(e.target.value)}
                  onBlur={handleAddRoot}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddRoot()
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      handleCancelAddRoot()
                    }
                  }}
                  placeholder="New section title..."
                  aria-label="New section title"
                />
                <p className="mt-2 text-xs text-content-muted">
                  Press <kbd className="rounded border border-border-subtle px-1.5 py-0.5 text-[0.65rem]">Enter</kbd>{' '}
                  to save or{' '}
                  <kbd className="rounded border border-border-subtle px-1.5 py-0.5 text-[0.65rem]">Esc</kbd> to cancel.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showImport}
        onClose={() => {
          if (!importing) {
            setShowImport(false)
            setImportAcknowledged(false)
          }
        }}
        title="Import roadmap"
        description="Paste markdown below. This will completely replace your current roadmap."
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
            key="confirm"
            variant="danger"
            onClick={handleImport}
            disabled={importing || !importText.trim() || !importAcknowledged}
          >
            {importing ? 'Importing...' : 'Replace roadmap'}
          </Button>
        ]}
      >
        <div className="mb-3 flex items-center gap-2">
          <Badge tone="warning">Destructive action</Badge>
          <span className="text-xs text-content-muted">Existing sections will be erased.</span>
        </div>
        <Textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={12}
          className="font-mono"
          placeholder={'# Frontend\n- Navbar\n- Routing\n\n# Backend\n- API\n- Auth'}
          aria-label="Roadmap markdown"
        />
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-content-muted">
          <input
            type="checkbox"
            checked={importAcknowledged}
            onChange={(e) => setImportAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border-subtle bg-surface accent-indigo-400"
          />
          <span>I understand this will replace my current roadmap.</span>
        </label>
      </Modal>
    </div>
  )
}

function countAllNodes(nodes) {
  if (!Array.isArray(nodes)) return 0
  let total = 0
  for (const n of nodes) {
    total += 1
    if (n.children?.length) total += countAllNodes(n.children)
  }
  return total
}
