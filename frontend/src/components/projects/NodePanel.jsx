import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge, Button, IconButton, Input, Textarea } from '../ui/primitives'

export default function NodePanel({ node, onUpdate, onClose, readOnly }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (node) {
      setTitle(node.data?.title || node.data?.label || '')
      setDescription(node.data?.description || '')
      setNotes(node.data?.notes || '')
      setItems(node.data?.items || [])
      setIsDirty(false)
    }
  }, [node?.id])

  const save = () => {
    onUpdate?.(node.id, { title, description, notes, items })
    setIsDirty(false)
  }

  if (!node) return null

  return (
    <motion.aside initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }} className="surface-panel h-full w-[330px] rounded-l-2xl rounded-r-none border-r-0 md:w-[360px]">
      <div className="flex h-full flex-col overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-content">Node editor</p>
            <Badge className="mt-1">{readOnly ? 'Read-only' : 'Editable'}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && isDirty ? <Button size="sm" onClick={save}>Save</Button> : null}
            <IconButton onClick={onClose}><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></IconButton>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-content-muted">Title</label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); setIsDirty(true) }} disabled={readOnly} placeholder="Node title" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-content-muted">Description</label>
            <Textarea value={description} onChange={(e) => { setDescription(e.target.value); setIsDirty(true) }} disabled={readOnly} rows={3} placeholder="Describe this node..." />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-content-muted">Notes</label>
            <Textarea value={notes} onChange={(e) => { setNotes(e.target.value); setIsDirty(true) }} disabled={readOnly} rows={4} className="font-mono" placeholder="Additional notes..." />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wide text-content-muted">Items</label>
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div key={`${item}-${idx}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="surface-card flex items-center gap-2 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                    <p className="flex-1 truncate text-sm text-slate-200">{item}</p>
                    {!readOnly ? <IconButton onClick={() => { setItems(items.filter((_, i) => i !== idx)); setIsDirty(true) }}><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></IconButton> : null}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {!readOnly ? (
              <div className="mt-2 flex gap-2">
                <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setItems([...items, newItem.trim()].filter(Boolean)), setNewItem(''), setIsDirty(true))} placeholder="Add item..." />
                <Button size="sm" onClick={() => { if (!newItem.trim()) return; setItems([...items, newItem.trim()]); setNewItem(''); setIsDirty(true) }}>Add</Button>
              </div>
            ) : null}
          </div>
        </div>

        {!readOnly ? <div className="border-t border-border-subtle p-4"><Button className="w-full" onClick={save} disabled={!isDirty}>{isDirty ? 'Save changes' : 'No changes'}</Button></div> : null}
      </div>
    </motion.aside>
  )
}
