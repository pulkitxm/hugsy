import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sitePaths } from "./markdown-pages";

const preloadPattern = /<link rel="modulepreload" href="([^"]+)"[^>]*\/?>/g;
const entryPattern = /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/;

const unsafeScriptCharacters: Record<string, string> = {
  "<": "\\u003C",
  ">": "\\u003E",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

function scriptLiteral(value: unknown) {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) => unsafeScriptCharacters[character] ?? "",
  );
}

export function deferHydration(html: string) {
  const entry = html.match(entryPattern);
  if (!entry?.[1]) {
    throw new Error("Expected a module entry script to defer.");
  }
  const preloads = [...html.matchAll(preloadPattern)].flatMap((match) => match[1] ?? []);
  const loader = `<script>(function(){var d;function g(){if(d)return;d=1;${scriptLiteral(preloads)}.forEach(function(h){var l=document.createElement("link");l.rel="modulepreload";l.href=h;document.head.append(l)});var s=document.createElement("script");s.type="module";s.src=${scriptLiteral(entry[1])};document.head.append(s)}new PerformanceObserver(function(){setTimeout(g,60)}).observe({type:"paint",buffered:true});setTimeout(g,800)})()</script>`;
  return html.replace(preloadPattern, "").replace(entryPattern, loader);
}

const stylesheetPattern = /<link rel="stylesheet" href="([^"]+)"([^>]*)\/>/;

export function inlineStylesheet(html: string, read: (path: string) => string) {
  const stylesheet = html.match(stylesheetPattern);
  if (!stylesheet?.[1]) {
    throw new Error("Expected a stylesheet to inline.");
  }
  const deferred = `<style>${read(stylesheet[1])}</style><link rel="stylesheet" href="${stylesheet[1]}"${stylesheet[2]} media="print" onload="this.media='all'"/>`;
  return html.replace(stylesheetPattern, () => deferred);
}

if (import.meta.main) {
  const root = "dist/client";
  const read = (path: string) => readFileSync(join(root, path), "utf8");
  for (const path of sitePaths) {
    const file = join(root, path, "index.html");
    writeFileSync(file, inlineStylesheet(deferHydration(readFileSync(file, "utf8")), read));
  }
}
