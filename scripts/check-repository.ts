import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { checkPolicy } from "./policy";

const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter((path) => path.length > 0 && lstatSync(path, { throwIfNoEntry: false }) !== undefined);
const failures: string[] = [];
for (const path of files) {
  if (lstatSync(path).isSymbolicLink()) {
    failures.push(`${path}: Tracked symlinks are not allowed`);
    continue;
  }
  if (/\.(?:webp|jpg|png|mp4)$/.test(path)) {
    if (lstatSync(path).size > 6000000) {
      failures.push(`${path}: Media exceeds 6 MB`);
    }
    continue;
  }
  const content = readFileSync(path, "utf8");
  for (const error of checkPolicy(path, content)) {
    failures.push(`${path}: ${error}`);
  }
}
for (const required of [
  "LICENSE",
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "SUPPORT.md",
  "AGENTS.md",
  ".github/CODEOWNERS",
]) {
  if (!files.includes(required)) {
    failures.push(`Missing required file: ${required}`);
  }
}
if (failures.length > 0) {
  throw new Error(failures.join("\n"));
}
process.stdout.write(`Repository policy passed for ${files.length} files.\n`);
