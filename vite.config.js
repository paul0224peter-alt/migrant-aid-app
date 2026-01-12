import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '移工母語急救指引',
        short_name: '母語急救',
        description: '即時母語急救指引與 CPR 節奏器',
        theme_color: '#ff4444',
        icons: [
          {
            src: 'pwa-192x192.png', // 剛才複製的那張
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // 原始的那張
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})