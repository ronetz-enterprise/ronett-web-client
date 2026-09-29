import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
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
});
