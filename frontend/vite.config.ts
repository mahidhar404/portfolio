import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  build: {
    // Route-level chunks keep the initial bundle small; everything below the
    // fold is fetched only when the visitor navigates there.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // Anchored on the trailing separator so this matches react / react-dom /
          // react-router-dom exactly, and never react-markdown.
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router-dom|react-router|scheduler)[\\/]/.test(
              id,
            )
          )
            return "react";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("framer-motion") || id.includes("motion-dom")) return "motion";
          if (id.includes("i18next")) return "i18n";
          // react-markdown is deliberately NOT named here: forcing it into a
          // shared chunk makes Vite modulepreload it, which defeats the lazy
          // boundary in components/ui/Markdown.tsx.
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 250,
  },
  server: {
    port: 5173,
    proxy: {
      // Dev-only: lets the app call /api/... on the same origin, so no CORS
      // config is needed while developing.
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
