import { configDefaults, defineWorkspace } from 'vitest/config'

const workspace = defineWorkspace([
  {
    extends: './vitest.config.ts',
  },
  {
    test: {
      name: 'io',
      environment: 'jsdom',
      root: './packages/io',
      exclude: [...configDefaults.exclude],
    },
  },
  {
    test: {
      name: 'common',
      environment: 'node',
      root: './packages/common',
      exclude: [...configDefaults.exclude],
    },
  },
])

export default workspace
