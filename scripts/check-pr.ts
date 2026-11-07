import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { hasValidPullRequestTitle } from "./check-pr-policy";

const eventPath = process.env["GITHUB_EVENT_PATH"];
if (!eventPath) {
  throw new Error("Missing pull request event.");
}
const event = z
  .object({
    pull_request: z.object({
      title: z.string(),
      body: z.string().nullable(),
      base: z.object({ sha: z.string() }),
      head: z.object({ sha: z.string() }),
    }),
  })
  .parse(JSON.parse(readFileSync(eventPath, "utf8")));
const request = event.pull_request;
if (!hasValidPullRequestTitle(request.title)) {
  throw new Error("Use a conventional pull request title.");
}
const lines = (request.body ?? "").trim().split(/\r?\n/);
if (lines.length !== 1 || !lines[0]?.trim()) {
  throw new Error("The description must be exactly one nonempty line.");
}
const merges = execFileSync(
  "git",
  ["rev-list", "--merges", `${request.base.sha}..${request.head.sha}`],
  { encoding: "utf8" },
).trim();
if (merges) {
  throw new Error("Keep the branch history linear.");
}
process.stdout.write("Pull request policy passed.\n");
