import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // The app is served from the origin root by default. A host that serves it from
  // a sub-path (for example a GitHub Pages project site) sets VITE_BASE, such as
  // VITE_BASE=/careconnect-swen661-T1/, at build time.
  const env = loadEnv(mode, '.', 'VITE_');
  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
