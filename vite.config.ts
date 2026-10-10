import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), reactRouter()],
  // Discover dependencies of lazy route modules before the first browser request.
  optimizeDeps: {
    entries: [
      "src/app/entry.client.tsx",
      "src/app/root.tsx",
      "src/app/layouts/*-layout.tsx",
      "src/pages/**/*-page.tsx",
    ],
  },
  resolve: {
    tsconfigPaths: true,
  },
  // Same-origin proxy so the backend's SameSite XSRF/session cookies are first-party.
  server: {
    proxy: {
      "/api": {
        target:
          loadEnv(mode, process.cwd(), "").VITE_API_PROXY_TARGET ??
          "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
}));
