// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  server: {
    // Use port 5000 for Replit workflow compatibility
    port: 5000,
    host: '0.0.0.0', // Allow external connections
    // Allow all hosts for Replit development
    allowedHosts: ['.replit.dev', '.replit.app', 'localhost'],
    proxy: {
      '/api': 'http://localhost:5177',
      '/r':   'http://localhost:5177'
    }
  }
});
