/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localAi } from './server/vitePlugin'

export default defineConfig({
  base: './',
  plugins: [react(), localAi()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'evals/**/*.test.ts', 'scripts/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
