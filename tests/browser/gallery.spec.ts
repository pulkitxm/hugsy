import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { showcase } from "../../registry/catalog";

const pages = [
  "",
  "components/",
  "docs/",
  "docs/installation/",
  "docs/cli/",
  "docs/mcp/",
  "docs/accessibility/",
  ...showcase.map((item) => `components/${item.name}/`),
];

test("every route is prerendered, directly accessible, and free of overflow or browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push(`Failed request: ${request.url()}`));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(`${response.status()}: ${response.url()}`);
    }
  });
  for (const path of pages) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".header-inner")).toHaveCSS("display", "flex");
    expect(await response?.text()).toContain("<h1");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://hugsy.pulkit.page/${path}`,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(errors).toEqual([]);
});

test("landing page shows a live device and links to every component", async ({ page }) => {
  await page.goto("");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Animated iOS components.");
  await expect(page.getByRole("region", { name: "Swipe deck on iPhone" })).toBeVisible();
  await expect(page.locator(".component-list li")).toHaveCount(5);
  await page.getByRole("link", { name: "Browse components" }).click();
  await expect(page).toHaveURL(/\/components\/$/);
  await expect(page.locator(".component-list li")).toHaveCount(5);
  await page.getByRole("link", { name: /^Morphing capsule/ }).click();
  await expect(page).toHaveURL(/\/components\/morphing-capsule\/$/);
  await page.getByRole("link", { name: "Expanding cards" }).last().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Expanding cards");
});

test("usage switches between SwiftUI and UIKit", async ({ page }) => {
  await page.goto("components/swipe-deck/");
  const usage = page.locator("#usage pre");
  await expect(usage).toContainText("HugsySwipeDeck(items:");
  await page.getByRole("button", { name: "UIKit", exact: true }).click();
  await expect(usage).toContainText("HugsySwipeDeckViewController");
});

test("source is syntax highlighted, copyable, and available as a standalone Swift file", async ({
  page,
  context,
  request,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("components/expanding-cards/");
  await page.locator(".source-files summary").click();
  await expect(page.locator(".source-files pre").first()).toContainText("import SwiftUI");
  await expect(page.locator(".source-files pre").last()).toContainText("canImport(UIKit)");
  expect(await page.locator(".source-preview .syntax-token").count()).toBeGreaterThan(20);
  await page.getByRole("button", { name: "Copy hugsyexpandingcards.swift code" }).click();
  await expect(page.getByText("Copied", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "public struct HugsyExpandingCards",
  );
  const source = await request.get("r/expanding-cards.swift");
  expect(source.status()).toBe(200);
  expect(await source.text()).toContain("accessibilityReduceMotion");
});

test("documentation navigation and installation are native-first", async ({ page }) => {
  await page.goto("docs/");
  await page.getByRole("link", { name: "Installation", exact: true }).first().click();
  await expect(page).toHaveURL(/\/docs\/installation\/$/);
  await expect(
    page.getByRole("heading", { name: "Installation", exact: true, level: 1 }),
  ).toBeVisible();
  const body = await page.locator("main").textContent();
  expect(body).toContain("curl -fsSL");
  expect(body).toContain("Add Package Dependencies > Add Local");
  expect(body).toContain("import HugsyComponents");
  expect(body).toContain("--distribution source");
  expect(body).toContain("UIKit");
  expect(body).toContain("HugsySwipeDeckViewController");
  expect(body).not.toMatch(/\bnpm\b|\bnpx\b|Node\.js/);
  expect(await page.locator(".syntax-token").count()).toBeGreaterThan(15);
  await page.getByRole("link", { name: "MCP", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tools", exact: true })).toBeVisible();
});

test("theme preference persists across navigation and reload", async ({ page }) => {
  await page.goto("");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Docs", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("reduced motion does not autoplay media or animate the interface", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("");
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browse components" })).toHaveCSS(
    "transition-duration",
    "0s",
  );
});

for (const path of pages) {
  test(`automated WCAG 2.2 AA: ${path || "landing"}`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() =>
      Promise.allSettled(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished),
      ),
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      })),
    ).toEqual([]);
  });
}

