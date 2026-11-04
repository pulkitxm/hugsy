import { createHash } from "node:crypto";
import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialize, inspectProject, install, planInstall } from "../cli/install";
import { getComponent, registry, searchComponents } from "../cli/registry";
import { registrySchema } from "../registry/schema";

vi.mock("node:fs", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:fs")>();
  return { ...original, renameSync: vi.fn(original.renameSync) };
});

const roots: string[] = [];
function project() {
  const root = mkdtempSync(join(tmpdir(), "hugsy-test-"));
  roots.push(root);
  return root;
}
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("registry", () => {
  it("has six standalone components with valid hashes and documented states", () => {
    expect(registry.components).toHaveLength(6);
    for (const item of registry.components) {
      expect(createHash("sha256").update(item.source).digest("hex")).toBe(item.sha256);
      expect(item.source).toContain("accessibilityReduceMotion");
      expect(item.states.length).toBeGreaterThan(2);
      expect(item.source).toContain("import SwiftUI");
    }
  });
  it("searches case-insensitively with multiple terms", () => {
    expect(searchComponents("SPRING navigation").map((item) => item.name)).toContain(
      "magnifying-dock",
    );
    expect(searchComponents("nothing-matches")).toEqual([]);
    expect(searchComponents()).toHaveLength(6);
    expect(searchComponents(" ")).toHaveLength(6);
  });
  it("rejects unknown names and invalid schemas", () => {
    expect(() => getComponent("../secrets")).toThrow("Unknown component");
    expect(() => registrySchema.parse({ ...registry, version: 2 })).toThrow();
    expect(() => registrySchema.parse({ ...registry, unexpected: true })).toThrow();
  });
});

