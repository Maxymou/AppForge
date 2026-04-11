import { create } from 'zustand'
import client from '../api/client'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('appforge_user') || 'null'),
  token: localStorage.getItem('appforge_token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const response = await client.post('/auth/login', { email, password })
      const { token, user } = response.data
      localStorage.setItem('appforge_token', token)
      localStorage.setItem('appforge_user', JSON.stringify(user))
      set({ user, token, loading: false, error: null })
      return true
    } catch (err) {
      const message = err.response?.data?.error || 'Échec de connexion'
      set({ loading: false, error: message })
      return false
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await client.put('/auth/me', data)
      const user = response.data
      localStorage.setItem('appforge_user', JSON.stringify(user))
      set({ user })
      return user
    } catch (err) {
      set({ error: err.response?.data?.error || 'Mise à jour impossible' })
      return null
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      await client.put('/auth/password', { currentPassword, newPassword })
      return true
    } catch (err) {
      set({ error: err.response?.data?.error || 'Erreur mot de passe' })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('appforge_token')
    localStorage.removeItem('appforge_user')
    set({ user: null, token: null, error: null })
  },

  clearError: () => set({ error: null })
}))

export default useAuthStore
