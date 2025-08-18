<template>
  <v-app>
    <!-- Barra superior -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Centro de Operaciones Capital</v-toolbar-title>
      <v-spacer />

      <!-- Botón de logout dentro de un menú desplegable -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="logout" link>
            <v-list-item-icon><v-icon>mdi-logout</v-icon></v-list-item-icon>
            <v-list-item-title>Cerrar sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Menú lateral -->
    <v-navigation-drawer app permanent>
      <v-list dense nav>
        <v-list-item to="/docs" router exact>
          <v-list-item-icon><v-icon>mdi-file-document</v-icon></v-list-item-icon>
          <v-list-item-title>Documentos</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Contenido principal -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  console.log('Cerrando sesión...')
  localStorage.clear()
  sessionStorage.clear() // por si acaso

  // resetear flags de auth del router
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

</script>
