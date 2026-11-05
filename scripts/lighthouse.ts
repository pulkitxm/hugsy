import { type ChildProcess, fork, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { Result } from "lighthouse";
import { siteOrigin } from "../registry/site";
import { type FormFactor, isWorkerReply, type WorkerReply } from "./lighthouse-types";
import { sitePaths } from "./markdown-pages";

const { values } = parseArgs({
  options: {
    route: { type: "string", multiple: true, default: [] },
    "form-factor": { type: "string", multiple: true, default: ["mobile", "desktop"] },
    concurrency: { type: "string", default: "4" },
    "min-score": { type: "string", default: "100" },
    production: { type: "boolean", default: false },
  },
});

const categories = ["performance", "accessibility", "best-practices", "seo", "agentic-browsing"];
const metrics = [
  ["first-contentful-paint", "FCP"],
  ["largest-contentful-paint", "LCP"],
  ["total-blocking-time", "TBT"],
  ["cumulative-layout-shift", "CLS"],
];
const minimumScore = Number.parseInt(values["min-score"], 10);
const formFactors = values["form-factor"].filter(
  (value): value is FormFactor => value === "mobile" || value === "desktop",
);
const port = 4176;
const origin = values.production ? siteOrigin : `http://127.0.0.1:${port}`;
const routes = values.route.length > 0 ? values.route : sitePaths;
const runId = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replace(/\.\d+Z$/, "Z");
const output = join(".lighthouse", runId);
mkdirSync(join(output, "html"), { recursive: true });
mkdirSync(join(output, "pages"), { recursive: true });

type Run = { route: string; formFactor: FormFactor; lhr: Result };

function slug(route: string) {
  return route.replaceAll("/", "-").replace(/^-|-$/g, "") || "home";
}

function score(lhr: Result, category: string) {
  const value = lhr.categories[category]?.score;
  return value === null || value === undefined ? null : Math.round(value * 100);
}

function failures(lhr: Result) {
  return categories.flatMap((category) =>
    (lhr.categories[category]?.auditRefs ?? []).flatMap((reference) => {
      const audit = lhr.audits[reference.id];
      const failing =
        audit &&
        reference.weight > 0 &&
        audit.score !== null &&
        audit.score < 1 &&
        audit.scoreDisplayMode !== "informative";
      return failing
        ? [`${category}: ${audit.title} (${Math.round((audit.score ?? 0) * 100)})`]
        : [];
    }),
  );
}

function ready(worker: ChildProcess) {
  return new Promise<void>((resolve) => {
    worker.once("message", () => resolve());
  });
}

function send(worker: ChildProcess, job: object) {
  return new Promise<WorkerReply>((resolve, reject) => {
    worker.once("message", (message: unknown) => {
      if (isWorkerReply(message)) {
        resolve(message);
      } else {
        reject(new Error("Unexpected Lighthouse worker message."));
      }
    });
    worker.send(job);
  });
}

const server = values.production
  ? null
  : spawn("bun", [join("scripts", "serve.ts")], {
      env: { ...process.env, HUGSY_PORT: String(port) },
      stdio: "ignore",
    });
await new Promise((resolve) => setTimeout(resolve, values.production ? 0 : 500));

const jobs = routes.flatMap((route) => formFactors.map((formFactor) => ({ route, formFactor })));
const total = jobs.length;
const count = Math.min(Number.parseInt(values.concurrency, 10), total);
const workers = Array.from({ length: count }, () => fork("scripts/lighthouse-worker.ts"));
const runs: Run[] = [];
const errors: string[] = [];

try {
  await Promise.all(
    workers.map(async (worker) => {
      await ready(worker);
      await send(worker, {
        url: new URL(routes[0] ?? "/", origin).href,
        formFactor: "mobile",
        categories,
        reportPath: join(process.cwd(), output, "warmup.html"),
      });
      for (let job = jobs.shift(); job; job = jobs.shift()) {
        const { route, formFactor } = job;
        const name = `${slug(route)}-${formFactor}`;
        const answer = await send(worker, {
          url: new URL(route, origin).href,
          formFactor,
          categories,
          reportPath: join(process.cwd(), output, "html", `${name}.html`),
        });
        if ("error" in answer) {
          errors.push(answer.error);
        } else if ("lhr" in answer) {
          const { lhr } = answer;
          runs.push({ route, formFactor, lhr });
          writeFileSync(join(output, "pages", `${name}.json`), JSON.stringify(lhr));
          process.stdout.write(
            `[${runs.length}/${total}] ${route} ${formFactor}: ${categories.map((category) => score(lhr, category) ?? "n/a").join(" / ")}\n`,
          );
        }
      }
    }),
  );
} finally {
  for (const worker of workers) {
    worker.disconnect();
  }
  server?.kill();
}

runs.sort((a, b) => a.route.localeCompare(b.route) || a.formFactor.localeCompare(b.formFactor));
const rows = runs.map(({ route, formFactor, lhr }) => {
  const values = metrics.map(([id]) => lhr.audits[id ?? ""]?.displayValue ?? "n/a");
  const scores = categories.map((category) => score(lhr, category) ?? "n/a");
  return `| ${route} | ${formFactor} | ${scores.join(" | ")} | ${values.join(" | ")} |`;
});
const below = runs.flatMap(({ route, formFactor, lhr }) =>
  categories.flatMap((category) => {
    const actual = score(lhr, category);
    return actual === null || actual < minimumScore
      ? [`${route} ${formFactor} ${category}: ${actual ?? "n/a"} < ${minimumScore}`]
      : [];
  }),
);
const issues = runs.flatMap(({ route, formFactor, lhr }) =>
  failures(lhr).map((issue) => `- ${route} ${formFactor}: ${issue}`),
);
writeFileSync(
  join(output, "README.md"),
  `# Lighthouse ${runId}\n\n${origin}, ${runs.length} runs, target ${minimumScore}.\n\n| Page | Device | Performance | Accessibility | Best practices | SEO | ${metrics.map(([, label]) => label).join(" | ")} |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\n## Issues\n\n${issues.join("\n") || "None."}\n`,
);
writeFileSync(
  join(output, "run.json"),
  `${JSON.stringify({ runId, origin, below, errors }, null, 2)}\n`,
);
for (const line of [...errors, ...below, ...new Set(issues)]) {
  process.stderr.write(`${line}\n`);
}
process.stdout.write(`Report: ${join(output, "README.md")}\n`);
process.exit(errors.length > 0 || below.length > 0 ? 1 : 0);
