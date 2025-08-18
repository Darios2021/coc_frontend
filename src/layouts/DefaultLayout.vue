<!-- src/layouts/DefaultLayout.vue -->
<template>
  <v-app>
    <!-- Barra superior -->
    <v-app-bar app color="primary" dark elevation="4">
      <v-toolbar-title class="text-uppercase font-weight-bold">
        Centro de Operaciones Capital
      </v-toolbar-title>
      <v-spacer />

      <!-- Botón cerrar sesión -->
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn icon v-bind="props" @click="logout" color="white" variant="text">
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </template>
        <span>Cerrar sesión</span>
      </v-tooltip>
    </v-app-bar>

    <!-- Menú lateral -->
    <v-navigation-drawer app permanent width="260">
      <v-list nav dense>
        <v-list-subheader>Menú principal</v-list-subheader>

        <v-list-item to="/docs" router exact>
          <v-list-item-icon><v-icon>mdi-file-document</v-icon></v-list-item-icon>
          <v-list-item-title>Documentos</v-list-item-title>
        </v-list-item>

        <!-- Agregá más rutas si querés -->
        <!--
        <v-list-item to="/perfil" router>
          <v-list-item-icon><v-icon>mdi-account</v-icon></v-list-item-icon>
          <v-list-item-title>Perfil</v-list-item-title>
        </v-list-item>
        -->
      </v-list>

      <!-- Footer menú -->
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const nombreUsuario = ref(localStorage.getItem('nombre_usuario'))

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>
