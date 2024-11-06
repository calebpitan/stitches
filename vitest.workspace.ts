import { configDefaults, defineWorkspace } from 'vitest/config'

global.self ||= {} as typeof global.self

const workspace = defineWorkspace([
  {
    extends: './vitest.config.ts'
  },
  {
    test: {
      name: 'io',
      environment: 'jsdom',
      root: './packages/io',
      exclude: [...configDefaults.exclude]
    }
  }
])

export default workspace
