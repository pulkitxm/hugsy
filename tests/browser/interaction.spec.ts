import { readFileSync } from "node:fs";
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("expanding cards stay inside their stage and scale the title while opening", async ({
  page,
}) => {
  await page.goto("components/expanding-cards/");
  await page.locator(".cards-stage").scrollIntoViewIfNeeded();
  const samples = page.evaluate(
    () =>
      new Promise<{ overflow: number; sizes: number[] }>((resolve) => {
        const start = performance.now();
        const sizes: number[] = [];
        let overflow = 0;
        const sample = () => {
          const stage = document.querySelector(".cards-stage")?.getBoundingClientRect();
          const card = document.querySelector(".expanded-card");
          const title = card?.querySelector("strong");
          if (stage && card && title) {
            const box = card.getBoundingClientRect();
            overflow = Math.max(overflow, stage.top - box.top, box.bottom - stage.bottom);
            sizes.push(Number.parseFloat(getComputedStyle(title).fontSize));
          }
          if (performance.now() - start < 800) {
            requestAnimationFrame(sample);
          } else {
            resolve({ overflow, sizes });
          }
        };
        sample();
      }),
  );
  await page.getByRole("button", { name: "Open Blue harbor" }).click();
  const { overflow, sizes } = await samples;
  expect(overflow).toBeLessThanOrEqual(3);
  expect(new Set(sizes.map(Math.round)).size).toBeGreaterThan(3);
});

test("device screens clip content to their rounded corners", async ({ page }) => {
  await page.goto("components/radial-menu/");
  const screen = page.locator(".device-screen");
  await expect(screen).toHaveCSS("overflow", "hidden");
  const clip = await screen.evaluate((element) => getComputedStyle(element).clipPath);
  expect(clip).toContain("round");
  await expect(page.locator(".device-glare")).toHaveCount(0);
});

test("buttons never scale or move on hover or press", () => {
  for (const file of ["src/theme.css", "src/styles/demos.css", "src/styles/device.css"]) {
    const rules = readFileSync(file, "utf8").match(/[^{}]*:(?:hover|active)[^{}]*\{[^}]*\}/g) ?? [];
    for (const rule of rules) {
      expect(rule).not.toMatch(/\b(?:scale|translate|transform|rotate)\s*:/);
    }
  }
});
