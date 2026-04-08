import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useRoadmapStore from '../../stores/roadmapStore'

export default function TreeNode({ node, depth = 0 }) {
  const { addNode, updateNode, deleteNode } = useRoadmapStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.title)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [newChildTitle, setNewChildTitle] = useState('')
  const editInputRef = useRef(null)
  const childInputRef = useRef(null)

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (isAddingChild && childInputRef.current) {
      childInputRef.current.focus()
    }
  }, [isAddingChild])

  const handleToggleExpand = () => {
    updateNode(node.id, { expanded: !node.expanded })
  }

  const handleEditSubmit = async () => {
    if (editValue.trim() && editValue.trim() !== node.title) {
      await updateNode(node.id, { title: editValue.trim() })
    }
    setIsEditing(false)
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleEditSubmit()
    if (e.key === 'Escape') {
      setEditValue(node.title)
      setIsEditing(false)
    }
  }

  const handleAddChild = async () => {
    if (newChildTitle.trim()) {
      await addNode(newChildTitle.trim(), node.id)
      // Also expand parent
      if (!node.expanded) {
        await updateNode(node.id, { expanded: true })
      }
    }
    setNewChildTitle('')
    setIsAddingChild(false)
  }

  const handleAddChildKeyDown = (e) => {
    if (e.key === 'Enter') handleAddChild()
    if (e.key === 'Escape') {
      setNewChildTitle('')
      setIsAddingChild(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Delete "${node.title}"${node.children?.length ? ' and all its children' : ''}?`)) {
      await deleteNode(node.id)
    }
  }

  const hasChildren = node.children && node.children.length > 0
  const paddingLeft = depth * 20

  return (
    <div className="tree-node select-none" style={{ paddingLeft: `${paddingLeft}px` }}>
      {/* Node row */}
      <div className="group flex items-center gap-1 py-1">
        {/* Expand toggle */}
        <button
          onClick={handleToggleExpand}
          className={`w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 ${!hasChildren ? 'invisible' : ''}`}
        >
          <motion.svg
            animate={{ rotate: node.expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </motion.svg>
        </button>

        {/* Node content */}
        <div className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg ${depth === 0 ? 'bg-slate-700/30' : ''} hover:bg-slate-700/50 transition-colors`}>
          {/* Dot indicator */}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${depth === 0 ? 'bg-blue-500' : 'bg-slate-500'}`} />

          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleEditKeyDown}
              className="flex-1 bg-slate-600 text-white text-sm px-2 py-0.5 rounded border border-blue-500 focus:outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              className={`flex-1 text-sm ${depth === 0 ? 'text-white font-semibold' : 'text-slate-300'} cursor-default`}
            >
              {node.title}
            </span>
          )}

          {/* Action buttons (visible on hover) */}
          {!isEditing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(true)}
                className="text-slate-500 hover:text-blue-400 transition-colors p-0.5"
                title="Edit"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAddingChild(true)}
                className="text-slate-500 hover:text-green-400 transition-colors p-0.5"
                title="Add child"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDelete}
                className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Add child input */}
      <AnimatePresence>
        {isAddingChild && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-8 pr-2 pb-1"
          >
            <input
              ref={childInputRef}
              type="text"
              value={newChildTitle}
              onChange={(e) => setNewChildTitle(e.target.value)}
              onBlur={handleAddChild}
              onKeyDown={handleAddChildKeyDown}
              placeholder="New item title..."
              className="w-full bg-slate-700 text-white text-sm px-3 py-1.5 rounded-lg border border-blue-500 focus:outline-none placeholder-slate-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      <AnimatePresence>
        {node.expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
