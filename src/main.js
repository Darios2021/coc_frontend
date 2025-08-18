import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { useAuthStore } from '@/stores/auth'

const vuetify = createVuetify({ components, directives })

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)

const pinia = createPinia()
app.use(pinia)

const auth = useAuthStore(pinia)
auth.ensureAuth().then(() => {
  app.mount('#app')
})
