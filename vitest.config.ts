import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/shared/testing/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.*",
        "src/shared/testing/**",
        "src/shared/ui/**",
        "src/app/entry.*",
      ],
    },
  },
});
