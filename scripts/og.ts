import { spawn } from "node:child_process";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";

type Visual = "device" | "trio" | "row" | "code" | "settings";
type Card = {
  slug: string;
  path: string;
  title: string;
  subtitle: string;
  hue: number;
  visual: Visual;
  codeIndex?: number;
  anchorBottom?: boolean;
  prepare?: (page: Page) => Promise<void>;
};

const port = 4177;

async function clickButton(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
  await page.waitForTimeout(900);
}

async function dragTopCard(page: Page) {
  const box = await page.locator(".swipe-card[data-top]").boundingBox();
  if (!box) {
    throw new Error("Expected the top card to be visible.");
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step += 1) {
    await page.mouse.move(x + step * 7.5, y + step);
  }
  await page.waitForTimeout(150);
}

const cards: Card[] = [
  {
    slug: "home",
    path: "/components/",
    title: "Animated components for iOS.",
    subtitle: "SwiftUI and UIKit. Yours to own.",
    hue: 262,
    visual: "trio",
    prepare: async (page) => {
      await clickButton(page, "Expand capsule");
      await clickButton(page, "Open actions");
    },
  },
  {
    slug: "components",
    path: "/components/",
    title: "Five live components.",
    subtitle: "Try them on iPhone, iPad, and Mac.",
    hue: 210,
    visual: "row",
    prepare: async (page) => {
      await clickButton(page, "Expand capsule");
    },
  },
  {
    slug: "swipe-deck",
    path: "/components/swipe-deck/",
    title: "Swipe deck",
    subtitle: "Fling physics for SwiftUI and UIKit.",
    hue: 24,
    visual: "device",
    prepare: dragTopCard,
  },
  {
    slug: "parallax-carousel",
    path: "/components/parallax-carousel/",
    title: "Parallax carousel",
    subtitle: "Depth that follows the scroll.",
    hue: 205,
    visual: "device",
    prepare: async (page) => {
      await page.locator(".carousel-track").evaluate((track) => {
        track.setAttribute("data-grabbing", "");
        track.scrollLeft = 118;
      });
      await page.waitForTimeout(300);
    },
  },
  {
    slug: "morphing-capsule",
    path: "/components/morphing-capsule/",
    title: "Morphing capsule",
    subtitle: "One shape, three states.",
    hue: 36,
    visual: "device",
    prepare: async (page) => clickButton(page, "Expand capsule"),
  },
  {
    slug: "expanding-cards",
    path: "/components/expanding-cards/",
    title: "Expanding cards",
    subtitle: "Shared geometry, drag to dismiss.",
    hue: 150,
    visual: "device",
    prepare: async (page) => clickButton(page, "Open Blue harbor"),
  },
  {
    slug: "radial-menu",
    path: "/components/radial-menu/",
    title: "Radial menu",
    subtitle: "Actions on an arc, one thumb away.",
    hue: 12,
    visual: "device",
    anchorBottom: true,
    prepare: async (page) => clickButton(page, "Open actions"),
  },
  {
    slug: "docs",
    path: "/docs/",
    title: "Documentation",
    subtitle: "From first install to shipping.",
    hue: 230,
    visual: "code",
  },
  {
    slug: "docs-installation",
    path: "/docs/installation/",
    title: "Installation",
    subtitle: "One CLI. Source you own.",
    hue: 170,
    visual: "code",
    codeIndex: 2,
  },
  {
    slug: "docs-cli",
    path: "/docs/cli/",
    title: "CLI",
    subtitle: "A native Swift command for your project.",
    hue: 280,
    visual: "code",
  },
  {
    slug: "docs-mcp",
    path: "/docs/mcp/",
    title: "MCP",
    subtitle: "Give your tools the source.",
    hue: 195,
    visual: "code",
  },
  {
    slug: "docs-accessibility",
    path: "/docs/accessibility/",
    title: "Accessibility",
    subtitle: "Motion that respects every user.",
    hue: 140,
    visual: "settings",
  },
];

