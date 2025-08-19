// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Lazy views
const Login    = () => import('../views/LoginView.vue')
const DocsList = () => import('../views/DocsList.vue')
const DocView  = () => import('../views/DocView.vue')
const DocPdf   = () => import('../views/DocPdf.vue')

// Layout (¡sin <v-app> adentro!)
import DefaultLayout from '../layouts/DefaultLayout.vue'

const routes = [
  { path: '/', redirect: '/docs' },

  { path: '/login', name: 'login', component: Login, meta: { public: true } },

  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'docs', name: 'docs', component: DocsList },
      { path: 'docs/:id', name: 'doc', component: DocView, props: true },
      { path: 'docs/:id/pdf', name: 'docpdf', component: DocPdf, props: true },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ===== Auth bootstrap (run-once) =====
let bootstrapped = false
async function ensureAuthOnce() {
  if (bootstrapped) return localStorage.getItem('auth') === '1'
  bootstrapped = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    const ok = res.ok
    localStorage.setItem('auth', ok ? '1' : '0')
    return ok
  } catch {
    localStorage.setItem('auth', '0')
    return false
  }
}

// ===== Global guard =====
router.beforeEach(async (to) => {
  // Solo chequeamos auth si hace falta
  if (to.meta?.requiresAuth || to.name === 'login') {
    const isAuthenticated = await ensureAuthOnce()

    // Si pide auth y no está logeado → al login
    if (to.meta?.requiresAuth && !isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // Si va al login pero ya está logeado → a docs
    if (to.name === 'login' && isAuthenticated) {
      return { name: 'docs' }
    }
  }

  return true
})

export default router
