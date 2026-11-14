import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  outputDir: "test-results/navigation",
  testDir: "./tests/e2e",
  testMatch: "navigation-redesign.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3107",
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3107",
    url: "http://127.0.0.1:3107/qa-lab",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
