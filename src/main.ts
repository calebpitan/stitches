import { createApp } from 'vue'

import Aura from '@primevue/themes/aura'
import CronCorePlugin from '@vue-js-cron/core'

import 'normalize.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config'
import FocusTrap from 'primevue/focustrap'
import Ripple from 'primevue/ripple'
import Tooltip from 'primevue/tooltip'
import 'reflect-metadata'

import App from './App.vue'
import './assets/main.css'
import router from './router'

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
app.use(CronCorePlugin)

app
  .directive('focustrap', FocusTrap)
  .directive('ripple', Ripple)
  .directive('tooltip', Tooltip)
  .mount('#app')