test("unknown routes return a real static 404", async ({ request }) => {
  expect((await request.get("components/not-a-component/")).status()).toBe(404);
});

test("prerendered controls wait for browser handlers", async ({ browser, baseURL }) => {
  if (!baseURL) {
    throw new Error("Configure the website origin before testing preview controls.");
  }
  const page = await browser.newPage({ javaScriptEnabled: false, baseURL });
  try {
    await page.goto("components/swipe-deck/");
    await expect(page.getByRole("button", { name: "iPad", exact: true })).toBeDisabled();
    await expect(page.locator(".device")).toHaveAttribute("data-device", "iphone");
    await expect(page.getByRole("button", { name: "UIKit", exact: true })).toBeDisabled();
  } finally {
    await page.close();
  }
});

test("component previews switch between iPhone, iPad, and Mac frames", async ({ page }) => {
  await page.goto("components/expanding-cards/");
  const device = page.locator(".device");
  await expect(device).toHaveAttribute("data-device", "iphone");
  await expect(page.getByRole("region", { name: "Expanding cards on iPhone" })).toBeVisible();
  for (const { label, kind } of [
    { label: "iPad", kind: "ipad" },
    { label: "Mac", kind: "mac" },
    { label: "iPhone", kind: "iphone" },
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(device).toHaveAttribute("data-device", kind);
    await expect(page.getByRole("button", { name: label, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "Open Quiet dunes" })).toBeVisible();
  }
});

test("multi-screen previews switch screens inside the same device", async ({ page }) => {
  await page.goto("components/morphing-capsule/");
  await expect(page.locator(".capsule-demo")).toHaveAttribute("data-variant", "player");
  await page.getByRole("button", { name: "Delivery", exact: true }).click();
  await expect(page.locator(".capsule-demo")).toHaveAttribute("data-variant", "delivery");
  await page.getByRole("button", { name: "iPad", exact: true }).click();
  await expect(page.locator(".capsule-demo")).toHaveAttribute("data-variant", "delivery");
});

test("swipe deck responds to dragging and to button alternatives", async ({ page }) => {
  await page.goto("components/swipe-deck/");
  const top = page.locator(".swipe-card[data-top] strong");
  await expect(top).toHaveText("Quiet dunes");
  await page.locator(".swipe-deck").scrollIntoViewIfNeeded();
  const box = await page.locator(".swipe-card[data-top]").boundingBox();
  if (!box) {
    throw new Error("Expected the top card to be visible.");
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(x + step * 16, y + step * 2);
  }
  await page.mouse.up();
  await expect(top).toHaveText("Blue harbor");
  await expect(page.locator(".swipe-demo [aria-live]")).toHaveText("Liked Quiet dunes");
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(top).toHaveText("Olive grove");
});

test("interactive previews support taps, keyboard dismissal, and reset", async ({ page }) => {
  await page.goto("components/morphing-capsule/");
  const capsule = page.locator(".capsule");
  await page.getByRole("button", { name: "Expand capsule" }).click();
  await expect(capsule).toHaveAttribute("data-phase", "expanded");
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset preview" }).click();
  await expect(capsule).toHaveAttribute("data-phase", "compact");

  await page.goto("components/expanding-cards/");
  await page.getByRole("button", { name: "Open Blue harbor" }).click();
  await expect(page.getByRole("dialog", { name: "Blue harbor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close details" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open Blue harbor" })).toBeFocused();

  await page.goto("components/radial-menu/");
  await page.getByRole("button", { name: "Open actions" }).click();
  await page.getByRole("button", { name: "New note" }).click();
  await expect(page.locator(".radial-notes li strong").first()).toHaveText("New note");

  await page.goto("components/parallax-carousel/");
  await page.getByRole("button", { name: /Show City at dusk/ }).click();
  await expect(page.getByRole("button", { name: /Show City at dusk/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
