import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// To iterate against local library source instead of the npm package,
// uncomment the resolve.alias below:
// resolve: { alias: { '@marvinackerman/tablecraft': new URL('../src/index.ts', import.meta.url).pathname } }
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
