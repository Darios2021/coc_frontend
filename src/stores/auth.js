import { defineStore } from 'pinia'
import api from '@/lib/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuth: false,
    loading: false,
    error: null,
  }),
  actions: {
    async login({ email, password, totp = null, remember = false }) {
      this.loading = true
      this.error = null
      try {
        await api.post('/auth/login', { email, password, totp, remember })
        this.isAuth = true
        return true
      } catch (e) {
        this.isAuth = false
        this.error = e?.response?.data?.message || 'Error de autenticación'
        return false
      } finally {
        this.loading = false
      }
    },
    async logout() {
  try {
    await api.post('/auth/logout')
    console.log('✅ Logout backend exitoso')
  } catch (err) {
    console.warn('⚠️ Error durante logout:', err)
  }
  this.isAuth = false
},
    async ensureAuth() {
      try {
        await api.post('/auth/refresh')
        this.isAuth = true
      } catch {
        this.isAuth = false
      }
    }
  }
})
