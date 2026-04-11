import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useRoadmapStore from '../../stores/roadmapStore'
import { ConfirmDialog, IconButton, Input } from '../ui/primitives'

const EditIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z" />
  </svg>
)

const AddIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m3 0V5a2 2 0 012-2h4a2 2 0 012 2v2m-9 0h12" />
  </svg>
)

const ChevronIcon = ({ expanded }) => (
  <motion.svg
    animate={{ rotate: expanded ? 90 : 0 }}
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </motion.svg>
)

export default function TreeNode({ node, depth = 0 }) {
  const { addNode, updateNode, deleteNode } = useRoadmapStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(node.title)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [newChildTitle, setNewChildTitle] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const editInputRef = useRef(null)
  const childInputRef = useRef(null)

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (isAddingChild && childInputRef.current) childInputRef.current.focus()
  }, [isAddingChild])

  useEffect(() => {
    setEditValue(node.title)
  }, [node.title])

  const hasChildren = node.children && node.children.length > 0
  const childCount = node.children?.length || 0
  const isSection = depth === 0

  const handleEditSubmit = async () => {
    const trimmed = editValue.trim()
    if (!trimmed) {
      // Revert to previous title rather than silently deleting the node.
      setEditValue(node.title)
      setIsEditing(false)
      return
    }
    if (trimmed !== node.title) {
      await updateNode(node.id, { title: trimmed })
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditValue(node.title)
    setIsEditing(false)
  }

  const handleAddChild = async () => {
    const trimmed = newChildTitle.trim()
    if (trimmed) {
      await addNode(trimmed, node.id)
      if (!node.expanded) await updateNode(node.id, { expanded: true })
    }
    setNewChildTitle('')
    setIsAddingChild(false)
  }

  const handleCancelAddChild = () => {
    setNewChildTitle('')
    setIsAddingChild(false)
  }

  const confirmDetails = hasChildren
    ? [
        `"${node.title}" will be removed.`,
        `${childCount} nested ${childCount === 1 ? 'item' : 'items'} will also be removed.`
      ]
    : [`"${node.title}" will be removed.`]

  return (
    <div className="select-none" style={{ paddingLeft: `${depth * 16}px` }}>
      <div className="tree-node__row group flex items-start gap-2 py-1.5">
        <button
          type="button"
          onClick={() => hasChildren && updateNode(node.id, { expanded: !node.expanded })}
          aria-label={hasChildren ? (node.expanded ? 'Collapse' : 'Expand') : undefined}
          aria-hidden={!hasChildren}
          tabIndex={hasChildren ? 0 : -1}
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-content-muted transition ${
            hasChildren ? 'hover:bg-surface-elevated hover:text-content' : 'invisible'
          }`}
        >
          <ChevronIcon expanded={node.expanded} />
        </button>

        <div
          className={`tree-node__card flex flex-1 items-start gap-2 px-3 py-2 ${
            isSection ? 'tree-node__card--section' : ''
          } ${isEditing ? 'tree-node__card--editing' : ''}`}
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              isSection ? 'bg-indigo-300' : 'bg-slate-500'
            }`}
          />
          {isEditing ? (
            <Input
              ref={editInputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleEditSubmit()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleEditCancel()
                }
              }}
              className="py-1"
              aria-label="Edit title"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => setIsEditing(true)}
              onClick={() => hasChildren && updateNode(node.id, { expanded: !node.expanded })}
              className={`tree-node__title flex-1 text-left text-sm ${
                isSection ? 'tree-node__title--section' : 'text-slate-200'
              }`}
              title="Double-click to edit"
            >
              {node.title}
              {hasChildren ? (
                <span className="ml-2 text-xs font-normal text-content-muted">
                  ({childCount})
                </span>
              ) : null}
            </button>
          )}

          {!isEditing && (
            <div className="tree-node__actions flex shrink-0 items-center gap-1">
              <IconButton
                onClick={() => setIsEditing(true)}
                tooltip="Edit title"
                label="Edit title"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={() => setIsAddingChild(true)}
                tooltip={isSection ? 'Add item' : 'Add sub-item'}
                label={isSection ? 'Add item' : 'Add sub-item'}
              >
                <AddIcon />
              </IconButton>
              <IconButton
                onClick={() => setConfirmOpen(true)}
                tooltip="Delete"
                label="Delete"
                variant="danger"
              >
                <DeleteIcon />
              </IconButton>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAddingChild && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 ml-8"
          >
            <Input
              ref={childInputRef}
              value={newChildTitle}
              onChange={(e) => setNewChildTitle(e.target.value)}
              onBlur={handleAddChild}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddChild()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  handleCancelAddChild()
                }
              }}
              placeholder={`New item inside "${node.title}"...`}
              aria-label={`New item inside ${node.title}`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {node.expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await deleteNode(node.id)
          setConfirmOpen(false)
        }}
        title={isSection ? 'Delete section?' : 'Delete item?'}
        description={
          hasChildren
            ? 'This section has nested items. Deleting it will remove everything inside.'
            : 'This item will be permanently removed from your roadmap.'
        }
        details={confirmDetails}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  )
}
