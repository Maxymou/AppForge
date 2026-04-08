import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NodePanel({ node, onUpdate, onClose, readOnly }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const itemInputRef = useRef(null)

  useEffect(() => {
    if (node) {
      setTitle(node.data?.title || node.data?.label || '')
      setDescription(node.data?.description || '')
      setNotes(node.data?.notes || '')
      setItems(node.data?.items || [])
      setIsDirty(false)
    }
  }, [node?.id])

  const markDirty = () => setIsDirty(true)

  const handleSave = () => {
    if (onUpdate && node) {
      onUpdate(node.id, { title, description, notes, items })
    }
    setIsDirty(false)
  }

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()])
      setNewItem('')
      markDirty()
    }
  }

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
    markDirty()
  }

  const handleItemKeyDown = (e) => {
    if (e.key === 'Enter') handleAddItem()
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }

  if (!node) return null

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-full overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-sm font-semibold text-white">Node Details</span>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && !readOnly && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={handleSave}
              className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors font-medium"
            >
              Save
            </motion.button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty() }}
            disabled={readOnly}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Node title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); markDirty() }}
            disabled={readOnly}
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed resize-none"
            placeholder="Describe this node..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); markDirty() }}
            disabled={readOnly}
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed resize-none font-mono"
            placeholder="Additional notes..."
          />
        </div>

        {/* Items list */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Items</label>

          <div className="space-y-1.5 mb-2">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-1.5 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-slate-300 truncate">{item}</span>
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!readOnly && (
            <div className="flex gap-2">
              <input
                ref={itemInputRef}
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={handleItemKeyDown}
                placeholder="Add item..."
                className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none placeholder-slate-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddItem}
                disabled={!newItem.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {!readOnly && (
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!isDirty}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {isDirty ? 'Save Changes' : 'No Changes'}
          </motion.button>
          <p className="text-slate-500 text-xs text-center mt-2">Ctrl+S to save quickly</p>
        </div>
      )}
    </motion.div>
  )
}
