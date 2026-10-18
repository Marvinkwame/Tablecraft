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
    // *.tz.test.ts run under vitest.tz.config.ts instead. Setting
    // process.env.TZ only takes effect in a forked process — under the default
    // threads pool Node's zone is already resolved and the assignment is
    // silently ignored, which would make those tests pass vacuously.
    exclude: [...configDefaults.exclude, 'demo/**', 'www/**', '**/*.tz.test.ts'],
  },
})
