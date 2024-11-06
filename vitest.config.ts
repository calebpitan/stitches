import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'root',
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**', 'packages/**'],
      root: fileURLToPath(new URL('./', import.meta.url))
    }
  })
)
