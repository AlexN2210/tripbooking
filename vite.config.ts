import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'AppIcons (2)/android/mipmap-xxxhdpi/ic_launcher.png',
        'AppIcons (2)/Assets.xcassets/AppIcon.appiconset/_/180.png',
        'AppIcons (2)/Assets.xcassets/AppIcon.appiconset/_/512.png',
      ],
      manifest: {
        name: 'TravelBudget',
        short_name: 'TravelBudget',
        description:
          "Planifiez et gérez le budget de vos voyages facilement. Estimez les coûts, comparez les destinations et calculez votre épargne mensuelle.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFFBF2',
        theme_color: '#176947',
        icons: [
          {
            src: '/AppIcons%20(2)/android/mipmap-xxxhdpi/ic_launcher.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/AppIcons%20(2)/Assets.xcassets/AppIcon.appiconset/_/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
