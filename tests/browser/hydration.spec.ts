import { expect, test } from "@playwright/test";

test("hydration keeps the prerendered demo instead of replacing it", async ({ page }) => {
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
  await page.goto("components/swipe-deck/");
  await expect(page.getByRole("button", { name: "iPad", exact: true })).toBeEnabled();
  await expect(page.locator(".swipe-demo")).toBeVisible();
  const removals = await page.locator("html").getAttribute("data-demo-removals");
  expect(Number(removals ?? 0)).toBeLessThanOrEqual(1);
});
