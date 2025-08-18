import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy views
const Login    = () => import('../views/LoginView.vue')
const DocsList = () => import('../views/DocsList.vue')
const DocView  = () => import('../views/DocView.vue')
const DocPdf   = () => import('../views/DocPdf.vue')

// Layout
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

// Guard global
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.ensureAuth()

  if (to.meta?.requiresAuth && !auth.isAuth) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuth) {
    return { name: 'docs' }
  }
})

export default router