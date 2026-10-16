import { defineConfig } from 'vitest/config'

/**
 * Timezone-sensitive tests, run in a forked process.
 *
 * The `.tz.` in a filename is the marker: it means the file sets its own
 * process.env.TZ and must not run under the default threads pool.
 *
 * `process.env.TZ` is only honoured in a forked child: under vitest's default
 * `threads` pool Node has already resolved the zone and the assignment does
 * nothing, so a local-day implementation and a UTC one look identical and the
 * tests pass without proving anything. Each file sets its own zone and asserts
 * `getTimezoneOffset()` first, so a regression here fails loudly.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.tz.test.ts'],
    pool: 'forks',
  },
})
