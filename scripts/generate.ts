import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
import { createHighlighter } from "shiki";
import { catalog } from "../registry/catalog";
import { highlightSchema } from "../registry/highlight-schema";
import { registrySchema } from "../registry/schema";
import { siteOrigin as origin } from "../registry/site";
import {
  firstComponent,
  installCommand,
  manualInstall,
  mcpConfig,
  packageConfig,
  sourceExample,
} from "../src/lib/snippets";

await mkdir("generated", { recursive: true });
await rm("public/r", { recursive: true, force: true });
await rm("public/hugsy-0.1.0.tgz", { force: true });
await mkdir("public/r", { recursive: true });
const social = new Resvg(await readFile("public/social.svg", "utf8"));
await writeFile("public/social.png", social.render().asPng());
const components = await Promise.all(
  catalog.map(async (item) => {
    const source = await readFile(`registry/swift/${item.filename}`, "utf8");
    const files = await Promise.all(
      item.files.map(async (file) => {
        const data = await readFile(`registry/swift/${file.path}`);
        return {
          ...file,
          data: data.toString("base64"),
          sha256: createHash("sha256").update(data).digest("hex"),
        };
      }),
    );
    return { ...item, files, source, sha256: createHash("sha256").update(source).digest("hex") };
  }),
);
const registry = registrySchema.parse({
  version: 2,
  platform: "ios",
  minimumVersion: "17.0",
  components,
});
if (new Set(components.map((item) => item.name)).size !== components.length) {
  throw new Error("Component names must be unique");
}
await writeFile("generated/registry.json", `${JSON.stringify(registry)}\n`);
await writeFile("public/r/index.json", `${JSON.stringify(registry)}\n`);
await Promise.all(
  components.flatMap((item) => [
    writeFile(`public/r/${item.name}.json`, `${JSON.stringify(item)}\n`),
    writeFile(`public/r/${item.name}.swift`, item.source),
  ]),
);
const paths = [
  "/",
  "/components/",
  "/docs/",
  "/docs/installation/",
  "/docs/cli/",
  "/docs/mcp/",
  "/docs/accessibility/",
  ...components.map((item) => `/components/${item.name}/`),
];
await mkdir("public/native", { recursive: true });
await Promise.all(
  components.map((item) =>
    writeFile(
      `public/native/${item.name}.vtt`,
      `WEBVTT\n\n00:00.000 --> 00:12.000\n${item.title}. ${item.description}\n`,
    ),
  ),
);
await writeFile(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join("")}</urlset>\n`,
);
await writeFile("public/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(
  "public/llms-full.txt",
  `# Hugsy\n\nCopy-and-own animated SwiftUI components. iOS 17+, Swift 6. MIT licensed. No application dependencies.\n\nInstall the native Swift CLI from ${origin}/docs/. No JavaScript runtime is required to use Hugsy. Run hugsy list --json, hugsy info <name> --json, hugsy init, then hugsy add <name> --dry-run --json. Never overwrite customized source without permission. MCP: hugsy mcp.\n\n${components.map((item) => `## ${item.title}\n\n${item.description}\n\n${item.integration}\n\n${item.accessibility}\n\n${item.usage}\n\n${origin}/r/${item.name}.json\n`).join("\n")}`,
);
const highlighter = await createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["swift", "shellscript", "json"],
});
type CodeSample = { code: string; lang: "swift" | "shellscript" | "json" };
const samples: CodeSample[] = [
  ...components.flatMap((item): CodeSample[] => [
    { code: item.source, lang: "swift" },
    { code: item.usage, lang: "swift" },
    { code: `hugsy add ${item.name}`, lang: "shellscript" },
  ]),
  ...[
    installCommand,
    firstComponent,
    manualInstall,
    "hugsy mcp",
    "hugsy list --json\nhugsy info expanding-cards --json\nhugsy add expanding-cards --dry-run --json",
  ].map((code): CodeSample => ({ code, lang: "shellscript" })),
  { code: mcpConfig, lang: "json" },
  { code: packageConfig, lang: "json" },
  { code: sourceExample, lang: "swift" },
];
const highlights = highlightSchema.parse(
  Object.fromEntries(
    samples.map(({ code, lang }) => {
      let start = 0;
      const lines = highlighter
        .codeToTokensWithThemes(code, {
          lang,
          themes: { light: "github-light", dark: "github-dark" },
        })
        .map((line) => {
          const position = start;
          const tokens = line.map((token) => {
            const offset = start;
            start += token.content.length;
            return [
              token.content,
              token.variants["light"]?.color ?? "#24292e",
              token.variants["dark"]?.color ?? "#e1e4e8",
              offset,
            ];
          });
          start += 1;
          return { start: position, tokens };
        });
      return [code, lines];
    }),
  ),
);
await writeFile("generated/highlights.json", `${JSON.stringify(highlights)}\n`);
highlighter.dispose();
