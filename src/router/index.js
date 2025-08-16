import { createRouter, createWebHistory } from 'vue-router'

const DocsList = () => import('../views/DocsList.vue')
const DocView  = () => import('../views/DocView.vue')
const DocPdf   = () => import('../views/DocPdf.vue')   // <— nuevo

const routes = [
  { path: '/', redirect: '/docs' },
  { path: '/docs', name: 'docs', component: DocsList },
  { path: '/docs/:id', name: 'doc', component: DocView, props: true },
  { path: '/docs/:id/pdf', name: 'docpdf', component: DocPdf, props: true }, // <— nuevo
]

export default createRouter({ history: createWebHistory(), routes })
