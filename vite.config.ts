import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "logo.svg",
        "logo.png",
        "robots.txt",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "LaserForge",
        short_name: "LaserForge",
        description: "Open Source Offline Laser Control Software",
        theme_color: "#1a2327",
        background_color: "#1a2327",
        display: "standalone",
        orientation: "landscape",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
});
