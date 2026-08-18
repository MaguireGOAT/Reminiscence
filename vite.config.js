import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/Reminiscence/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-512.png",
        "icons/apple-touch-icon.png"
      ],
      manifest: {
        name: "憶當年",
        short_name: "憶當年",
        description: "院舍小組回憶活動工具",
        lang: "zh-Hant-HK",
        start_url: "/Reminiscence/",
        scope: "/Reminiscence/",
        display: "standalone",
        orientation: "any",
        background_color: "#FBFAF7",
        theme_color: "#1C2733",
        icons: [
          {
            src: "/Reminiscence/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/Reminiscence/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/Reminiscence/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,webmanifest,ico,png,svg}"],
        globIgnores: ["media/**", "media/**/*"],
        navigateFallback: "/Reminiscence/index.html",
        runtimeCaching: [
          {
            urlPattern: /\/media\//,
            handler: "NetworkFirst",
            options: {
              networkTimeoutSeconds: 3,
              cacheName: "reminiscence-media",
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
