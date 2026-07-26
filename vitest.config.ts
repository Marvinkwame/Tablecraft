import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // The demo and www (Fumadocs docs site) are standalone apps with their own
    // deps and their own `npm test`/build. Keep them out of the library's test
    // run (their imports resolve only inside their own node_modules, which the
    // library CI never installs).
    exclude: [...configDefaults.exclude, 'demo/**', 'www/**'],
  },
})
