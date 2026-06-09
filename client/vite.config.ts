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
      manifest: {
        name: "CashFlow Expense Tracker",
        short_name: "CashFlow",
        description: "Premium Expense Tracking Application",
        theme_color: "#1e293b",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "cashflow.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "apple-touch-icon.png",
            type: "image/png",
            sizes: "180x180",
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});
