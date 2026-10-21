import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // App version surfaced in Settings (US-2) — single source of truth: package.json
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0') },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'apple-touch-icon.png',
        'safari-pinned-tab.svg',
      ],
      manifest: {
        name: 'Vertida',
        short_name: 'Vertida',
        description: 'Vertida · recetas y temporizador de café',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#141414',
        background_color: '#141110',
        icons: [
          { src: 'favicon-16x16.png', sizes: '16x16', type: 'image/png' },
          { src: 'favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.startsWith('/src/data/'), handler: 'CacheFirst' },
        ],
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
  },
});
