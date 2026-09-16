import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // host: true expõe o dev server na rede (necessário dentro do Docker)
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
