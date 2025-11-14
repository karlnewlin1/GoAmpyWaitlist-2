// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'GoAmpy',
        short_name: 'GoAmpy',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0c10',
        theme_color: '#0b0c10',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
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
      '/r':   'http://localhost:5177',
      '/share': 'http://localhost:5177'
    }
  }
});
