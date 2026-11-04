import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
import { catalog } from "../registry/catalog";
import { registrySchema } from "../registry/schema";

await mkdir("generated", { recursive: true });
await mkdir("public/r", { recursive: true });
const social = new Resvg(await readFile("public/social.svg", "utf8"));
await writeFile("public/social.png", social.render().asPng());
const components = await Promise.all(
  catalog.map(async (item) => {
    const source = await readFile(`registry/swift/${item.filename}`, "utf8");
    return { ...item, source, sha256: createHash("sha256").update(source).digest("hex") };
  }),
);
const registry = registrySchema.parse({
  version: 1,
  platform: "macos",
  minimumVersion: "14.0",
  components,
});
if (new Set(components.map((item) => item.name)).size !== components.length) {
  throw new Error("Component names must be unique");
}
await writeFile("generated/registry.json", `${JSON.stringify(registry)}\n`);
await writeFile("public/r/index.json", `${JSON.stringify(registry)}\n`);
await Promise.all(
  components.map((item) => writeFile(`public/r/${item.name}.json`, `${JSON.stringify(item)}\n`)),
);
const origin = "https://pulkitxm.github.io/hugsy";
const paths = ["/", "/docs/", ...components.map((item) => `/components/${item.name}/`)];
await writeFile(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join("")}</urlset>\n`,
);
await writeFile(
  "public/robots.txt",
  `User-agent: *\nAllow: /hugsy/\nSitemap: ${origin}/sitemap.xml\n`,
);
await writeFile(
  "public/llms-full.txt",
  `# Hugsy\n\nCopy-and-own animated SwiftUI components. macOS 14+, Swift 6. MIT licensed. No Swift dependencies.\n\nInstall the CLI from ${origin}/docs/. Run hugsy list --json, hugsy info <name> --json, hugsy init, then hugsy add <name> --dry-run --json. Never overwrite customized source without permission. MCP: hugsy mcp.\n\n${components.map((item) => `## ${item.title}\n\n${item.description}\n\n${item.integration}\n\n${item.accessibility}\n\n${item.usage}\n\n${origin}/r/${item.name}.json\n`).join("\n")}`,
);
