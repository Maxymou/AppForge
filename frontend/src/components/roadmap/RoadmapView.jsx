import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useRoadmapStore from '../../stores/roadmapStore'
import TreeNode from './TreeNode'

export default function RoadmapView() {
  const { nodes, loading, error, fetchNodes, addNode, importMarkdown, exportMarkdown } = useRoadmapStore()
  const [newRootTitle, setNewRootTitle] = useState('')
  const [isAddingRoot, setIsAddingRoot] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const rootInputRef = useRef(null)

  useEffect(() => {
    fetchNodes()
  }, [])

  useEffect(() => {
    if (isAddingRoot && rootInputRef.current) {
      rootInputRef.current.focus()
    }
  }, [isAddingRoot])

  const handleAddRoot = async () => {
    if (newRootTitle.trim()) {
      await addNode(newRootTitle.trim(), null)
      setNewRootTitle('')
    }
    setIsAddingRoot(false)
  }

  const handleRootKeyDown = (e) => {
    if (e.key === 'Enter') handleAddRoot()
    if (e.key === 'Escape') {
      setNewRootTitle('')
      setIsAddingRoot(false)
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) return
    setImporting(true)
    await importMarkdown(importText)
    setImporting(false)
    setShowImport(false)
    setImportText('')
  }

  const handleExport = () => {
    exportMarkdown()
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Roadmap</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {nodes.length} {nodes.length === 1 ? 'section' : 'sections'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Import
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingRoot(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Section
          </motion.button>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-3 bg-red-900/40 border border-red-700 text-red-300 px-4 py-2.5 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="w-8 h-8 text-blue-500 spinner" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : nodes.length === 0 && !isAddingRoot ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-slate-400 text-lg font-medium mb-2">No roadmap yet</p>
            <p className="text-slate-500 text-sm mb-6">Create your first section or import a roadmap.md file</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingRoot(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create First Section
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {nodes.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} />
            ))}

            {/* Add root input */}
            <AnimatePresence>
              {isAddingRoot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <input
                    ref={rootInputRef}
                    type="text"
                    value={newRootTitle}
                    onChange={(e) => setNewRootTitle(e.target.value)}
                    onBlur={handleAddRoot}
                    onKeyDown={handleRootKeyDown}
                    placeholder="New section title..."
                    className="w-full bg-slate-700 text-white text-sm px-4 py-2.5 rounded-lg border border-blue-500 focus:outline-none placeholder-slate-500"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Import modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowImport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-1">Import Roadmap</h2>
              <p className="text-slate-400 text-sm mb-4">Paste your roadmap.md content below. This will replace the current roadmap.</p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="# Frontend&#10;- Navbar&#10;- Routing&#10;&#10;# Backend&#10;- API&#10;- Auth"
                rows={10}
                className="w-full bg-slate-700 text-white text-sm px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none font-mono placeholder-slate-500 resize-none"
              />
              <div className="flex gap-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImport}
                  disabled={importing || !importText.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  {importing ? 'Importing...' : 'Import'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowImport(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
