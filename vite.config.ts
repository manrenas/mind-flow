import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/mind-flow/',  
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
