import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
await rm("public/.well-known", { recursive: true, force: true });
await mkdir("public/r", { recursive: true });
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
const today = new Date().toISOString().slice(0, 10);
await writeFile(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitePaths.map((path) => `<url><loc>${origin}${path}</loc><lastmod>${today}</lastmod></url>`).join("")}</urlset>\n`,
);
await writeFile("public/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
const guidance =
  "Run hugsy list --json, then hugsy info <name> --json. Inspect the app target and iOS deployment target before installing. Run hugsy add <name> --dry-run --json first, then hugsy add <name>. Never use --force without explicit approval. Installing files does not link the app: add the generated Hugsy package in Xcode, attach HugsyComponents to the app target, and add import HugsyComponents. Installation uses native Swift tooling, never npm.";
const documentation = [
  ["Introduction", "/docs.md", "What Hugsy is and how the pieces fit together."],
  ["Installation", "/docs/installation.md", "CLI setup, Swift packages, source mode, and UIKit."],
  ["CLI", "/docs/cli.md", "Every command, with safe noninteractive workflows."],
  ["MCP", "/docs/mcp.md", "Read-only tools, resources, and host configuration."],
  [
    "Accessibility",
    "/docs/accessibility.md",
    "Reduce Motion, VoiceOver, and gesture alternatives.",
  ],
];
await writeFile(
  "public/llms.txt",
  `# Hugsy\n\n> Animated, source-owned iOS components for iOS 17+ and Swift 6. Every component ships a SwiftUI view and a UIKit view controller, with no third-party runtime dependencies.\n\n${guidance}\n\n## Components\n\n${showcase.map((item) => `- [${item.title}](${origin}/components/${item.name}.md): ${item.description}`).join("\n")}\n\n## Documentation\n\n${documentation.map(([title, path, summary]) => `- [${title}](${origin}${path}): ${summary}`).join("\n")}\n\n## Optional\n\n- [Complete guide](${origin}/llms-full.txt): all component metadata and usage in one file.\n- [JSON registry](${origin}/r/index.json): versioned source files with SHA-256 checksums.\n- [Agent catalog](${origin}/.well-known/ai-catalog.json): the MCP server card and agent skill.\n`,
);
await mkdir("public/.well-known/mcp", { recursive: true });
await mkdir("public/.well-known/agent-skills/hugsy", { recursive: true });
await writeFile(
  "public/.well-known/mcp/server-card.json",
  `${JSON.stringify(
    {
      name: "hugsy",
      title: "Hugsy",
      description:
        "Read-only search, Swift source, and installation planning for Hugsy iOS components.",
      documentationUrl: `${origin}/docs/mcp/`,
      transport: { type: "stdio", command: "hugsy", args: ["mcp"] },
      install: `${origin}/install.sh`,
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  "public/.well-known/agent-skills/hugsy/SKILL.md",
  `---\nname: hugsy\ndescription: Add animated SwiftUI and UIKit components to an iOS app with the Hugsy CLI.\n---\n\n# Hugsy\n\n${guidance}\n\nInstall the CLI with \`curl -fsSL ${origin}/install.sh | sh\`. Start \`hugsy mcp\` for read-only tools over stdio. The local CLI performs writes, not the MCP server.\n\nComponents: ${showcase.map((item) => item.name).join(", ")}.\n`,
);
await writeFile(
  "public/.well-known/ai-catalog.json",
  `${JSON.stringify(
    {
      specVersion: "1.0",
      entries: [
        {
          identifier: "urn:air:hugsy.pulkit.page:mcp:hugsy",
          displayName: "Hugsy MCP server",
          description: "Search components, read Swift source, and plan installations.",
          type: "application/mcp-server-card+json",
          url: `${origin}/.well-known/mcp/server-card.json`,
          representativeQueries: [
            "Find an animated SwiftUI component",
            "Read the source of an iOS swipe deck",
            "Plan installing a UIKit view controller component",
          ],
        },
        {
          identifier: "urn:air:hugsy.pulkit.page:skill:hugsy",
          displayName: "Add Hugsy components",
          description: "Install animated iOS components safely with the Hugsy CLI.",
          type: 'text/markdown; profile="urn:air:agent-skills"',
          url: `${origin}/.well-known/agent-skills/hugsy/SKILL.md`,
          representativeQueries: [
            "Add an animated component to my iOS app",
            "Install a SwiftUI or UIKit component with a CLI",
          ],
        },
      ],
    },
    null,
    2,
  )}\n`,
);
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
