import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'

const registry = JSON.parse(readFileSync(resolve(import.meta.dirname, 'src/data/wikipediaSources.json'), 'utf8')) as {
  pages: Array<{ id: string }>
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/filmska-teorija/' : '/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(registry.pages.map((page) => [
          page.id,
          resolve(import.meta.dirname, 'theory', page.id, 'index.html'),
        ])),
      },
    },
  },
})
