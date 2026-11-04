import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/native-browser",
  outputDir: "test-results/native-preview",
  fullyParallel: false,
  forbidOnly: true,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:3000/",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1200 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
});
