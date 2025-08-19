<template>
  <v-main class="d-flex align-center justify-center coc-login-root">
    <v-card class="login-card" elevation="8">
      <div class="brand">
        <h2>COC</h2>
        <p>Centro de Operaciones Capital</p>
      </div>

      <v-form @submit.prevent="onSubmit" v-model="isValid" class="form">
        <v-text-field
          v-model.trim="email"
          label="Correo institucional"
          type="email"
          autocomplete="username"
          :rules="[v => !!v || 'Requerido']"
          density="comfortable"
          variant="outlined"
        />
        <v-text-field
          v-model="password"
          label="Contraseña"
          type="password"
          autocomplete="current-password"
          :rules="[v => !!v || 'Requerido']"
          density="comfortable"
          variant="outlined"
        />
        <v-text-field
          v-model="totp"
          label="Código 2FA (opcional)"
          type="text"
          density="comfortable"
          variant="outlined"
        />

        <v-alert v-if="error" type="error" density="compact" class="mb-3">
          {{ error }}
        </v-alert>

        <v-btn type="submit" :loading="loading" block color="primary">
          Ingresar
        </v-btn>
      </v-form>
    </v-card>
  </v-main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/lib/api'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const totp = ref('')

const loading = ref(false)
const isValid = ref(true)
const error = ref('')

async function onSubmit() {
  if (!email.value || !password.value) return
  error.value = ''
  loading.value = true
  try {
    await api.post('/auth/login', {
      email: email.value,
      password: password.value,
      totp: totp.value || null,
    })
    // Refresca cookies y marca auth
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    localStorage.setItem('auth', res.ok ? '1' : '0')
    const redirect = route.query.redirect || '/docs'
    router.push(redirect)
  } catch (e) {
    error.value = 'Credenciales inválidas'
    localStorage.setItem('auth', '0')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.coc-login-root {
  min-height: 100vh;
  padding: 24px;
}
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 20px;
}
.brand {
  text-align: center;
  margin-bottom: 16px;
}
.form {
  display: grid;
  gap: 12px;
}
</style>
