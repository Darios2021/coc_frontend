import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,             // MUY IMPORTANTE para cookies HttpOnly
  timeout: 30000,
})

// --- Refresh automático en 401 ---
let isRefreshing = false
let queue = []

function resolveQueue(error, tokenRefreshed) {
  queue.forEach(p => (tokenRefreshed ? p.resolve() : p.reject(error)))
  queue = []
}

api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config
    if (!error.response) throw error

    // Si es 401 y no intentamos refresh aún...
    if (error.response.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Esperá a que termine el refresh en curso
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then(() => api(original))
      }

      original._retry = true
      isRefreshing = true
      try {
        await api.post('/auth/refresh')   // backend rota refresh y setea nuevas cookies
        resolveQueue(null, true)
        return api(original)              // reintenta la solicitud original
      } catch (e) {
        resolveQueue(e, false)
        // opcional: redirigir a login
        window.location.href = '/login'
        throw e
      } finally {
        isRefreshing = false
      }
    }

    throw error
  }
)

export default api