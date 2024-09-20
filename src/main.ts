import 'normalize.css';
import 'primeicons/primeicons.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import Aura from '@primevue/themes/aura'
import PrimeVue from 'primevue/config'
import FocusTrap from 'primevue/focustrap'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import Ripple from 'primevue/ripple'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura
  }
})

app.directive('focustrap', FocusTrap).directive('ripple', Ripple).mount('#app')
