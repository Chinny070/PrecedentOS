import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Root-hosted SPA (Vercel production domain, not a sub-path): a relative
  // base breaks asset resolution on direct navigation to a nested client
  // route (e.g. /precedents/new), since the browser resolves "./assets/x.js"
  // against the current URL path, not the document root.
  base: '/',
});
