import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parseDocument } from "yaml";

const paths = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter((path) => /\.ya?ml$/.test(path) && existsSync(path));
for (const path of new Set(paths)) {
  const document = parseDocument(readFileSync(path, "utf8"), { uniqueKeys: true, strict: true });
  const diagnostics = [...document.errors, ...document.warnings];
  if (diagnostics.length > 0) {
    throw new Error(`${path}: ${diagnostics.map((error) => error.message).join("\n")}`);
  }
}
process.stdout.write(`Validated ${paths.length} YAML files.\n`);
