import { create } from 'zustand'
import client from '../api/client'

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  versions: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const response = await client.get('/projects')
      set({ projects: response.data, loading: false })
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec du chargement des projets', loading: false })
    }
  },

  createProject: async (name, description = '', status = 'idee', comment = '') => {
    try {
      const response = await client.post('/projects', { name, description, status, comment })
      await get().fetchProjects()
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de création du projet' })
      return null
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await client.get(`/projects/${id}`)
      set({ currentProject: response.data, loading: false })
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec du chargement du projet', loading: false })
      return null
    }
  },

  updateProject: async (id, data) => {
    try {
      const response = await client.put(`/projects/${id}`, data)
      set({ currentProject: response.data })
      await get().fetchProjects()
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de mise à jour du projet' })
      return null
    }
  },

  deleteProject: async (id) => {
    try {
      await client.delete(`/projects/${id}`)
      await get().fetchProjects()
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de suppression du projet' })
      return false
    }
  },

  saveProject: async (id, nodes, edges) => {
    try {
      await client.post(`/projects/${id}/save`, { nodes, edges })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de sauvegarde du projet' })
      return false
    }
  },

  duplicateProject: async (id) => {
    try {
      const response = await client.post(`/projects/${id}/duplicate`)
      await get().fetchProjects()
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de duplication du projet' })
      return null
    }
  },

  importProject: async (id, markdown) => {
    set({ loading: true, error: null })
    try {
      const response = await client.post(`/projects/${id}/import`, { markdown })
      set({ currentProject: response.data, loading: false })
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || "Échec de l'import du projet", loading: false })
      return null
    }
  },

  exportProject: async (id) => {
    try {
      const response = await client.get(`/projects/${id}/export`, {
        responseType: 'blob'
      })
      const contentDisposition = response.headers['content-disposition']
      let filename = 'project.md'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || "Échec de l'export du projet" })
      return false
    }
  },

  fetchVersions: async (id) => {
    try {
      const response = await client.get(`/projects/${id}/versions`)
      set({ versions: response.data })
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || "Échec du chargement de l'historique" })
      return []
    }
  },

  rollback: async (projectId, versionId) => {
    set({ loading: true, error: null })
    try {
      const response = await client.post(`/projects/${projectId}/versions/${versionId}/rollback`)
      set({ currentProject: response.data, loading: false })
      return response.data
    } catch (err) {
      set({ error: err.response?.data?.error || 'Échec de restauration', loading: false })
      return null
    }
  },

  clearError: () => set({ error: null }),
  setCurrentProject: (project) => set({ currentProject: project })
}))

export default useProjectStore
