// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Vistas (importación dinámica para lazy load)
const Login    = () => import('../views/LoginView.vue')
const DocsList = () => import('../views/DocsList.vue')
const DocView  = () => import('../views/DocView.vue')
const DocPdf   = () => import('../views/DocPdf.vue')

// Definición de rutas
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },

  {
    path: '/docs',
    name: 'docs',
    component: DocsList,
    meta: { requiresAuth: true }, // 🔒 ruta protegida
  },
  {
    path: '/docs/:id',
    name: 'doc',
    component: DocView,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/docs/:id/pdf',
    name: 'docpdf',
    component: DocPdf,
    props: true,
    meta: { requiresAuth: true },
  },
]

// Creación del router
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// --- Guard global antes de cada navegación ---
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = await checkAuth()

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'docs' }) // si ya está logueado, lo mando directo a docs
  } else {
    next()
  }
})

// --- Función auxiliar para validar sesión ---
async function checkAuth() {
  try {
    // Consulta al backend si la cookie JWT sigue activa
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
      method: 'GET',
      credentials: 'include',
    })
    if (res.ok) return true
    return false
  } catch (err) {
    console.error('Error checkAuth:', err)
    return false
  }
}

export default router
