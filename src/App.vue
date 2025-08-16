<template>
  <v-app>
    <v-app-bar flat>
      <v-app-bar-title>COC · Biblioteca</v-app-bar-title>
      <v-spacer />
      <v-btn to="/docs" variant="text">Documentos</v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="py-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
// vacío por ahora
</script>
