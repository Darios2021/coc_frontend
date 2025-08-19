<template>
  <div class="layout-root">
    <v-app-bar density="comfortable" flat>
      <v-toolbar-title>COC · Centro de Operaciones Capital</v-toolbar-title>
      <v-spacer />
      <v-btn variant="text" @click="goDocs">Docs</v-btn>
      <v-btn color="primary" @click="doLogout">Salir</v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import api from '../lib/api'


const router = useRouter()

function goDocs() {
  router.push({ name: 'docs' })
}

async function doLogout() {
  try { await api.post('/auth/logout') } catch {}
  localStorage.setItem('auth', '0')
  router.push({ name: 'login' })
}
</script>

<style scoped>
.layout-root { min-height: 100vh; }
</style>
