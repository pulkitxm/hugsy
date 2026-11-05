import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sitePaths } from "./markdown-pages";

const preloadPattern = /<link rel="modulepreload" href="([^"]+)"[^>]*\/?>/g;
const entryPattern = /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/;

export function deferHydration(html: string) {
  const entry = html.match(entryPattern);
  if (!entry?.[1]) {
    throw new Error("Expected a module entry script to defer.");
  }
  const preloads = [...html.matchAll(preloadPattern)].flatMap((match) => match[1] ?? []);
  const loader = `<script>(function(){var d;function g(){if(d)return;d=1;${JSON.stringify(preloads)}.forEach(function(h){var l=document.createElement("link");l.rel="modulepreload";l.href=h;document.head.append(l)});var s=document.createElement("script");s.type="module";s.src=${JSON.stringify(entry[1])};document.head.append(s)}new PerformanceObserver(function(){setTimeout(g,60)}).observe({type:"paint",buffered:true});setTimeout(g,800)})()</script>`;
  return html.replace(preloadPattern, "").replace(entryPattern, loader);
}

if (import.meta.main) {
  for (const path of sitePaths) {
    const file = join("dist/client", path, "index.html");
    writeFileSync(file, deferHydration(readFileSync(file, "utf8")));
  }
}
