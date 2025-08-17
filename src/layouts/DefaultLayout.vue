<!-- src/layouts/DefaultLayout.vue -->
<template>
  <v-app>
    <v-app-bar flat>
      <v-app-bar-title>COC · Biblioteca</v-app-bar-title>
      <v-spacer />
      <v-btn to="/docs" variant="text">Documentos</v-btn>
      <v-btn @click="logout" variant="outlined" color="error">Cerrar sesión</v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="py-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

async function logout() {
  await fetch(`${import.meta.env.VITE_API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  })
  router.push('/login')
}
</script>