describe("installer", () => {
  it("initializes with validated nested paths, and never replaces config", () => {
    const root = project();
    expect(initialize(root, "Sources/UI", true).dryRun).toBe(true);
    expect(existsSync(join(root, "hugsy.json"))).toBe(false);
    initialize(root, "Sources/UI");
    expect(() => initialize(root, "Other")).toThrow("already exists");
    expect(inspectProject(root).configured).toBe(true);
    expect(existsSync(join(root, "Sources"))).toBe(false);
  });
  it.each(["../outside", "/absolute", "", "Sources/../Secrets", "a\\b", ".", "a//b"])(
    "rejects unsafe directory %s",
    (directory) => {
      expect(() => initialize(project(), directory)).toThrow();
    },
  );
  it("requires initialization and nonempty selections", () => {
    const root = project();
    expect(inspectProject(root).configured).toBe(false);
    expect(() => planInstall(root, [])).toThrow("at least one");
    expect(() => planInstall(root, ["fluid-tabs"])).toThrow("init first");
  });
  it("installs exactly the source, deduplicates, and is idempotent", () => {
    const root = project();
    initialize(root, "Sources/UI");
    const options = { dryRun: false, force: false };
    const result = install(root, ["fluid-tabs", "fluid-tabs", "card-stack"], options);
    expect(result.files).toHaveLength(2);
    expect(readFileSync(join(root, "Sources/UI/HugsyFluidTabs.swift"), "utf8")).toBe(
      getComponent("fluid-tabs").source,
    );
    expect(install(root, ["fluid-tabs"], options).files[0]?.status).toBe("unchanged");
    expect(existsSync(join(root, ".hugsy-install.lock"))).toBe(false);
  });
  it("dry runs create no files or directories", () => {
    const root = project();
    initialize(root, "Hugsy");
    expect(install(root, ["fluid-tabs"], { dryRun: true, force: false }).files[0]?.status).toBe(
      "create",
    );
    expect(existsSync(join(root, "Hugsy"))).toBe(false);
  });
  it("preflights the full batch before writing and preserves local changes", () => {
    const root = project();
    initialize(root, "Hugsy");
    install(root, ["fluid-tabs"], { dryRun: false, force: false });
    const path = join(root, "Hugsy/HugsyFluidTabs.swift");
    writeFileSync(path, "custom source\n");
    expect(() =>
      install(root, ["card-stack", "fluid-tabs"], { dryRun: false, force: false }),
    ).toThrow("Local changes");
    expect(existsSync(join(root, "Hugsy/HugsyCardStack.swift"))).toBe(false);
    expect(readFileSync(path, "utf8")).toBe("custom source\n");
    expect(planInstall(root, ["fluid-tabs"]).files[0]?.status).toBe("conflict");
    install(root, ["fluid-tabs"], { dryRun: false, force: true });
    expect(readFileSync(path, "utf8")).toBe(getComponent("fluid-tabs").source);
    expect(() =>
      install(root, ["toast-stack", "unknown"], { dryRun: false, force: false }),
    ).toThrow("Unknown component");
    expect(existsSync(join(root, "Hugsy/HugsyToastStack.swift"))).toBe(false);
  });
  it("rejects symlinked, dangling, directory, and hard-linked config files", () => {
    for (const kind of ["symlink", "dangling", "directory", "hardlink"]) {
      const root = project();
      const external = project();
      const target = join(external, "config");
      writeFileSync(target, '{"version":1,"directory":"UI"}');
      const path = join(root, "hugsy.json");
      if (kind === "directory") {
        mkdirSync(path);
      } else if (kind === "hardlink") {
        linkSync(target, path);
      } else {
        symlinkSync(kind === "dangling" ? join(external, "missing") : target, path);
      }
      expect(() => planInstall(root, ["fluid-tabs"])).toThrow("Refusing");
    }
  });
  it("rejects destination symlinks including dangling links", () => {
    for (const dangling of [true, false]) {
      const root = project();
      const outside = project();
      initialize(root, "UI");
      symlinkSync(dangling ? join(outside, "missing") : outside, join(root, "UI"));
      expect(() => install(root, ["fluid-tabs"], { dryRun: false, force: true })).toThrow(
        "Unsafe directory",
      );
    }
  });
  it("rejects file symlinks and directories even with force", () => {
    const root = project();
    initialize(root, "UI");
    mkdirSync(join(root, "UI"));
    const path = join(root, "UI/HugsyFluidTabs.swift");
    symlinkSync(join(root, "missing"), path);
    expect(() => install(root, ["fluid-tabs"], { dryRun: false, force: true })).toThrow("Refusing");
    rmSync(path);
    mkdirSync(path);
    expect(() => install(root, ["fluid-tabs"], { dryRun: false, force: true })).toThrow("Refusing");
  });
  it("rejects malformed and unknown config keys", () => {
    const root = project();
    for (const content of [
      "broken",
      '{"version":1,"directory":"../outside"}',
      '{"version":1,"directory":"UI","extra":true}',
    ]) {
      writeFileSync(join(root, "hugsy.json"), content);
      expect(() => planInstall(root, ["fluid-tabs"])).toThrow();
    }
  });
  it("does not steal a concurrent installation lock", () => {
    const root = project();
    initialize(root, "UI");
    writeFileSync(join(root, ".hugsy-install.lock"), "");
    expect(() => install(root, ["fluid-tabs"], { dryRun: false, force: false })).toThrow();
    expect(existsSync(join(root, "UI"))).toBe(false);
  });
  it("rolls back both new and replaced files after a write failure", () => {
    const root = project();
    initialize(root, "UI");
    install(root, ["fluid-tabs"], { dryRun: false, force: false });
    const path = join(root, "UI/HugsyFluidTabs.swift");
    writeFileSync(path, "local\n");
    const original = vi.mocked(renameSync).getMockImplementation();
    if (!original) {
      throw new Error("Missing rename implementation");
    }
    vi.mocked(renameSync)
      .mockImplementationOnce(original)
      .mockImplementationOnce(original)
      .mockImplementationOnce(() => {
        throw new Error("Synthetic write failure");
      });
    expect(() =>
      install(root, ["card-stack", "fluid-tabs", "toast-stack"], { dryRun: false, force: true }),
    ).toThrow("Synthetic write failure");
    expect(readFileSync(path, "utf8")).toBe("local\n");
    expect(existsSync(join(root, "UI/HugsyCardStack.swift"))).toBe(false);
    expect(existsSync(join(root, ".hugsy-install.lock"))).toBe(false);
  });
});
