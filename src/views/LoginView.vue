<template>
  <div class="coc-login-root">
    <div class="bg-illustration" aria-hidden="true"></div>

    <v-card class="login-card" elevation="10">
      <div class="brand">
        <img v-if="logoSrc" :src="logoSrc" alt="Logo COC" class="logo" />
        <div class="brand-text">
          <h1>COC</h1>
          <p>Centro de Operaciones Capital</p>
        </div>
      </div>

      <v-form ref="formRef" v-model="isValid" @submit.prevent="onSubmit" class="form">
        <v-text-field
          v-model.trim="email"
          :rules="emailRules"
          label="Correo institucional"
          autocomplete="username"
          prepend-inner-icon="mdi-email"
          variant="solo-filled"
          density="comfortable"
          class="mb-3"
          required
        />

        <v-text-field
          v-model="password"
          :type="showPass ? 'text' : 'password'"
          :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPass = !showPass"
          :rules="passwordRules"
          label="Contraseña"
          autocomplete="current-password"
          prepend-inner-icon="mdi-lock"
          variant="solo-filled"
          density="comfortable"
          class="mb-3"
          required
        />

        <v-expand-transition>
          <div v-if="needsTOTP" class="mb-3">
            <v-text-field
              v-model.trim="totp"
              label="Código 2FA"
              prepend-inner-icon="mdi-shield-key"
              maxlength="6"
              counter
              variant="solo-filled"
              density="comfortable"
              :rules="[v => !!v || 'Ingresá el código de 6 dígitos']"
              autocomplete="one-time-code"
              inputmode="numeric"
              pattern="\\d*"
              required
            />
          </div>
        </v-expand-transition>

        <!-- Placeholder para hCaptcha/reCAPTCHA si se activa en el backend -->
        <div v-if="captchaSiteKey" class="captcha-placeholder" aria-hidden="true">
          <small>CAPTCHA protegido</small>
        </div>

        <v-btn
          :loading="loading"
          block
          size="large"
          color="primary"
          type="submit"
          class="mb-2"
        >
          Ingresar
        </v-btn>

        <div class="extras">
          <v-checkbox v-model="remember" label="Recordarme en este equipo" density="compact" hide-details />
          <v-spacer />
          <v-btn variant="text" size="small" @click="onForgot">¿Olvidaste tu contraseña?</v-btn>
        </div>

        <v-alert v-if="errorMsg" type="error" density="compact" class="mt-3" border="start" prominent>
          {{ errorMsg }}
        </v-alert>
      </v-form>

      <footer class="foot">
        <small>© {{ year }} COC — Centro de Operaciones Capital</small>
      </footer>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'


const router = useRouter()

// CONFIG (podés pasar esto por props o env)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
const logoSrc = import.meta.env.VITE_COC_LOGO || '' // ruta al logo
const captchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITEKEY || ''

// State
const email = ref('')
const password = ref('')
const totp = ref('')
const remember = ref(false)
const showPass = ref(false)
const loading = ref(false)
const needsTOTP = ref(false)
const errorMsg = ref('')
const isValid = ref(false)
const formRef = ref(null)

const year = new Date().getFullYear()

// Validaciones
const emailRules = [
  v => !!v || 'Ingresá tu correo',
  v => /.+@.+\..+/.test(v) || 'Correo inválido',
]
const passwordRules = [
  v => !!v || 'Ingresá tu contraseña',
  v => v.length >= 10 || 'Mínimo 10 caracteres',
]

async function onSubmit () {
  errorMsg.value = ''
  const ok = await formRef.value?.validate()
  if (!ok?.valid) return

  loading.value = true
  try {
    console.log('🚀 Enviando solicitud de login...')

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      credentials: 'include', // para cookies HttpOnly
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        totp: needsTOTP.value ? totp.value : undefined,
        remember: remember.value,
        captchaToken: '' // integrar si activás hCaptcha/reCAPTCHA
      }),
    })

    console.log('📩 Respuesta recibida con status:', res.status)

    if (res.status === 401) {
      const data = await res.json().catch(() => ({}))
      console.log('❌ Login 401:', data)
      if (data?.reason === 'TOTP_REQUIRED') {
        needsTOTP.value = true
        errorMsg.value = 'Ingresá el código 2FA de tu app (Google Authenticator, etc.)'
        return
      }
      throw new Error(data?.message || 'Credenciales inválidas')
    }

    if (!res.ok) {
      const txt = await res.text()
      console.log('⚠️ Error inesperado:', txt)
      throw new Error(txt || 'Error de autenticación')
    }

    // 🟢 Login exitoso
    console.log('✅ Login exitoso')

    const current = router.currentRoute?.value
    const redirectTo = current?.query?.redirect || '/docs'
    console.log('🔁 Redireccionando a:', redirectTo)

    // Redirigir forzando recarga completa para evitar inconsistencias si hay layouts o cache
    window.location.href = redirectTo

  } catch (e) {
    console.error('🔥 Error en login:', e)
    errorMsg.value = e.message || 'Falla de autenticación'
  } finally {
    loading.value = false
  }
}


function onForgot () {
  router.push({ name: 'forgot-password' })
}
</script>

<style scoped>
:root {
  --coc-primary: #4b0983;
  --coc-secondary: #8943ee;
  --coc-bg: #0f0f12;
  --coc-surface: #15151a;
  --coc-border: #2a2a33;
  --coc-text: #f5f5f7;
}

.coc-login-root {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(1200px 800px at 20% 10%, rgba(137,67,238,0.12), transparent 60%),
              radial-gradient(1000px 800px at 80% 90%, rgba(75,9,131,0.18), transparent 60%),
              var(--coc-bg);
  padding: 24px;
}

.bg-illustration {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, rgba(75,9,131,0.35), rgba(137,67,238,0.25));
  filter: blur(80px) saturate(120%);
  opacity: 0.4;
  pointer-events: none;
}

.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)) , var(--coc-surface);
  border: 1px solid var(--coc-border);
  color: var(--coc-text);
  backdrop-filter: blur(8px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 8px 24px;
}
.logo {
  height: 44px;
  width: auto;
}
.brand-text h1 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0.5px;
}
.brand-text p {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
}

.form { padding: 8px 24px 16px 24px; }

.v-field--variant-solo, .v-field--variant-solo-filled {
  --v-theme-primary: var(--coc-secondary);
}

.v-btn {
  --v-theme-primary: var(--coc-secondary);
  background: linear-gradient(90deg, var(--coc-primary), var(--coc-secondary));
}

.extras {
  display: flex;
  align-items: center;
  gap: 8px;
}

.captcha-placeholder {
  border: 1px dashed var(--coc-border);
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 12px;
  text-align: center;
  opacity: 0.7;
}

.foot {
  padding: 8px 16px 16px 16px;
  text-align: center;
  opacity: 0.8;
}
</style>