const styles = `
#og { position: fixed; inset: 0; z-index: 9999; width: 1200px; height: 630px; overflow: hidden;
  background: radial-gradient(ellipse 760px 620px at 84% 40%, hsl(var(--og-hue) 72% 42% / 34%), transparent 72%),
    radial-gradient(ellipse 500px 380px at 8% 0%, hsl(var(--og-hue) 60% 50% / 11%), transparent 70%), #08080a;
  color: #fafafa; font-family: -apple-system, "SF Pro Display", "Segoe UI", sans-serif; }
#og::before { position: absolute; inset: 0; content: ""; opacity: 0.5;
  background-image: radial-gradient(rgb(255 255 255 / 9%) 1px, transparent 1px); background-size: 26px 26px;
  mask-image: radial-gradient(ellipse 620px 480px at 82% 40%, black, transparent 78%); }
.og-brand { position: absolute; top: 58px; left: 72px; display: flex; gap: 14px; align-items: center;
  font-size: 30px; font-weight: 650; letter-spacing: -0.03em; }
.og-brand svg { width: 42px; height: 42px; }
.og-brand rect { fill: #fafafa; } .og-brand path { fill: none; stroke: #08080a; stroke-linecap: round; stroke-width: 6; }
.og-text { position: absolute; top: 168px; left: 72px; width: 560px; }
#og[data-compact] .og-text { width: 470px; }
#og[data-compact] .og-text h1 { font-size: 66px; }
#og[data-compact] .og-text p { font-size: 26px; }
.og-text h1 { margin: 0; font-size: 84px; font-weight: 680; letter-spacing: -0.05em; line-height: 1; }
.og-text p { margin: 22px 0 0; color: #b4b4bb; font-size: 30px; letter-spacing: -0.015em; line-height: 1.25; }
.og-visual { position: absolute; inset: 0; }
#og .device { position: absolute; margin: 0; }
#og .code-block { position: absolute; top: 50%; right: 56px; width: 560px; margin: 0; translate: 0 -46%; border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 18px; background: rgb(18 18 21 / 92%); box-shadow: 0 40px 90px rgb(0 0 0 / 55%); }
#og .code-heading { height: 54px; padding-left: 80px; position: relative; font-size: 16px; border-color: rgb(255 255 255 / 9%); color: #a1a1aa; }
#og .code-heading::before { position: absolute; left: 20px; width: 12px; height: 12px; border-radius: 50%;
  background: #ff5f57; box-shadow: 18px 0 #febc2e, 36px 0 #28c840; content: ""; }
#og .code-heading button { display: none; }
#og .code-block pre { max-height: none; padding: 26px 30px 30px; overflow: hidden; font-size: 19px; line-height: 1.65; }
.og-settings { position: absolute; top: 50%; right: 64px; width: 500px; translate: 0 -46%; padding: 12px 30px; border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 26px; background: rgb(18 18 21 / 92%); box-shadow: 0 40px 90px rgb(0 0 0 / 55%); }
.og-settings div { display: flex; align-items: center; justify-content: space-between; padding: 26px 0; font-size: 28px; letter-spacing: -0.02em; }
.og-settings div + div { border-top: 1px solid rgb(255 255 255 / 9%); }
.og-settings span { position: relative; width: 74px; height: 44px; border-radius: 22px; background: hsl(142 70% 45%); }
.og-settings span::after { position: absolute; top: 3px; right: 3px; width: 38px; height: 38px; border-radius: 50%; background: #fff; content: ""; }
`;

const mark = `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="16"/><path d="M20 16v32m0-13c0-15 24-15 24 0v13"/></svg>`;

