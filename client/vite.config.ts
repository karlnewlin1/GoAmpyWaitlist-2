// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Use port 5000 for Replit workflow compatibility
    port: 5000,
    host: '0.0.0.0', // Allow external connections
    proxy: {
      '/api': 'http://localhost:5177',
      '/r':   'http://localhost:5177'
    }
  }
});
