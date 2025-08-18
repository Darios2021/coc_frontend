<template>
  <v-app :dark="isDark" class="px-6 py-3 rounded" elevation="6" :light="!isDark">
    

    <v-app-bar app :dark="isDark" :light="!isDark" color="primary" elevation="5">
      <v-toolbar-title>COC · Centro de Operaciones Capital</v-toolbar-title>
      <v-spacer />

      <!-- Toggle Dark Mode -->
      <v-tooltip bottom>
        <template #activator="{ props }">
          <v-btn icon v-bind="props" @click="toggleTheme">
            <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>
        </template>
        <span>Modo claro/oscuro</span>
      </v-tooltip>

      <!-- Pantalla completa -->
      <v-tooltip text="Pantalla completa">
        <template #activator="{ props }">
          <v-btn icon v-bind="props" @click="alternarPantallaCompleta">
            <v-icon>mdi-fullscreen</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <!-- Menú usuario -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn text v-bind="props" class="text-no-wrap">
            <v-icon left>mdi-account-circle</v-icon>
            {{ usuario }} ({{ rol }})
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item to="/perfil" link>
            <template #prepend><v-icon>mdi-account</v-icon></template>
            <v-list-item-title>Perfil</v-list-item-title>
          </v-list-item>
          <v-list-item to="/cambiar-contrasenia" link>
            <template #prepend><v-icon>mdi-lock-reset</v-icon></template>
            <v-list-item-title>Cambiar contraseña</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item @click="logout">
            <template #prepend><v-icon>mdi-logout</v-icon></template>
            <v-list-item-title>Cerrar sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-navigation-drawer
      permanent
      app
      :rail="rail"
      @mouseenter="hoverActivo && (rail = false)"
      @mouseleave="hoverActivo && (rail = true)"
    >
      <v-list nav dense>
        <v-list-item :prepend-avatar="avatarUrl" :title="usuario">
          <template #subtitle>
            <span class="caption">{{ rol }}</span>
          </template>
          <template #append>
            <v-btn icon variant="text" @click.stop="toggleRail">
              <v-icon>{{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item link router :to="{ name: 'DocumentosView' }" prepend-icon="mdi-file-document">
          <v-list-item-title>Documentos</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-list-item class="mt-2 justify-center">
        <v-tooltip text="Fijar barra lateral" location="right">
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              v-bind="props"
              @click.stop="hoverActivo = !hoverActivo"
              :color="hoverActivo ? 'primary' : 'grey'"
            >
              <v-icon>
                {{ hoverActivo ? 'mdi-lock-open-outline' : 'mdi-lock-outline' }}
              </v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-list-item>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

// router y estado
const router = useRouter()

// sidebar
const rail = ref(false)
const hoverActivo = ref(false)

// tema
const theme = useTheme()
const isDark = computed(() => theme.global.name.value === 'dark')
function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark'
  theme.global.name.value = next
  localStorage.setItem('theme', next)
}

// usuario y rol
const usuario = ref(localStorage.getItem('nombre_usuario') || 'Invitado')
const rol = ref((localStorage.getItem('rol') || '').toUpperCase())

// avatar random
const avatarUrl = ref('')
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pickRandomAvatar() {
  const idx = randomInt(1, 99)
  avatarUrl.value = `https://randomuser.me/api/portraits/men/${idx}.jpg`
}

// pantalla completa
function alternarPantallaCompleta() {
  const doc = document
  const docEl = document.documentElement

  if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
    docEl.requestFullscreen?.()
    docEl.webkitRequestFullscreen?.()
  } else {
    doc.exitFullscreen?.()
    doc.webkitExitFullscreen?.()
  }
}

// cerrar sesión
async function logout() {
  try {
    console.log('🔒 Cerrando sesión...')
    await fetch(`${import.meta.env.VITE_API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (e) {
    console.warn('⚠️ Logout falló:', e)
  } finally {
    localStorage.clear()
    router.push('/login')
  }
}

// onMounted inicial
onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) theme.global.name.value = saved

  const savedHover = localStorage.getItem('sidebarHover')
  if (savedHover !== null) hoverActivo.value = savedHover === 'true'
  const savedRail = localStorage.getItem('sidebarRail')
  if (savedRail !== null) rail.value = savedRail === 'true'

  pickRandomAvatar()
})
</script>

<style scoped>
.v-navigation-drawer {
  top: 64px;
}
</style>
