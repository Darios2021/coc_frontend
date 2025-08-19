const RAW = (import.meta.env.VITE_API_BASE || '').trim()

// Normaliza (sin barra final)
export const API_BASE = RAW ? RAW.replace(/\/+$/, '') : ''

// Valida esquema http/https (solo en dev para no spamear logs en prod)
if (import.meta.env.DEV && API_BASE && !/^https?:\/\//i.test(API_BASE)) {
  console.warn('[config] VITE_API_BASE no tiene esquema http/https:', API_BASE)
}

export function apiUrl(path = '') {
  if (!API_BASE) {
    throw new Error('API base no configurada (VITE_API_BASE)')
  }
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}

// Helper opcional: construir URL y setear params fácil
export function apiURL(path = '', params = {}) {
  const u = new URL(apiUrl(path))
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') {
      u.searchParams.set(k, String(v))
    }
  }
  return u
}