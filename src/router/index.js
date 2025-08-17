// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Lazy views
const Login    = () => import('../views/LoginView.vue')
const DocsList = () => import('../views/DocsList.vue')
const DocView  = () => import('../views/DocView.vue')
const DocPdf   = () => import('../views/DocPdf.vue')

const routes = [
  { path: '/', redirect: '/docs' },
  { path: '/login', name: 'login', component: Login, meta: { public: true } },
  { path: '/docs', name: 'docs', component: DocsList, meta: { requiresAuth: true } },
  { path: '/docs/:id', name: 'doc', component: DocView, props: true, meta: { requiresAuth: true } },
  { path: '/docs/:id/pdf', name: 'docpdf', component: DocPdf, props: true, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ===== Auth bootstrap =====
let bootstrapped = false
let isAuthenticated = false

async function ensureAuthOnce() {
  if (bootstrapped) return isAuthenticated
  bootstrapped = true
  try {
    // Debe ser POST y con credenciales (cookies HttpOnly)
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })
    isAuthenticated = res.ok
  } catch {
    isAuthenticated = false
  }
  return isAuthenticated
}

// Guard global
router.beforeEach(async (to) => {
  await ensureAuthOnce()

  if (to.meta?.requiresAuth && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && isAuthenticated) {
    return { name: 'docs' }
  }
})

export default router