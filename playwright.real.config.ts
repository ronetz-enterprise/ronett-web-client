import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests-real",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:4174",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://localhost:4174",
    reuseExistingServer: false,
    env: {
      VITE_API_BASE_URL: "http://localhost:8081",
      VITE_APP_ENV: "test",
      VITE_ENABLE_MOCKS: "false",
    },
    timeout: 120_000,
  },
});
