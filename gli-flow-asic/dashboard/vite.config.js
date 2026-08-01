import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const monacoRoot = fileURLToPath(new URL('./node_modules/monaco-editor/esm/vs/', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      'monaco-editor/esm/vs/editor/editor.api.js': `${monacoRoot}editor/editor.api.js`,
      'monaco-editor/esm/vs/editor/editor.worker.js': `${monacoRoot}editor/editor.worker.js`,
    },
  },
  server: {
    proxy: {
      "/runs": "http://127.0.0.1:8000",
      "/live_runs": "http://127.0.0.1:8000",
      "/trends": "http://127.0.0.1:8000",
      "/releases": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/failures": "http://127.0.0.1:8000",
      "/analytics": "http://127.0.0.1:8000",
      "/regressions": "http://127.0.0.1:8000",
      "/knowledge": "http://127.0.0.1:8000",
      "/similar-failures": "http://127.0.0.1:8000",
      "/telemetry": "http://127.0.0.1:8000",
      "/ai": "http://127.0.0.1:8000",
      "/provenance": "http://127.0.0.1:8000",
      "/reliability": "http://127.0.0.1:8000",
    },
  },
})
