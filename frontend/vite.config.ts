// @ts-nocheck
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load backend/.env so dev can pick up PORT / FRONTEND_PORT without extra tooling.
function loadBackendEnv() {
  const envPath = path.resolve(__dirname, '..', 'backend', '.env')
  if (!fs.existsSync(envPath)) return
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [rawKey, ...rest] = trimmed.split('=')
    const key = rawKey.trim()
    if (process.env[key] !== undefined) continue
    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}
loadBackendEnv()

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 5001
const BACKEND_PORT = Number(process.env.PORT) || 4000

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@logo': path.resolve(__dirname, 'src/logo'),
    },
  },
  plugins: [react()],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    port: FRONTEND_PORT,
    strictPort: true,
    hmr: true,
    proxy: {
      '/api': `http://localhost:${BACKEND_PORT}`,
    },
  },
}))
