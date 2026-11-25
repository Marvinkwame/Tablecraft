import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { installedTablecraftVersion } from './installed-version'

export default defineConfig({
  plugins: [react()],
  // vitest does not load vite.config.ts, so the define has to be repeated here
  // or the badge's global is undefined under test.
  define: {
    __TABLECRAFT_VERSION__: JSON.stringify(installedTablecraftVersion),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
