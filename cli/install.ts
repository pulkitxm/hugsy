import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import { getComponent } from "./registry";

const directorySchema = z
  .string()
  .max(240)
  .regex(/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/);
const configSchema = z.strictObject({ version: z.literal(1), directory: directorySchema });

function statIfExists(path: string) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function assertRegular(path: string) {
  const stat = statIfExists(path);
  if (stat && (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1)) {
    throw new Error(`Refusing non-regular or linked file: ${path}`);
  }
}

function safeDirectory(root: string, directory: string, create = false) {
  let current = root;
  for (const segment of directorySchema.parse(directory).split("/")) {
    current = join(current, segment);
    let stat = statIfExists(current);
    if (!stat && create) {
      mkdirSync(current);
      stat = lstatSync(current);
    }
    if (stat && (stat.isSymbolicLink() || !stat.isDirectory())) {
      throw new Error(`Unsafe directory: ${current}`);
    }
  }
  return current;
}

export function initialize(cwd: string, directory: string, dryRun = false) {
  const root = realpathSync(resolve(cwd));
  const config = configSchema.parse({ version: 1, directory });
  safeDirectory(root, config.directory);
  const path = join(root, "hugsy.json");
  assertRegular(path);
  if (existsSync(path)) {
    throw new Error("hugsy.json already exists. Edit its directory to change the destination.");
  }
  if (!dryRun) {
    writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
  }
  return { config, dryRun };
}

export function planInstall(cwd: string, names: string[]) {
  if (names.length === 0) {
    throw new Error("Choose at least one component.");
  }
  const root = realpathSync(resolve(cwd));
  const configPath = join(root, "hugsy.json");
  assertRegular(configPath);
  if (!existsSync(configPath)) {
    throw new Error("Run hugsy init first.");
  }
  const config = configSchema.parse(JSON.parse(readFileSync(configPath, "utf8")));
  const directory = safeDirectory(root, config.directory);
  const files = [...new Set(names)].map((name) => {
    const component = getComponent(name);
    const digest = createHash("sha256").update(component.source).digest("hex");
    if (digest !== component.sha256) {
      throw new Error(`Integrity check failed: ${name}`);
    }
    const path = join(directory, component.filename);
    assertRegular(path);
    const previous = existsSync(path) ? readFileSync(path, "utf8") : null;
    let status = "create";
    if (previous !== null) {
      status = previous === component.source ? "unchanged" : "conflict";
    }
    return { name, path, source: component.source, previous, status, sha256: digest };
  });
  return { root, directory: config.directory, files };
}

export function install(
  cwd: string,
  names: string[],
  options: { dryRun: boolean; force: boolean },
) {
  const plan = planInstall(cwd, names);
  const result = {
    dryRun: options.dryRun,
    files: plan.files.map(({ name, path, status, sha256 }) => ({ name, path, status, sha256 })),
  };
  if (options.dryRun) {
    return result;
  }
  if (!options.force && plan.files.some((file) => file.status === "conflict")) {
    throw new Error(
      "Local changes found. No files written. Inspect hugsy diff, then use --force only if you want to replace them.",
    );
  }
  const lock = join(plan.root, ".hugsy-install.lock");
  const descriptor = openSync(lock, "wx");
  let staging: string | undefined;
  const written: typeof plan.files = [];
  try {
    staging = mkdtempSync(join(plan.root, ".hugsy-stage-"));
    const fresh = planInstall(cwd, names);
    if (JSON.stringify(fresh) !== JSON.stringify(plan)) {
      throw new Error("Files changed during installation. Retry.");
    }
    safeDirectory(plan.root, plan.directory, true);
    for (const [index, file] of plan.files.entries()) {
      if (file.status === "unchanged") {
        continue;
      }
      const staged = join(staging, String(index));
      writeFileSync(staged, file.source, { flag: "wx" });
      assertRegular(file.path);
      renameSync(staged, file.path);
      written.push(file);
    }
  } catch (error) {
    for (const file of written.reverse()) {
      if (file.previous === null) {
        rmSync(file.path);
      } else {
        writeFileSync(file.path, file.previous);
      }
    }
    throw error;
  } finally {
    closeSync(descriptor);
    rmSync(lock);
    if (staging) {
      rmSync(staging, { recursive: true });
    }
  }
  return result;
}

export function inspectProject(cwd: string) {
  const root = realpathSync(resolve(cwd));
  const configured = existsSync(join(root, "hugsy.json"));
  if (configured) {
    planInstall(root, ["fluid-tabs"]);
  }
  return {
    configured,
    swiftPackage: existsSync(join(root, "Package.swift")),
    xcodeProject: existsSync(join(root, "project.yml")),
    minimumMacOS: "14.0",
    swift: "6.0",
    note: "Add copied files to your app target in Xcode, or choose a directory inside a Swift package target.",
  };
}
