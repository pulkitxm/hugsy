import { readFileSync } from "node:fs";
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

test("landing page shows every component live on an iPhone", async ({ page }) => {
  await page.goto("");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Animated components for iOS.");
  await expect(page.locator(".showcase-card")).toHaveCount(5);
  await expect(page.getByRole("region", { name: "Swipe deck on iPhone" })).toBeVisible();
  await expect(page.locator(".showcase-card .swipe-card").first()).toBeVisible();
  await page.getByRole("link", { name: "Browse components" }).click();
  await expect(page).toHaveURL(/\/components\/$/);
  await expect(page.locator(".component-gallery .showcase-card")).toHaveCount(5);
  await expect(page.locator(".showcase-description").first()).toContainText("fling away");
  await page.getByRole("link", { name: /^Morphing capsule/ }).click();
  await expect(page).toHaveURL(/\/components\/morphing-capsule\/$/);
  await page.getByRole("link", { name: "Expanding cards" }).last().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Expanding cards");
});

test("usage switches between SwiftUI and UIKit", async ({ page }) => {
  await page.goto("components/swipe-deck/");
  const usage = page.locator("#usage pre:visible");
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
  expect(await page.locator(".source-preview code span").count()).toBeGreaterThan(20);
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
  expect(await page.locator(".code-block code span").count()).toBeGreaterThan(15);
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

test("device switching keeps the page steady and shows device hardware", async ({
  page,
  isMobile,
}) => {
  await page.goto("components/radial-menu/");
  await expect(page.locator(".device-island")).toBeVisible();
  await expect(page.locator(".button-camera-control")).toBeVisible();
  const before = await page.locator(".device-stage").boundingBox();
  await page.getByRole("button", { name: "Mac", exact: true }).click();
  await expect(page.locator(".mac-notch")).toBeVisible();
  await expect(page.locator(".mac-lights span")).toHaveCount(3);
  await expect(page.locator(".device-base")).toBeVisible();
  await expect(page.locator(".device-island")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open actions" })).toBeVisible();
  const after = await page.locator(".device-stage").boundingBox();
  if (!isMobile) {
    expect(after?.height).toBe(before?.height);
  }
  await expect(page.locator(".preview-note")).toContainText("MacBook Pro 14-inch");
  await page.getByRole("button", { name: "iPad", exact: true }).click();
  await expect(page.locator(".device-camera")).toBeVisible();
  await expect(page.locator(".mac-notch")).toHaveCount(0);
});

test("every code block is highlighted in the prerendered HTML", async ({ browser, baseURL }) => {
  if (!baseURL) {
    throw new Error("Configure the website origin before testing highlighting.");
  }
  const page = await browser.newPage({ baseURL, javaScriptEnabled: false });
  try {
    for (const path of pages) {
      await page.goto(path);
      for (const code of await page.locator(".code-block code").all()) {
        expect(await code.locator("span").count()).toBeGreaterThan(0);
      }
    }
  } finally {
    await page.close();
  }
});

test("code stays highlighted after client navigation in both themes", async ({ page }) => {
  await page.goto("docs/cli/");
  await page.getByRole("link", { name: "MCP", exact: true }).first().click();
  await expect(page).toHaveURL(/\/docs\/mcp\/$/);
  const token = page.locator(".code-block code span").first();
  await expect(token).toBeVisible();
  const light = await token.evaluate((element) => getComputedStyle(element).color);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  const dark = await token.evaluate((element) => getComputedStyle(element).color);
  expect(dark).not.toBe(light);
});

test("theme switching changes every element instantly", async ({ page }) => {
  await page.goto("docs/");
  const button = page.getByRole("button", { name: "Toggle color theme" });
  const transitionsDuringSwitch = await button.evaluate((element) => {
    const running: string[] = [];
    document.addEventListener("transitionrun", (event) => running.push(event.propertyName));
    if (element instanceof HTMLElement) {
      element.click();
    }
    return new Promise<string[]>((resolve) => {
      setTimeout(() => resolve(running), 300);
    });
  });
  expect(transitionsDuringSwitch).toEqual([]);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-switching", "");
});

test("the website ships no third-party UI library", async () => {
  const { dependencies } = JSON.parse(readFileSync("package.json", "utf8"));
  expect(Object.keys(dependencies).sort()).toEqual([
    "@tanstack/react-router",
    "@tanstack/react-start",
    "react",
    "react-dom",
  ]);
});

test("theme is correct on first paint without waiting for hydration", async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("Configure the website origin before testing the theme.");
  }
  const darkBackground = "rgb(9, 9, 10)";
  const system = await browser.newPage({ baseURL, colorScheme: "dark", javaScriptEnabled: false });
  try {
    await system.goto("docs/");
    await expect(system.locator("body")).toHaveCSS("background-color", darkBackground);
  } finally {
    await system.close();
  }
  const saved = await browser.newPage({ baseURL, colorScheme: "light" });
  try {
    await saved.route("**/assets/*.js", (route) => route.abort());
    await saved.addInitScript(() => localStorage.setItem("hugsy-theme", "dark"));
    await saved.goto("docs/");
    await expect(saved.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(saved.locator("body")).toHaveCSS("background-color", darkBackground);
    await expect(saved.locator(".theme-sun")).toBeVisible();
    await expect(saved.locator(".theme-moon")).toBeHidden();
  } finally {
    await saved.close();
  }
});

test("every page links to its Markdown version", async ({ page, request }) => {
  for (const path of pages) {
    const expected = path === "" ? "index.md" : `${path.replace(/\/$/, "")}.md`;
    await page.goto(path);
    await expect(page.getByRole("link", { name: "View this page as Markdown" })).toHaveAttribute(
      "href",
      `/${expected}`,
    );
    const response = await request.get(expected);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/markdown");
    expect(await response.text()).toMatch(/^# /);
  }
  const markdown = await (await request.get("components/swipe-deck.md")).text();
  expect(markdown).toContain("HugsySwipeDeckViewController");
  expect(markdown).toContain("```swift");
  expect(markdown).not.toContain("Interactive web preview");
});
