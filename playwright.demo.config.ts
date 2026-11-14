import { defineConfig, devices } from "@playwright/test";

const base = process.env.DEMO_BASE_PATH ?? "/HR-ERP";
const origin = process.env.DEMO_ORIGIN ?? "http://127.0.0.1:3109";
export default defineConfig({
  outputDir: "test-results/demo",
  testDir: "./tests/demo",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: `${origin}${base}/`,
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.DEMO_ORIGIN ? undefined : {
    command: "npm run demo:preview",
    url: `${origin}${base}/`,
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
