import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vercel serves at domain root (/). GitHub Pages would need '/mind-flow/'.
const base = process.env.GITHUB_PAGES === 'true' ? '/mind-flow/' : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
