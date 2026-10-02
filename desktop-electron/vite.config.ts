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

// Every production build gets a unique id. The app saves it in care-data.json
// and ignores a care plan saved by a different build, so each new build starts
// from the stock sample care plan (see src/lib/buildInfo.ts).
export default defineConfig(({ command }) => ({
  base: './',
  plugins: [react(), tailwindcss(), devCsp()],
  define: {
    __CARECONNECT_BUILD_ID__: JSON.stringify(command === 'build' ? new Date().toISOString() : 'dev'),
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
}))
