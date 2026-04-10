import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useRoadmapStore from '../../stores/roadmapStore'
import { IconButton, Input } from '../ui/primitives'

export default function TreeNode({ node, depth = 0 }) {
  const { addNode, updateNode, deleteNode } = useRoadmapStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.title)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [newChildTitle, setNewChildTitle] = useState('')
  const editInputRef = useRef(null)
  const childInputRef = useRef(null)

  useEffect(() => { if (isEditing && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select() } }, [isEditing])
  useEffect(() => { if (isAddingChild && childInputRef.current) childInputRef.current.focus() }, [isAddingChild])

  const hasChildren = node.children && node.children.length > 0

  const handleEditSubmit = async () => {
    if (editValue.trim() && editValue.trim() !== node.title) await updateNode(node.id, { title: editValue.trim() })
    setIsEditing(false)
  }

  const handleAddChild = async () => {
    if (newChildTitle.trim()) {
      await addNode(newChildTitle.trim(), node.id)
      if (!node.expanded) await updateNode(node.id, { expanded: true })
    }
    setNewChildTitle('')
    setIsAddingChild(false)
  }

  return (
    <div className="select-none" style={{ paddingLeft: `${depth * 16}px` }}>
      <div className="group flex items-center gap-2 py-1.5">
        <button
          onClick={() => hasChildren && updateNode(node.id, { expanded: !node.expanded })}
          className={`flex h-6 w-6 items-center justify-center rounded-md text-content-muted transition ${hasChildren ? 'hover:bg-surface-elevated hover:text-content' : 'invisible'}`}
        >
          <motion.svg animate={{ rotate: node.expanded ? 90 : 0 }} className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></motion.svg>
        </button>

        <div className={`surface-card flex flex-1 items-center gap-2 px-3 py-2 ${depth === 0 ? 'border-indigo-400/30' : ''}`}>
          <span className={`h-2 w-2 rounded-full ${depth === 0 ? 'bg-indigo-300' : 'bg-slate-500'}`} />
          {isEditing ? (
            <Input
              ref={editInputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit()
                if (e.key === 'Escape') { setEditValue(node.title); setIsEditing(false) }
              }}
              className="py-1"
            />
          ) : (
            <button onDoubleClick={() => setIsEditing(true)} className={`flex-1 text-left text-sm ${depth === 0 ? 'font-semibold text-content' : 'text-slate-200'}`}>{node.title}</button>
          )}

          {!isEditing && (
            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <IconButton onClick={() => setIsEditing(true)}><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z" /></svg></IconButton>
              <IconButton onClick={() => setIsAddingChild(true)}><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></IconButton>
              <IconButton onClick={() => window.confirm(`Delete "${node.title}"${node.children?.length ? ' and all its children' : ''}?`) && deleteNode(node.id)}><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7" /></svg></IconButton>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAddingChild && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ml-8 mb-2">
            <Input
              ref={childInputRef}
              value={newChildTitle}
              onChange={(e) => setNewChildTitle(e.target.value)}
              onBlur={handleAddChild}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChild()
                if (e.key === 'Escape') { setNewChildTitle(''); setIsAddingChild(false) }
              }}
              placeholder="New item title..."
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {node.expanded && hasChildren && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
