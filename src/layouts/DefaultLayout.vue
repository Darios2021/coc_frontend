<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Centro de Operaciones Capital</v-toolbar-title>
      <v-spacer />

      <!-- Botón de usuario con logout -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="32" color="blue-grey">
              <span class="text-white">{{ iniciales }}</span>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="handleLogout">
            <v-list-item-icon><v-icon>mdi-logout</v-icon></v-list-item-icon>
            <v-list-item-title>Cerrar sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Sidebar -->
    <v-navigation-drawer app permanent>
      <v-list dense nav>
        <v-list-subheader>Menú principal</v-list-subheader>
        <v-list-item to="/docs" router exact>
          <v-list-item-icon><v-icon>mdi-file-document</v-icon></v-list-item-icon>
          <v-list-item-title>Documentos</v-list-item-title>
        </v-list-item>
      </v-list>
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
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const nombreUsuario = ref(localStorage.getItem('nombre_usuario') || 'Usuario')

const iniciales = computed(() => {
  const partes = nombreUsuario.value.split(' ')
  return partes.map(p => p[0]?.toUpperCase()).join('').slice(0, 2)
})

function handleLogout() {
  try {
    localStorage.clear()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}
</script>
