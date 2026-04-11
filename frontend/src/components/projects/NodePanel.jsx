import React, { memo, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge, Button, IconButton, Input, Textarea } from '../ui/primitives'

const FermerIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const TrashIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m3 0V5a2 2 0 012-2h4a2 2 0 012 2v2m-9 0h12"
    />
  </svg>
)

function NodePanel({ node, onUpdate, onFermer, readOnly, mobile = false }) {
  const [title, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setÉléments] = useState([])
  const [newItem, setNewItem] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!node) return

    setTitre(node.data?.title || node.data?.label || '')
    setDescription(node.data?.description || '')
    setNotes(node.data?.notes || '')
    setÉléments(node.data?.items || [])
    setNewItem('')
    setIsDirty(false)
  }, [node])

  const canSave = isDirty && title.trim().length > 0

  const save = useCallback(() => {
    if (!node || !canSave) return
    onUpdate?.(node.id, { title: title.trim(), description, notes, items })
    setIsDirty(false)
  }, [node, onUpdate, title, description, notes, items, canSave])

  const removeItem = useCallback((indexToRemove) => {
    setÉléments((currentÉléments) => currentÉléments.filter((_, index) => index !== indexToRemove))
    setIsDirty(true)
  }, [])

  const addItem = useCallback(() => {
    const nextItem = newItem.trim()
    if (!nextItem) return
    setÉléments((currentÉléments) => [...currentÉléments, nextItem])
    setNewItem('')
    setIsDirty(true)
  }, [newItem])

  if (!node) return null

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={`surface-panel ${mobile ? 'fixed inset-x-4 top-[max(72px,calc(var(--sat)+72px))] z-50 h-[70vh] w-auto rounded-2xl border' : 'h-full w-[330px] rounded-l-2xl rounded-r-none border-r-0 md:w-[380px]'}`}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border-subtle bg-surface px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-content-muted">
              Éditeur de nœud
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-content">
              {title || 'Nœud sans titre'}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge tone={readOnly ? 'warning' : 'success'}>
                {readOnly ? 'Lecture seule' : 'Modifiable'}
              </Badge>
              {isDirty && !readOnly ? (
                <Badge tone="warning">Modifications non enregistrées</Badge>
              ) : null}
            </div>
          </div>
          <IconButton onClick={onFermer} tooltip="Fermer" label="Fermer node editor">
            <FermerIcon />
          </IconButton>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <label className="node-panel__label" htmlFor="node-title">
              Titre
            </label>
            <Input
              id="node-title"
              value={title}
              onChange={(e) => {
                setTitre(e.target.value)
                setIsDirty(true)
              }}
              disabled={readOnly}
              placeholder="Titre du nœud"
              aria-invalid={isDirty && !title.trim()}
            />
            {isDirty && !title.trim() ? (
              <p className="mt-1.5 text-xs text-red-300">Un titre est requis.</p>
            ) : null}
          </div>

          <div>
            <label className="node-panel__label" htmlFor="node-description">
              Description
            </label>
            <Textarea
              id="node-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setIsDirty(true)
              }}
              disabled={readOnly}
              rows={3}
              placeholder="Décrivez ce nœud..."
            />
          </div>

          <div>
            <label className="node-panel__label" htmlFor="node-notes">
              Notes
            </label>
            <Textarea
              id="node-notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setIsDirty(true)
              }}
              disabled={readOnly}
              rows={4}
              className="font-mono"
              placeholder="Notes additionnelles..."
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="node-panel__label !mb-0">Éléments</span>
              <span className="text-xs text-content-muted">
                {items.length} {items.length === 1 ? 'élément' : 'éléments'}
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div
                    key={`${item}-${idx}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="node-panel__item"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
                    <p className="flex-1 break-words text-sm text-slate-200">{item}</p>
                    {!readOnly ? (
                      <IconButton
                        onClick={() => removeItem(idx)}
                        tooltip="Supprimer l'élément"
                        label={`Supprimer l'élément ${item}`}
                        variant="danger"
                      >
                        <TrashIcon />
                      </IconButton>
                    ) : null}
                  </motion.div>
                ))}
              </AnimatePresence>
              {items.length === 0 ? (
                <p className="text-xs italic text-content-muted">Aucun élément pour le moment.</p>
              ) : null}
            </div>
            {!readOnly ? (
              <div className="mt-2 flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addItem()
                    }
                  }}
                  placeholder="Ajouter un élément puis Entrée"
                  aria-label="Nouvel élément"
                />
                <Button size="sm" onClick={addItem} disabled={!newItem.trim()}>
                  Ajouter
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {!readOnly ? (
          <div className="sticky bottom-0 border-t border-border-subtle bg-surface px-4 py-3">
            <Button className="w-full" onClick={save} disabled={!canSave}>
              {isDirty
                ? title.trim()
                  ? 'Enregistrer'
                  : 'Titre required'
                : 'Aucun changement'}
            </Button>
          </div>
        ) : null}
      </div>
    </motion.aside>
  )
}

export default memo(NodePanel)
