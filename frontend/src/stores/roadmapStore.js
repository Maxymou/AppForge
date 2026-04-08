import { create } from 'zustand'
import client from '../api/client'

const useRoadmapStore = create((set, get) => ({
  nodes: [],
  loading: false,
  error: null,

  fetchNodes: async () => {
    set({ loading: true, error: null })
    try {
      const response = await client.get('/roadmap')
      set({ nodes: response.data, loading: false })
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch roadmap', loading: false })
    }
  },

  addNode: async (title, parentId = null) => {
    try {
      const response = await client.post('/roadmap/nodes', { title, parentId })
      // Refresh tree
      await get().fetchNodes()
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to add node' })
      return null
    }
  },

  updateNode: async (id, data) => {
    try {
      const response = await client.put(`/roadmap/nodes/${id}`, data)
      // Refresh tree
      await get().fetchNodes()
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to update node' })
      return null
    }
  },

  deleteNode: async (id) => {
    try {
      await client.delete(`/roadmap/nodes/${id}`)
      // Refresh tree
      await get().fetchNodes()
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to delete node' })
      return false
    }
  },

  importMarkdown: async (markdown) => {
    set({ loading: true, error: null })
    try {
      const response = await client.post('/roadmap/import', { markdown })
      set({ nodes: response.data, loading: false })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to import', loading: false })
      return false
    }
  },

  exportMarkdown: async () => {
    try {
      const response = await client.get('/roadmap/export', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'roadmap.md')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to export' })
      return false
    }
  },

  clearError: () => set({ error: null })
}))

export default useRoadmapStore
