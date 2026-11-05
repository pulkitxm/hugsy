import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { type DefaultTreeAdapterTypes, parse, serialize } from "parse5";
import type { Plugin } from "vite";
import { showcase } from "../registry/catalog";
import { markdownUrl } from "../src/lib/seo";

type Node = DefaultTreeAdapterTypes.Node;
type Element = DefaultTreeAdapterTypes.Element;

const removedClasses = new Set([
  "device-preview",
  "showcase-stage",
  "library-nav",
  "page-toc",
  "page-pager",
  "document-footer",
  "tabs",
  "sr-only",
  "hero-actions",
  "preview-hint",
  "overline",
  "hero-badge",
]);
const labelledCode = new Set(["code-tabs", "source-files"]);

function isElement(node: Node): node is Element {
  return "tagName" in node;
}

function classes(node: Element) {
  return (node.attrs.find((entry) => entry.name === "class")?.value ?? "").split(/\s+/);
}

function find(node: Node, tagName: string): Element | undefined {
  if (isElement(node) && node.tagName === tagName) {
    return node;
  }
  if (!("childNodes" in node)) {
    return undefined;
  }
  for (const child of node.childNodes) {
    const match = find(child, tagName);
    if (match) {
      return match;
    }
  }
  return undefined;
}

function prune(node: Node, keepLabels: boolean) {
  if (!("childNodes" in node)) {
    return;
  }
  node.childNodes = node.childNodes.filter((child) => {
    if (!isElement(child)) {
      return true;
    }
    const names = classes(child);
    if (child.tagName === "button" || names.some((name) => removedClasses.has(name))) {
      return false;
    }
    if (names.includes("code-heading") && !keepLabels) {
      return false;
    }
    if (names.includes("component-meta")) {
      for (const item of child.childNodes.slice(0, -1)) {
        if (isElement(item)) {
          item.childNodes.push({ nodeName: "#text", value: " · ", parentNode: item });
        }
      }
    }
    prune(child, keepLabels || names.some((name) => labelledCode.has(name)));
    return true;
  });
}

export function pageMarkdown(html: string) {
  const main = find(parse(html), "main");
  if (!main) {
    throw new Error("Expected a main element to convert to Markdown.");
  }
  prune(main, false);
  const markdown = NodeHtmlMarkdown.translate(serialize(main), { codeFence: "```" });
  return `${markdown.replace(/\n+```(\n|$)/g, "\n```$1").trim()}\n`;
}

export const sitePaths = [
  "/",
  "/components/",
  "/docs/",
  "/docs/installation/",
  "/docs/cli/",
  "/docs/mcp/",
  "/docs/accessibility/",
  ...showcase.map((item) => `/components/${item.name}/`),
];

export function writeMarkdownPages(root: string) {
  for (const path of sitePaths) {
    const target = join(root, markdownUrl(path));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, pageMarkdown(readFileSync(join(root, path, "index.html"), "utf8")));
  }
}

export function markdownPages(): Plugin {
  return {
    name: "hugsy-markdown-pages",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split("?")[0] ?? "";
        const page = sitePaths.find((candidate) => markdownUrl(candidate) === path);
        const host = request.headers.host;
        if (!page || !host) {
          next();
          return;
        }
        fetch(`http://${host}${page}`)
          .then(async (result) => {
            if (!result.ok) {
              throw new Error(`Unable to render ${page}`);
            }
            response.setHeader("Content-Type", "text/markdown; charset=utf-8");
            response.end(pageMarkdown(await result.text()));
          })
          .catch(next);
      });
    },
  };
}

if (import.meta.main) {
  writeMarkdownPages("dist/client");
}
