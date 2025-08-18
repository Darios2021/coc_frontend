<template>
  <v-app>
    <!-- Barra superior -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Centro de Operaciones Capital</v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="logout" title="Cerrar sesión">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Menú lateral -->
    <v-navigation-drawer app permanent>
      <v-list dense nav>
        <v-list-item to="/docs" router exact>
          <v-icon left>mdi-file-document</v-icon>
          <v-list-item-title>Documentos</v-list-item-title>
        </v-list-item>
        <!-- Agregá más ítems si querés -->
      </v-list>
      <v-list-item to="/perfil" router>
      <v-icon left>mdi-account</v-icon>
      <v-list-item-title>Perfil</v-list-item-title>
      </v-list-item>

      <v-list-item to="/reportes" router>
      <v-icon left>mdi-chart-box</v-icon>
      <v-list-item-title>Reportes</v-list-item-title>
      </v-list-item>
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
  localStorage.clear()
  router.push('/login')
}
</script>
