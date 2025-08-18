<template>
  <v-app>

    <!-- App Bar -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>COC · Centro de Operaciones Capital</v-toolbar-title>
      <v-spacer />

      <v-btn icon @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <v-btn icon @click="toggleDrawer">
        <v-icon>mdi-menu</v-icon>
      </v-btn>

      <v-menu>
        <template #activator="{ props }">
          <v-btn text v-bind="props">
            <v-icon left>mdi-account-circle</v-icon>
            {{ usuario }} ({{ rol }})
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer app v-model="drawer" :permanent="false" temporary>
      <v-list nav dense>
        <v-list-item to="/docs" link>
          <v-list-item-icon><v-icon>mdi-file-document-box</v-icon></v-list-item-icon>
          <v-list-item-title>Documentos</v-list-item-title>
        </v-list-item>
        <v-list-item to="/perfil" link>
          <v-list-item-icon><v-icon>mdi-account</v-icon></v-list-item-icon>
          <v-list-item-title>Perfil</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

// Sidebar toggle
const drawer = ref(false)
const toggleDrawer = () => {
  drawer.value = !drawer.value
}

// Auth & Router
const router = useRouter()
const usuario = ref(localStorage.getItem('nombre_usuario') || 'Invitado')
const rol = ref((localStorage.getItem('rol') || '').toUpperCase())

function logout() {
  localStorage.clear()
  router.push('/login')
}

// Theme (dark/light)
const theme = useTheme()
const isDark = computed(() => theme.global.name.value === 'dark')
function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark'
  theme.global.name.value = next
  localStorage.setItem('theme', next)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) theme.global.name.value = savedTheme
})
</script>
