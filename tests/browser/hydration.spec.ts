import { expect, test } from "@playwright/test";

test("hydration keeps the prerendered demo when its code arrives late", async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.route("**/assets/swipe-deck-*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.addInitScript(() => {
    let removals = 0;
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.removedNodes) {
          if (node instanceof HTMLElement && node.classList.contains("swipe-demo")) {
            removals += 1;
            document.documentElement.dataset["demoRemovals"] = String(removals);
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
  const demoLoaded = page.waitForResponse("**/assets/swipe-deck-*.js");
  await page.goto("components/swipe-deck/");
  await expect(page.getByRole("button", { name: "iPad", exact: true })).toBeEnabled();
  await demoLoaded;
  await page.waitForTimeout(500);
  await expect(page.locator(".swipe-demo")).toHaveCount(1);
  await expect(page.locator(".swipe-demo")).toBeVisible();
  const removals = await page.locator("html").getAttribute("data-demo-removals");
  expect(Number(removals ?? 0)).toBeLessThanOrEqual(1);
});
