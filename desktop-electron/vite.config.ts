import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The production Content-Security-Policy in index.html forbids inline scripts.
// Vite's dev server injects an inline React Refresh preamble, so only while
// serving (npm run dev) the policy is relaxed for scripts. Production builds
// keep the strict policy.
function devCsp(): Plugin {
  return {
    name: 'careconnect-dev-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), devCsp()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
})
