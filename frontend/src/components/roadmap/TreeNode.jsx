import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useRoadmapStore from '../../stores/roadmapStore'
import { ConfirmDialog, IconButton, Input, Modal, Textarea, Button } from '../ui/primitives'

export default function TreeNode({ node, depth = 0 }) {
  const { addNode, updateNode, deleteNode } = useRoadmapStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.title)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [newChildTitle, setNewChildTitle] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [comment, setComment] = useState(node.comment || '')
  const [code, setCode] = useState(node.code || '')
  const editInputRef = useRef(null)
  const childInputRef = useRef(null)

  useEffect(() => { if (isEditing && editInputRef.current) editInputRef.current.focus() }, [isEditing])
  useEffect(() => { if (isAddingChild && childInputRef.current) childInputRef.current.focus() }, [isAddingChild])
  useEffect(() => setEditValue(node.title), [node.title])
  useEffect(() => { setComment(node.comment || ''); setCode(node.code || '') }, [node])

  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="select-none" style={{ paddingLeft: `${depth * 16}px` }}>
      <div className="tree-node__row group flex items-start gap-2 py-1.5">
        <button type="button" onClick={() => hasChildren && updateNode(node.id, { expanded: !node.expanded })} className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-content-muted transition ${hasChildren ? 'hover:bg-surface-elevated hover:text-content' : 'invisible'}`}>
          <motion.svg animate={{ rotate: node.expanded ? 90 : 0 }} className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></motion.svg>
        </button>
        <div className="tree-node__card flex flex-1 items-start gap-2 px-3 py-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300" />
          {isEditing ? <Input ref={editInputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={async()=>{if(editValue.trim()) await updateNode(node.id,{title:editValue.trim()}); setIsEditing(false)}} className="py-1" /> : (
            <button type="button" onDoubleClick={() => setIsEditing(true)} onClick={() => setShowEditor(true)} className="tree-node__title flex-1 text-left text-sm text-slate-200">{node.title}</button>
          )}
          {!isEditing && <div className="tree-node__actions flex shrink-0 items-center gap-1">
            <IconButton onClick={() => setShowEditor(true)} tooltip="Éditer" label="Éditer">✎</IconButton>
            <IconButton onClick={() => setIsAddingChild(true)} tooltip="Ajouter" label="Ajouter">+</IconButton>
            <IconButton onClick={() => setConfirmOpen(true)} tooltip="Supprimer" label="Supprimer" variant="danger">×</IconButton>
          </div>}
        </div>
      </div>

      <AnimatePresence>{isAddingChild && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2 ml-8"><Input ref={childInputRef} value={newChildTitle} onChange={(e) => setNewChildTitle(e.target.value)} onBlur={async()=>{if(newChildTitle.trim()) await addNode(newChildTitle.trim(), node.id); setNewChildTitle(''); setIsAddingChild(false)}} placeholder={`Nouvel élément dans « ${node.title} »...`} /></motion.div>}</AnimatePresence>

      <AnimatePresence>{node.expanded && hasChildren && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>{node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} />)}</motion.div>}</AnimatePresence>

      <Modal open={showEditor} onClose={() => setShowEditor(false)} title="Éditer l'élément roadmap" footer={[<Button key="save" onClick={async()=>{await updateNode(node.id,{title:editValue.trim()||node.title, comment, code}); setShowEditor(false)}}>Enregistrer</Button>]}> 
        <div className="space-y-3">
          <Input value={editValue} onChange={(e)=>setEditValue(e.target.value)} placeholder="Titre" />
          <Textarea value={comment} onChange={(e)=>setComment(e.target.value)} rows={3} placeholder="Commentaire" />
          <Textarea value={code} onChange={(e)=>setCode(e.target.value)} rows={6} className="font-mono" placeholder="Code" />
        </div>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={async () => { await deleteNode(node.id); setConfirmOpen(false) }} title="Supprimer cet élément ?" description="Cette action est définitive." confirmLabel="Supprimer" tone="danger" />
    </div>
  )
}
