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
      includeAssets: ["cashflow.ico", "apple-touch-icon.png"],
      manifestFilename: "manifest.json",
      manifest: {
        name: "CashFlow - Smart Expense Tracker",
        short_name: "CashFlow",
        description: "Premium Offline-first Personal Finance PWA. Track expenses, analytics, and reports seamlessly.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#4f46e5",
        categories: ["finance", "productivity", "business"],
        lang: "en-US",
        dir: "ltr",
        prefer_related_applications: false,
        related_applications: [],
        icons: [
          {
            src: "cashflow.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "apple-touch-icon.png",
            type: "image/png",
            sizes: "180x180 192x192 512x512",
          },
        ],
      },
    }),
  ],
  worker: {
    format: "es",
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});
