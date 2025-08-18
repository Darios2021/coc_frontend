<template>
  <v-app>
    <!-- Barra superior -->
    <v-app-bar app color="primary" dark elevation="4">
      <v-toolbar-title class="text-uppercase font-weight-bold">
        Centro de Operaciones Capital
      </v-toolbar-title>
      <v-spacer />

      <!-- Botón cerrar sesión visible y funcionando -->
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn icon v-bind="props" color="white">
            <v-avatar size="32" color="blue-grey">
              <span class="text-white text-caption">{{ iniciales }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-icon><v-icon>mdi-logout</v-icon></v-list-item-icon>
            <v-list-item-title>Cerrar sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Menú lateral -->
    <v-navigation-drawer app permanent width="260">
      <v-list nav dense>
        <v-list-subheader>Menú principal</v-list-subheader>
        <v-list-item to="/docs" router exact>
          <v-list-item-icon><v-icon>mdi-file-document</v-icon></v-list-item-icon>
          <v-list-item-title>Documentos</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider class="my-2" />
      <v-list-item>
        <v-list-item-subtitle class="text-caption">
          Usuario: {{ nombreUsuario || 'Desconocido' }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-navigation-drawer>

    <!-- Contenido -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const nombreUsuario = ref(localStorage.getItem('nombre_usuario') || '')

const iniciales = computed(() => {
  const partes = nombreUsuario.value.split(' ')
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase()
  return partes[0].charAt(0).toUpperCase() + partes[1]?.charAt(0).toUpperCase()
})

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>