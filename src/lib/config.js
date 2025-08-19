const RAW = (import.meta.env.VITE_API_BASE || '').trim()

// Validamos y normalizamos (sin slash final)
export const API_BASE = RAW ? RAW.replace(/\/+$/, '') : ''

export function apiUrl(path = '') {
  if (!API_BASE) {
    throw new Error('API base no configurada (VITE_API_BASE)')
  }
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
}
