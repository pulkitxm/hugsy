import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { catalog } from "../../registry/catalog";

const pages = [
  "",
  "components/",
  "docs/",
  "docs/installation/",
  "docs/cli/",
  "docs/mcp/",
  "docs/accessibility/",
  ...catalog.map((item) => `components/${item.name}/`),
];

test("every route is prerendered, directly accessible, and free of overflow or browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of pages) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
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

test("landing page is separate from collection and links to real iPhone showcases", async ({
  page,
}) => {
  await page.goto("");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Native motion.");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nothing in the way.");
  await expect(
    page
      .getByRole("img", { name: "Expanding cards, rendered by SwiftUI on an iPhone simulator" })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await page.getByRole("link", { name: "Browse components" }).click();
  await expect(page).toHaveURL(/\/components\/$/);
  await expect(page.locator("article.collection-card")).toHaveCount(6);
});

test("collection supports search, categories, empty results, and reset", async ({ page }) => {
  await page.goto("components/");
  await page.getByRole("button", { name: "Navigation", exact: true }).click();
  await expect(page.locator("article.collection-card")).toHaveCount(2);
  await page.getByRole("searchbox", { name: "Search components" }).fill("nothing matches");
  await expect(page.getByRole("heading", { name: "No components found." })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("article.collection-card")).toHaveCount(6);
  await page.getByRole("searchbox", { name: "Search components" }).fill("spring");
  await expect(page.locator("article.collection-card")).toHaveCount(4);
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator("article.collection-card")).toHaveCount(6);
});

test("source is syntax highlighted, copyable, and available as a standalone Swift file", async ({
  page,
  context,
  request,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("components/expanding-cards/");
  await page.getByRole("button", { name: "Source", exact: true }).click();
  await expect(page.locator("pre").first()).toContainText("import SwiftUI");
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

for (const item of catalog) {
  test(`native playback loads actual video without downloading before interaction: ${item.name}`, async ({
    page,
  }) => {
    const media: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(".mp4")) {
        media.push(request.url());
      }
    });
    await page.goto(`components/${item.name}/`);
    await expect(page.getByRole("heading", { name: "API reference" })).toBeVisible();
    expect(media).toEqual([]);
    await page.getByRole("button", { name: `Play ${item.title.toLowerCase()} demo` }).click();
    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect
      .poll(() =>
        video.evaluate((element) => {
          if (!(element instanceof HTMLVideoElement)) {
            throw new Error("Expected native video element");
          }
          return element.videoWidth;
        }),
      )
      .toBeGreaterThan(0);
    expect(media.length).toBeGreaterThan(0);
    await expect(page.getByText("Unable to play. Try the native gallery.")).toHaveCount(0);
  });
}

test("documentation navigation and installation are native-first", async ({ page }) => {
  await page.goto("docs/");
  await page.getByRole("link", { name: "Installation", exact: true }).first().click();
  await expect(page).toHaveURL(/\/docs\/installation\/$/);
  const body = await page.locator("main").textContent();
  expect(body).toContain("curl -fsSL");
  expect(body).not.toMatch(/\bnpm\b|\bnpx\b|Node\.js/);
  expect(await page.locator(".syntax-token").count()).toBeGreaterThan(15);
  await page.getByRole("link", { name: "MCP", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tools", exact: true })).toBeVisible();
});

test("theme preference persists across navigation and reload", async ({ page }) => {
  await page.goto("");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Documentation", exact: true }).click();
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
      Promise.all(document.getAnimations().map((animation) => animation.finished)),
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
