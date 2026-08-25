import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Preload the hero portrait.
 *
 * In a client-rendered app the browser cannot discover the LCP image until React
 * has parsed, executed and rendered — measured at ~760ms of pure discovery delay.
 * The build-time snapshot already knows the URL, so the preload hint is injected
 * into index.html and the image starts downloading in parallel with the JavaScript.
 *
 * No snapshot (a fresh clone, or a build while the API is asleep) simply means no
 * hint, and the page behaves exactly as before.
 */
function preloadHeroImage(): Plugin {
  return {
    name: "preload-hero-image",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        let photo: string | undefined;
        try {
          const snapshot = JSON.parse(
            readFileSync(path.resolve(import.meta.dirname, "src/api/fallback.json"), "utf8"),
          ) as { profile?: { photo?: string | null }; settings?: { show_photo?: boolean } };
          if (snapshot.settings?.show_photo !== false) {
            photo = snapshot.profile?.photo ?? undefined;
          }
        } catch {
          return html;
        }
        if (!photo) return html;
        return html.replace(
          "</head>",
          `  <link rel="preload" as="image" href="${photo}" fetchpriority="high" />\n  </head>`,
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), preloadHeroImage()],
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
