import { defineConfig, devices } from "@playwright/test";

const deployedOrigin = process.env["HUGSY_TEST_ORIGIN"];

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: true,
  forbidOnly: true,
  retries: process.env["CI"] ? 1 : 0,
  workers: 4,
  use: {
    baseURL: deployedOrigin ?? "http://127.0.0.1:4173/",
    trace: "retain-on-failure",
    ...(!process.env["CI"] ? { channel: "chrome" } : {}),
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
    },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  ...(!deployedOrigin
    ? {
        webServer: {
          command: "bun scripts/serve.ts",
          url: "http://127.0.0.1:4173/",
          reuseExistingServer: !process.env["CI"],
        },
      }
    : {}),
});
