import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: true,
  forbidOnly: true,
  retries: process.env["CI"] ? 1 : 0,
  workers: 4,
  use: { baseURL: "http://127.0.0.1:4173/hugsy/", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
    },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "bun scripts/serve.ts",
    url: "http://127.0.0.1:4173/hugsy/",
    reuseExistingServer: !process.env["CI"],
  },
});
