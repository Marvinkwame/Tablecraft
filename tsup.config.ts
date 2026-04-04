import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'testing/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', '@tanstack/react-table', 'match-sorter', '@tanstack/react-query', '@testing-library/react'],
})
