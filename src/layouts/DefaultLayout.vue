<template>
  <v-app>
    <!-- APP BAR -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Centro de Operaciones Capital</v-toolbar-title>
      <v-spacer />

      <!-- Botón Cerrar Sesión -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item @click="logout">
            <v-icon left>mdi-logout</v-icon>
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- SIDEBAR -->
    <v-navigation-drawer app v-model="drawer" permanent>
      <v-list dense nav>
        <v-list-item to="/docs" router exact>
          <v-icon left>mdi-file-document</v-icon>
          <v-list-item-title>Documentos</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- CONTENIDO -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const drawer = ref(true)

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>
