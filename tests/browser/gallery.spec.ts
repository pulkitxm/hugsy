import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { catalog } from "../../registry/catalog";

test("all pages have server-rendered content, no browser errors, and no horizontal overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["", "docs/", ...catalog.map((item) => `components/${item.name}/`)]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= globalThis.innerWidth),
    ).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://pulkitxm.github.io/hugsy/${path}`,
    );
    const html = await response?.text();
    expect(html).toContain("<h1");
    expect(html).toContain('lang="en"');
  }
  expect(errors).toEqual([]);
});

test("gallery filtering handles categories, search, empty results, and reset", async ({ page }) => {
  await page.goto("");
  await expect(page.locator("article.component-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Navigation", exact: true }).click();
  await expect(page.locator("article.component-card")).toHaveCount(3);
  await page.getByRole("textbox", { name: "Search components" }).fill("does not exist");
  await expect(page.getByRole("heading", { name: "No components found." })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("article.component-card")).toHaveCount(6);
  await page.getByRole("textbox", { name: "Search components" }).fill("spring");
  await expect(page.locator("article.component-card")).toHaveCount(4);
});

test("command palette filters, runs actions, and returns focus after Escape", async ({ page }) => {
  await page.goto("components/command-palette/");
  const open = page.getByRole("button", { name: "Open command palette", exact: true });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("textbox", { name: "Search commands" });
  await input.fill("files");
  await input.press("Enter");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Go to files: done")).toBeVisible();
  await open.click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
});

test("palette supports empty results and keyboard selection", async ({ page }) => {
  await page.goto("components/command-palette/");
  const input = page.getByRole("textbox", { name: "Search commands" }).first();
  await input.fill("no-results");
  await expect(page.getByText("No commands found.", { exact: false })).toBeVisible();
  await input.fill("");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page.getByText("Go to files: done")).toBeVisible();
});

test("toast stack can add, dismiss, and automatically expire a notification", async ({ page }) => {
  await page.goto("components/toast-stack/");
  await page.getByRole("button", { name: "Show a toast" }).click();
  await expect(page.getByText("Changes saved · 1")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss Changes saved · 1", exact: true }).click();
  await expect(page.getByText("Changes saved · 1")).not.toBeVisible();
  await page.getByRole("button", { name: "Show a toast" }).click();
  await expect(page.getByText("Changes saved · 2")).toBeVisible();
  await expect(page.getByText("Changes saved · 2")).not.toBeVisible({ timeout: 7000 });
});

test("fluid tabs support click and arrow-key activation", async ({ page }) => {
  await page.goto("components/fluid-tabs/");
  await page.getByRole("tab", { name: "Activity" }).click();
  await expect(page.getByText("Good things are happening.")).toBeVisible();
  await page.getByRole("tab", { name: "Activity" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Settings" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("checkbox", { name: "Desktop notifications" })).toBeChecked();
});

test("dock responds to focus and activation", async ({ page }) => {
  await page.goto("components/magnifying-dock/");
  const music = page.getByRole("button", { name: "Open Music" });
  await music.focus();
  await expect(music).toBeFocused();
  await music.click();
  await expect(page.getByText("Music opened")).toBeVisible();
});

test("card stack advances with a button and pointer drag", async ({ page }) => {
  await page.goto("components/card-stack/");
  await page.getByRole("button", { name: "Next card" }).click();
  await expect(page.locator('.stack-card[aria-hidden="false"]')).toContainText("Ideas are better");
  const stack = page.locator(".card-stack");
  const bounds = await stack.boundingBox();
  if (!bounds) {
    throw new Error("Missing card stack");
  }
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 100, bounds.y + bounds.height / 2, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(page.locator('.stack-card[aria-hidden="false"]')).toContainText("The next thing");
});

test("sidebar preserves its selection when collapsing and expanding", async ({ page }) => {
  await page.goto("components/animated-sidebar/");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Projects", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.getByText("Studio workspace")).toBeVisible();
});

test("source, installation links, theme toggle, and clipboard work", async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  await page.goto("components/fluid-tabs/");
  await page.getByRole("button", { name: "Source", exact: true }).click();
  await expect(page.locator("pre").first()).toContainText("import SwiftUI");
  await page.getByRole("button", { name: "Copy hugsyfluidtabs.swift code" }).click();
  await expect(page.getByText("Copied", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("reduced motion disables transitions and dock magnification", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("components/magnifying-dock/");
  const files = page.getByRole("button", { name: "Open Files" });
  await files.focus();
  await expect(files).toHaveCSS("width", "42px");
  await expect(files).toHaveCSS("transition-duration", "0s");
});

for (const path of ["", "docs/", ...catalog.map((item) => `components/${item.name}/`)]) {
  test(`WCAG 2.2 AA automated checks: ${path || "home"}`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((animation) => animation.finished)),
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("unknown routes return a real static 404", async ({ request }) => {
  expect((await request.get("components/not-a-component/")).status()).toBe(404);
});
