import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { type DefaultTreeAdapterTypes, parse } from "parse5";
import { showcase } from "../registry/catalog";
import { registrySchema } from "../registry/schema";
import { siteOrigin as origin } from "../registry/site";

const root = "dist/client";
const paths = [
  "/",
  "/components/",
  "/docs/",
  "/docs/installation/",
  "/docs/cli/",
  "/docs/mcp/",
  "/docs/accessibility/",
  ...showcase.map((item) => `/components/${item.name}/`),
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
      if (url.origin !== origin) {
        throw new Error(`Unexpected protocol-relative link: ${value}`);
      }
      const file = join(root, decodeURIComponent(url.pathname.slice(1)));
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
  "CNAME",
]) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Missing publish artifact: ${file}`);
  }
}
if (readFileSync(join(root, "CNAME"), "utf8").trim() !== new URL(origin).hostname) {
  throw new Error("Pages domain does not match canonical origin");
}
const budget = { page: 125000, chunk: 30000, css: 12000 };
const gzipped = new Map(
  readdirSync(join(root, "assets")).map((file) => [
    file,
    gzipSync(readFileSync(join(root, "assets", file))).byteLength,
  ]),
);
const css = [...gzipped].reduce(
  (total, [file, size]) => total + (file.endsWith(".css") ? size : 0),
  0,
);
let heaviestPage = 0;
const initial = new Set<string>();
for (const path of paths) {
  const html = readFileSync(join(root, path, "index.html"), "utf8");
  const scripts = new Set(html.match(/assets\/[\w.-]+\.js/g) ?? []);
  const size = [...scripts].reduce((total, script) => {
    initial.add(script.slice("assets/".length));
    return total + (gzipped.get(script.slice("assets/".length)) ?? 0);
  }, 0);
  if (size > budget.page) {
    throw new Error(`Initial JavaScript budget exceeded on ${path}: ${size}`);
  }
  heaviestPage = Math.max(heaviestPage, size);
}
for (const [file, size] of gzipped) {
  if (file.endsWith(".js") && !initial.has(file) && size > budget.chunk) {
    throw new Error(`Lazy chunk budget exceeded: ${file} ${size}`);
  }
}
if (css > budget.css) {
  throw new Error(`CSS budget exceeded: ${css}`);
}
process.stdout.write(
  `${paths.length} prerendered pages verified. Gzip budgets: initial JS ${heaviestPage}/${budget.page} on the heaviest page, lazy chunks under ${budget.chunk}, CSS ${css}/${budget.css} bytes.\n`,
);
