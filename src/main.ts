import 'reflect-metadata'

import { createApp } from 'vue'

import { PiniaColada, PiniaColadaQueryHooksPlugin } from '@pinia/colada'
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

// import { createMetaManager, defaultConfig } from 'vue-meta'
import App from './App.vue'
import './assets/main.css'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(PiniaColada, {
  plugins: [
    PiniaColadaQueryHooksPlugin({
      onError(err) {
        throw err
      },
    }),
  ],
})
app.use(router)
// app.use(createMetaManager(defaultConfig, (...args: any) => console.log(args)))
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
  },
})
app.use(CronCorePlugin)

app
  .directive('focustrap', FocusTrap)
  .directive('ripple', Ripple)
  .directive('tooltip', Tooltip)
  .mount('#app')
