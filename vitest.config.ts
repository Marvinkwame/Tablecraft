import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // The demo is a standalone app with its own deps and its own `npm test`.
    // Keep it out of the library's test run (its imports resolve only inside
    // demo/node_modules, which the library CI never installs).
    exclude: [...configDefaults.exclude, 'demo/**'],
  },
})
