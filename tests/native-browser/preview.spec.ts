import { execFileSync } from "node:child_process";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import sharp from "sharp";

async function openPreview(page: Page) {
  await page.goto("components/expanding-cards/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Try live locally" }).click();
  await expect(page.getByText("Live SwiftUI", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("button", { name: /THE ART OF DOING LESS/ })).toBeVisible();
}

test("native screen stays unstyled, proportional, and free of simulator controls", async ({
  page,
}, testInfo) => {
  await openPreview(page);
  await expect(page.locator(".iphone")).toHaveCount(1);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByText("iPhone 17e", { exact: true })).toHaveCount(0);
  await expect(page.getByText("EVENT LOG", { exact: true })).toHaveCount(0);
  const image = page.locator(".native-touch-surface img");
  await expect(image).toHaveJSProperty("naturalWidth", 1206);
  await expect(image).toHaveJSProperty("naturalHeight", 2622);
  await expect(image).toHaveCSS("object-fit", "contain");
  await expect(image).toHaveCSS("filter", "none");
  const bounds = await image.boundingBox();
  if (!bounds) {
    throw new Error("Native screen is missing.");
  }
  expect(bounds.width / bounds.height).toBeCloseTo(1206 / 2622, 3);
  const simulator = process.env["HUGSY_SIMULATOR"];
  if (!simulator) {
    throw new Error("Set HUGSY_SIMULATOR to the dedicated Hugsy Preview UUID.");
  }
  const nativeFrame = testInfo.outputPath("native-frame.png");
  execFileSync("xcrun", ["simctl", "io", simulator, "screenshot", nativeFrame], {
    env: {
      ...process.env,
      DEVELOPER_DIR: process.env["DEVELOPER_DIR"] ?? "/Applications/Xcode.app/Contents/Developer",
    },
  });
  await expect
    .poll(async () => {
      const screenshot = await image.screenshot();
      const metadata = await sharp(screenshot).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error("Browser screenshot has no dimensions.");
      }
      const region = {
        left: Math.floor(metadata.width * 0.1),
        top: Math.floor(metadata.height * 0.3),
        width: Math.floor(metadata.width * 0.8),
        height: Math.floor(metadata.height * 0.5),
      };
      const expected = await sharp(nativeFrame)
        .resize(metadata.width, metadata.height)
        .extract(region)
        .removeAlpha()
        .raw()
        .toBuffer();
      const actual = await sharp(screenshot).extract(region).removeAlpha().raw().toBuffer();
      expect(actual.length).toBe(expected.length);
      let difference = 0;
      for (let index = 0; index < actual.length; index++) {
        const first = actual[index];
        const second = expected[index];
        if (first === undefined || second === undefined) {
          throw new Error("Native comparison is incomplete.");
        }
        difference += Math.abs(first - second);
      }
      return difference / actual.length;
    })
    .toBeLessThan(8);
});

test("pointer interaction opens the real component and keyboard actions close it", async ({
  page,
  isMobile,
}) => {
  await openPreview(page);
  const image = page.locator(".native-touch-surface img");
  await image.scrollIntoViewIfNeeded();
  const bounds = await image.boundingBox();
  if (!bounds) {
    throw new Error("Native screen is missing.");
  }
  if (isMobile) {
    await page.touchscreen.tap(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.4);
  } else {
    await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.4);
  }
  const close = page.getByRole("button", { name: "Close details", exact: true });
  await expect(close).toBeVisible();
  await close.focus();
  await close.press("Enter");
  await expect(close).toHaveCount(0);
  const first = page.getByRole("button", { name: /THE ART OF DOING LESS/ });
  await first.focus();
  await first.press("Enter");
  await expect(close).toBeVisible();
});

test("native drag dismissal forwards a complete gesture", async ({ page }) => {
  await openPreview(page);
  const first = page.getByRole("button", { name: /THE ART OF DOING LESS/ });
  await first.focus();
  await first.press("Enter");
  const close = page.getByRole("button", { name: "Close details", exact: true });
  await expect(close).toBeVisible();
  const screen = page.locator(".native-touch-surface");
  await screen.scrollIntoViewIfNeeded();
  const bounds = await screen.boundingBox();
  if (!bounds) {
    throw new Error("Native screen is missing.");
  }
  const x = bounds.x + bounds.width * 0.5;
  await page.mouse.move(x, bounds.y + bounds.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(x, bounds.y + bounds.height * 0.8, { steps: 20 });
  await page.mouse.up();
  await expect(close).toHaveCount(0);
  await expect(first).toBeVisible();
});

test("reset returns the native gallery to its initial state", async ({ page }) => {
  await openPreview(page);
  const first = page.getByRole("button", { name: /THE ART OF DOING LESS/ });
  await first.focus();
  await first.press("Enter");
  await expect(page.getByRole("button", { name: "Close details", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset native preview" }).click();
  await expect(page.getByText("Live SwiftUI", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("button", { name: /THE ART OF DOING LESS/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close details", exact: true })).toHaveCount(0);
});

test("a disconnected stream retains an accurately labeled recording and can retry", async ({
  page,
}) => {
  await page.route("**/__native/session/**", (route) => route.fulfill({ status: 503 }));
  await page.goto("components/expanding-cards/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Try live locally" }).click();
  await expect(page.getByText(/Live preview unavailable/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Play expanding cards demo" })).toBeVisible();
  await expect(page.getByText("Live SwiftUI", { exact: true })).toHaveCount(0);
  await page.unroute("**/__native/session/**");
  await page.getByRole("button", { name: "Retry live preview" }).click();
  await expect(page.getByText("Live SwiftUI", { exact: true })).toBeVisible({ timeout: 60000 });
});

test("the bridge rejects remote origins and unknown components", async ({ request }) => {
  expect(
    (
      await request.post("__native/session/expanding-cards", {
        headers: { Origin: "https://example.com" },
      })
    ).status(),
  ).toBe(403);
  expect((await request.post("__native/session/not-a-component")).status()).toBe(404);
});

test("Reduce Motion changes the real simulator setting", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPreview(page);
  const simulator = process.env["HUGSY_SIMULATOR"];
  if (!simulator) {
    throw new Error("Set HUGSY_SIMULATOR to the dedicated Hugsy Preview UUID.");
  }
  expect(
    execFileSync("bunx", ["serve-sim@0.1.49", "ui", "reduce-motion", "--device", simulator], {
      encoding: "utf8",
    }).trim(),
  ).toBe("on");
});