async function compose(page: Page, card: Card) {
  await page.addStyleTag({ content: styles });
  await page.evaluate(
    ({ card: item, mark: logo }) => {
      const root = document.createElement("div");
      root.id = "og";
      root.style.setProperty("--og-hue", String(item.hue));
      if (item.visual !== "device") {
        root.dataset["compact"] = "";
      }
      root.innerHTML = `<div class="og-brand">${logo}hugsy</div><div class="og-text"><h1></h1><p></p></div><div class="og-visual"></div>`;
      const heading = root.querySelector("h1");
      const text = root.querySelector("p");
      const visual = root.querySelector(".og-visual");
      if (!heading || !text || !visual) {
        throw new Error("Expected the card layout.");
      }
      heading.textContent = item.title;
      text.textContent = item.subtitle;
      const place = (device: Element, style: string) => {
        const node = device.cloneNode(true);
        if (node instanceof HTMLElement) {
          node.style.cssText = style;
          visual.append(node);
        }
      };
      const devices = [...document.querySelectorAll(".device")];
      const named = (selector: string) =>
        devices.find((device) => device.querySelector(selector)) ?? devices[0];
      if (item.visual === "device" && devices[0]) {
        const anchor = item.anchorBottom ? "bottom:44px" : "top:44px";
        place(devices[0], `--device-width:330px;width:330px;right:96px;${anchor}`);
      }
      if (item.visual === "trio") {
        const swipe = named(".swipe-demo");
        const capsule = named(".capsule-demo");
        const radial = named(".radial-demo");
        if (swipe && capsule && radial) {
          place(swipe, "--device-width:250px;width:250px;right:292px;top:128px;rotate:-7deg");
          place(radial, "--device-width:250px;width:250px;right:-22px;top:128px;rotate:7deg");
          place(capsule, "--device-width:280px;width:280px;right:122px;top:62px");
        }
      }
      if (item.visual === "row") {
        const order = [
          ".swipe-demo",
          ".carousel-demo",
          ".capsule-demo",
          ".cards-demo",
          ".radial-demo",
        ];
        order.forEach((selector, index) => {
          const device = named(selector);
          if (device) {
            place(
              device,
              `--device-width:196px;width:196px;left:${516 + index * 128}px;top:${56 + Math.abs(index - 2) * 54}px;z-index:${5 - Math.abs(index - 2)}`,
            );
          }
        });
      }
      if (item.visual === "code") {
        const block = document.querySelectorAll(".code-block")[item.codeIndex];
        if (block) {
          visual.append(block.cloneNode(true));
        }
      }
      if (item.visual === "settings") {
        const panel = document.createElement("div");
        panel.className = "og-settings";
        for (const label of ["Reduce Motion", "VoiceOver", "Larger Text", "Keyboard Access"]) {
          const row = document.createElement("div");
          row.textContent = label;
          row.append(document.createElement("span"));
          panel.append(row);
        }
        visual.append(panel);
      }
      document.body.append(root);
    },
    {
      card: {
        title: card.title,
        subtitle: card.subtitle,
        hue: card.hue,
        visual: card.visual,
        codeIndex: card.codeIndex ?? 0,
        anchorBottom: card.anchorBottom ?? false,
      },
      mark,
    },
  );
  await page.waitForTimeout(250);
}

const server = spawn("bun", [join("scripts", "serve.ts")], {
  env: { ...process.env, HUGSY_PORT: String(port) },
  stdio: "ignore",
});
await new Promise((resolve) => setTimeout(resolve, 500));
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const card of cards) {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: "dark",
    });
    await page.goto(`http://127.0.0.1:${port}${card.path}`);
    await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
    await page.setViewportSize({ width: 1200, height: 4000 });
    await page.waitForTimeout(card.path === "/components/" ? 1500 : 900);
    await page.setViewportSize({ width: 1200, height: 900 });
    await card.prepare?.(page);
    await compose(page, card);
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.waitForTimeout(150);
    await page.locator("#og").screenshot({
      path: `public/og/${card.slug}.jpg`,
      type: "jpeg",
      quality: 92,
    });
    await page.close();
    process.stdout.write(`${card.slug}\n`);
  }
} finally {
  await browser.close();
  server.kill();
}
