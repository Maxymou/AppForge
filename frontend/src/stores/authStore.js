import { create } from 'zustand'
import client from '../api/client'

const useAuthStore = create((set) => ({
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
      const message = err.response?.data?.error || 'Login failed'
      set({ loading: false, error: message })
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
