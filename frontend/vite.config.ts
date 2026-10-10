import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // <-- Este plugin habilita HTTPS automáticamente
  ],
  server: {
    host: true, // Expone el servidor a la red local (0.0.0.0)
  }
});