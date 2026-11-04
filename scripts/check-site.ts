import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { type DefaultTreeAdapterTypes, parse } from "parse5";
import { catalog } from "../registry/catalog";
import { registrySchema } from "../registry/schema";

const root = "dist/client";
const origin = "https://pulkitxm.github.io/hugsy";
const paths = [
  "/",
  "/components/",
  "/docs/",
  "/docs/installation/",
  "/docs/cli/",
  "/docs/mcp/",
  "/docs/accessibility/",
  ...catalog.map((item) => `/components/${item.name}/`),
];
function elements(node: DefaultTreeAdapterTypes.Node): DefaultTreeAdapterTypes.Element[] {
  const own = "tagName" in node ? [node] : [];
  return "childNodes" in node ? own.concat(node.childNodes.flatMap(elements)) : own;
}
function attribute(node: DefaultTreeAdapterTypes.Element, name: string) {
  return node.attrs.find((entry) => entry.name === name)?.value;
}
const titles = new Set<string>();
for (const path of paths) {
  const html = readFileSync(join(root, path, "index.html"), "utf8");
  const nodes = elements(parse(html));
  const title = nodes.find((node) => node.tagName === "title");
  const text = title?.childNodes.map((node) => ("value" in node ? node.value : "")).join("");
  if (!text || titles.has(text)) {
    throw new Error(`Missing or duplicate title: ${path}`);
  }
  titles.add(text);
  if (nodes.filter((node) => node.tagName === "h1").length !== 1) {
    throw new Error(`Expected one server-rendered H1: ${path}`);
  }
  const description = nodes.find(
    (node) => node.tagName === "meta" && attribute(node, "name") === "description",
  );
  if (((description && attribute(description, "content")?.length) || 0) < 50) {
    throw new Error(`Missing description: ${path}`);
  }
  if (
    !nodes.some(
      (node) =>
        node.tagName === "link" &&
        attribute(node, "rel") === "canonical" &&
        attribute(node, "href") === `${origin}${path}`,
    )
  ) {
    throw new Error(`Invalid canonical: ${path}`);
  }
  for (const node of nodes) {
    for (const key of ["href", "src"]) {
      const value = attribute(node, key);
      if (!value || /^(?:https?:|mailto:|data:)/.test(value)) {
        continue;
      }
      const url = new URL(value, `${origin}${path}`);
      if (!url.pathname.startsWith("/hugsy/")) {
        throw new Error(`Link escapes Pages base: ${value}`);
      }
      const file = join(root, decodeURIComponent(url.pathname.slice("/hugsy/".length)));
      if (!existsSync(file) && !existsSync(join(file, "index.html"))) {
        throw new Error(`Broken local link: ${path} -> ${value}`);
      }
    }
  }
}
registrySchema.parse(JSON.parse(readFileSync(join(root, "r/index.json"), "utf8")));
for (const file of [
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "llms-full.txt",
  ".nojekyll",
  "social.png",
  "404.html",
]) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Missing publish artifact: ${file}`);
  }
}
let javascript = 0;
let css = 0;
for (const file of readdirSync(join(root, "assets"))) {
  const size = gzipSync(readFileSync(join(root, "assets", file))).byteLength;
  if (file.endsWith(".js")) {
    javascript += size;
  }
  if (file.endsWith(".css")) {
    css += size;
  }
}
if (javascript > 200000 || css > 12000) {
  throw new Error(`Asset budget exceeded: JS ${javascript}, CSS ${css}`);
}
process.stdout.write(
  `${paths.length} prerendered pages verified. Gzip budgets: JS ${javascript}/200000, CSS ${css}/12000 bytes.\n`,
);
