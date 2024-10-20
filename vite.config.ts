import { URL, fileURLToPath } from 'node:url'

import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await'
import vueDevTools from 'vite-plugin-vue-devtools'
import wasm from 'vite-plugin-wasm'
import svgLoader from 'vite-svg-loader'

import svgoConfig from './svgo.config.mjs'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString()
          }
        }
      }
    }
  },
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    wasm(),
    topLevelAwait(),
    Components({ resolvers: [PrimeVueResolver()] }),
    svgLoader({ defaultImport: 'component', svgoConfig: svgoConfig as any })
  ],
  worker: {
    plugins() {
      return [wasm(), topLevelAwait()]
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
