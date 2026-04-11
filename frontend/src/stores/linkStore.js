import { create } from 'zustand'
import client from '../api/client'

const useLinkStore = create((set, get) => ({
  links: [],
  loading: false,
  error: null,

  fetchLinks: async () => {
    set({ loading: true, error: null })
    try {
      const response = await client.get('/links')
      set({ links: response.data, loading: false })
    } catch (err) {
      set({ loading: false, error: err.response?.data?.error || 'Échec du chargement des liens' })
    }
  },

  createLink: async (payload) => {
    try {
      await client.post('/links', payload)
      await get().fetchLinks()
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de création du lien' })
      return false
    }
  },

  updateLink: async (id, payload) => {
    try {
      await client.put(`/links/${id}`, payload)
      await get().fetchLinks()
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de mise à jour du lien' })
      return false
    }
  },

  deleteLink: async (id) => {
    try {
      await client.delete(`/links/${id}`)
      await get().fetchLinks()
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de suppression du lien' })
      return false
    }
  },

  clearError: () => set({ error: null })
}))

export default useLinkStore
