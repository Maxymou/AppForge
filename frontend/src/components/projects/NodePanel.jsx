import React, { memo, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge, Button, IconButton, Input, Textarea } from '../ui/primitives'

function NodePanel({ node, onUpdate, onClose, readOnly, mobile = false }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!node) return
    setTitle(node.data?.title || node.data?.label || '')
    setDescription(node.data?.description || '')
    setNotes(node.data?.notes || '')
    setItems(node.data?.items || [])
    setNewItem('')
    setIsDirty(false)
  }, [node])

  const canSave = isDirty && title.trim().length > 0
  const save = useCallback(() => { if (node && canSave) { onUpdate?.(node.id, { title: title.trim(), description, notes, items }); setIsDirty(false) } }, [node, onUpdate, title, description, notes, items, canSave])
  const removeItem = useCallback((idx) => { setItems((current) => current.filter((_, i) => i !== idx)); setIsDirty(true) }, [])
  const addItem = useCallback(() => { const nextItem = newItem.trim(); if (!nextItem) return; setItems((current) => [...current, nextItem]); setNewItem(''); setIsDirty(true) }, [newItem])

  if (!node) return null

  const content = (
    <>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border-subtle bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-content-muted">Éditeur de nœud</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-content">{title || 'Nœud sans titre'}</p>
          <div className="mt-1.5 flex items-center gap-2"><Badge tone={readOnly ? 'warning' : 'success'}>{readOnly ? 'Lecture seule' : 'Modifiable'}</Badge>{isDirty && !readOnly ? <Badge tone="warning">Brouillon non enregistré</Badge> : null}</div>
        </div>
        <IconButton onClick={onClose} tooltip="Fermer" label="Fermer l'éditeur">✕</IconButton>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <div><label className="node-panel__label" htmlFor="node-title">Nom</label><Input id="node-title" value={title} onChange={(e) => { setTitle(e.target.value); setIsDirty(true) }} disabled={readOnly} placeholder="Titre du nœud" aria-invalid={isDirty && !title.trim()} />{isDirty && !title.trim() ? <p className="mt-1.5 text-xs text-red-300">Un titre est requis.</p> : null}</div>
        <div><label className="node-panel__label" htmlFor="node-description">Description</label><Textarea id="node-description" value={description} onChange={(e) => { setDescription(e.target.value); setIsDirty(true) }} disabled={readOnly} rows={3} placeholder="Décrivez ce nœud..." /></div>
        <div><label className="node-panel__label" htmlFor="node-notes">Notes</label><Textarea id="node-notes" value={notes} onChange={(e) => { setNotes(e.target.value); setIsDirty(true) }} disabled={readOnly} rows={4} className="font-mono" placeholder="Notes additionnelles..." /></div>
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="node-panel__label !mb-0">Éléments</span><span className="text-xs text-content-muted">{items.length} {items.length === 1 ? 'élément' : 'éléments'}</span></div>
          <div className="space-y-2"><AnimatePresence>{items.map((item, idx) => <motion.div key={`${item}-${idx}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="node-panel__item"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" /><p className="flex-1 break-words text-sm text-slate-200">{item}</p>{!readOnly ? <IconButton onClick={() => removeItem(idx)} tooltip="Supprimer" label={`Supprimer ${item}`} variant="danger">✕</IconButton> : null}</motion.div>)}</AnimatePresence>{items.length === 0 ? <p className="text-xs italic text-content-muted">Aucun élément pour le moment.</p> : null}</div>
          {!readOnly ? <div className="mt-2 flex gap-2"><Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }} placeholder="Ajouter un élément puis Entrée" aria-label="Nouvel élément" /><Button size="sm" onClick={addItem} disabled={!newItem.trim()}>Ajouter</Button></div> : null}
        </div>
      </div>
      {!readOnly ? <div className="sticky bottom-0 border-t border-border-subtle bg-surface px-4 py-3"><Button className="w-full" onClick={save} disabled={!canSave}>{isDirty ? 'Enregistrer les modifications' : 'Aucun changement'}</Button></div> : null}
    </>
  )

  if (mobile) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} className="surface-panel flex h-[min(82vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border">
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <motion.aside initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }} className="surface-panel h-full w-[340px] rounded-l-2xl rounded-r-none border-r-0 md:w-[390px]">
      <div className="flex h-full flex-col overflow-hidden">{content}</div>
    </motion.aside>
  )
}

export default memo(NodePanel)
