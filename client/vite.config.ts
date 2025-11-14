// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Pick a stable dev port so Vite stops bouncing (5173 often busy on Replit)
    port: 5176,
    proxy: {
      '/api': 'http://localhost:5177',
      '/r':   'http://localhost:5177'
    }
  }
});
