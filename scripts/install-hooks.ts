import { execFileSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";

if (!process.env["CI"] && existsSync(".git") && existsSync(".githooks/pre-commit")) {
  chmodSync(".githooks/pre-commit", 0o755);
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "inherit" });
}
