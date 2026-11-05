import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (...options) => {
      const response = await goto(...options);
      await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
      if ((await page.locator(".device-preview").count()) > 0) {
        await page.locator("html[data-demo-ready]").waitFor({ state: "attached" });
      }
      return response;
    };
    await use(page);
  },
});
