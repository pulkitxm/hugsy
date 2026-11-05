import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
import { createHighlighter } from "shiki";
import { catalog, showcase } from "../registry/catalog";
import type { Highlights } from "../registry/highlight";
import { registrySchema } from "../registry/schema";
import { siteOrigin as origin } from "../registry/site";
import {
  agentWorkflow,
  firstComponent,
  installCommand,
  manualInstall,
  mcpConfig,
  packageConfig,
  sourceExample,
  uikitExample,
} from "../src/lib/snippets";
import { sitePaths } from "./markdown-pages";

await rm("generated", { recursive: true, force: true });
await mkdir("generated/pages", { recursive: true });
await rm("public/r", { recursive: true, force: true });
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
await writeFile("generated/registry.json", `${JSON.stringify(registry)}\n`);
await writeFile("public/r/index.json", `${JSON.stringify(registry)}\n`);
await Promise.all(
  registry.components.flatMap((item) => [
    writeFile(`public/r/${item.name}.json`, `${JSON.stringify(item)}\n`),
    writeFile(`public/r/${item.name}.swift`, item.source),
  ]),
);
await writeFile(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitePaths.map((path) => `<url><loc>${origin}${path}</loc></url>`).join("")}</urlset>\n`,
);
await writeFile("public/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(
  "public/llms-full.txt",
  `# Hugsy\n\nSource-owned iOS components and services. iOS 17+, Swift 6. MIT licensed. No third-party runtime dependencies. Every component ships a SwiftUI view and a UIKit view controller adapter.\n\nInstall the native Swift CLI from ${origin}/docs/. Run hugsy list --json, hugsy info <name> --json, hugsy init, then hugsy add <name> --dry-run --json. The default creates a local Swift package. Add it in Xcode, attach HugsyComponents to the app target, and import HugsyComponents. Source mode requires explicit --distribution source and target membership, without an extra module import. Writing files does not link the app. Never overwrite customized source without permission. MCP: hugsy mcp.\n\n${components.map((item) => `## ${item.title}\n\n${item.description}\n\nFrameworks: ${item.frameworks.join(", ")}\n\n${item.integration}\n\n${item.accessibility}\n\nSwiftUI:\n\n${item.usage}\n\n${item.uikitUsage ? `UIKit:\n\n${item.uikitUsage}\n\n` : ""}${origin}/r/${item.name}.json\n`).join("\n")}`,
);

const highlighter = await createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["swift", "shellscript", "json"],
});
type Sample = [code: string, lang: "swift" | "shellscript" | "json"];
const defaultColors = "#24292e|#e1e4e8";
const palette = new Map<string, string>();
function tokenClass(light: string, dark: string) {
  const colors = `${light}|${dark}`.toLowerCase();
  if (colors === defaultColors) {
    return "";
  }
  const existing = palette.get(colors);
  if (existing) {
    return existing;
  }
  const created = `s${palette.size}`;
  palette.set(colors, created);
  return created;
}
function escapeHtml(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function highlight(samples: Sample[]): Highlights {
  return Object.fromEntries(
    samples.map(([code, lang]) => {
      const lines = highlighter
        .codeToTokensWithThemes(code, {
          lang,
          themes: { light: "github-light", dark: "github-dark" },
        })
        .map((line) => {
          const runs: { name: string; text: string }[] = [];
          for (const token of line) {
            const name = tokenClass(
              token.variants["light"]?.color ?? "#24292e",
              token.variants["dark"]?.color ?? "#e1e4e8",
            );
            const previous = runs.at(-1);
            if (previous && (previous.name === name || token.content.trim() === "")) {
              previous.text += token.content;
            } else {
              runs.push({ name, text: token.content });
            }
          }
          return runs
            .map(({ name, text }) =>
              name ? `<span class="${name}">${escapeHtml(text)}</span>` : escapeHtml(text),
            )
            .join("");
        });
      return [code, lines.join("\n")];
    }),
  );
}
function typedModule(name: string, type: string, from: string, value: unknown) {
  const imported = type.includes("ComponentPage") ? "ComponentPage" : type;
  return `import type { ${imported} } from "${from}";\n\nexport const ${name}: ${type} = ${JSON.stringify(value)};\n`;
}
await writeFile(
  "generated/components.ts",
  typedModule(
    "components",
    'Pick<ComponentPage, "name" | "title" | "description" | "category" | "technique" | "frameworks">[]',
    "../registry/schema.ts",
    showcase.map(({ name, title, description, category, technique, frameworks }) => ({
      name,
      title,
      description,
      category,
      technique,
      frameworks,
    })),
  ),
);
await Promise.all(
  showcase.map((entry) => {
    const item = registry.components.find((candidate) => candidate.name === entry.name);
    if (!item) {
      throw new Error(`Missing generated component: ${entry.name}`);
    }
    const sources = item.files
      .filter((file) => file.kind === "source")
      .map((file) => ({
        path: file.path,
        code: Buffer.from(file.data, "base64").toString("utf8"),
      }));
    const usage: Sample[] = [[item.usage, "swift"]];
    if (item.uikitUsage) {
      usage.push([item.uikitUsage, "swift"]);
    }
    return writeFile(
      `generated/pages/${item.name}.ts`,
      typedModule("page", "ComponentPage", "../../registry/schema.ts", {
        ...entry,
        sources,
        highlights: highlight([
          ...sources.map(({ code }): Sample => [code, "swift"]),
          ...usage,
          [`hugsy add ${item.name}`, "shellscript"],
        ]),
      }),
    );
  }),
);
await writeFile(
  "generated/docs.ts",
  typedModule(
    "highlights",
    "Highlights",
    "../registry/highlight.ts",
    highlight([
      [installCommand, "shellscript"],
      [firstComponent, "shellscript"],
      [manualInstall, "shellscript"],
      [agentWorkflow, "shellscript"],
      ["hugsy mcp", "shellscript"],
      [mcpConfig, "json"],
      [packageConfig, "json"],
      [sourceExample, "swift"],
      [uikitExample, "swift"],
    ]),
  ),
);
await writeFile(
  "generated/syntax.css",
  `${[...palette]
    .map(([colors, name]) => {
      const [light, dark] = colors.split("|");
      return `.${name}{color:light-dark(${light},${dark})}`;
    })
    .join("\n")}\n`,
);
highlighter.dispose();
