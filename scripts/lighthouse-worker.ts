import { writeFileSync } from "node:fs";
import { launch } from "chrome-launcher";
import lighthouse, { desktopConfig } from "lighthouse";
import { type AuditJob, isAuditJob, type WorkerReply } from "./lighthouse-types";

const chrome = await launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });

function reply(message: WorkerReply) {
  process.send?.(message);
}

async function audit({ url, formFactor, categories, reportPath }: AuditJob) {
  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: "html", logLevel: "error", onlyCategories: categories },
      formFactor === "desktop" ? desktopConfig : undefined,
    );
    if (!result) {
      throw new Error("Lighthouse returned no result.");
    }
    writeFileSync(reportPath, [result.report].flat().join(""));
    reply({ lhr: result.lhr });
  } catch (error) {
    reply({ error: `${url} ${formFactor}: ${error instanceof Error ? error.message : error}` });
  }
}

process.on("message", (message: unknown) => {
  if (isAuditJob(message)) {
    void audit(message);
  }
});
process.once("disconnect", () => {
  chrome.kill();
  process.exit(0);
});
reply({ ready: true });
