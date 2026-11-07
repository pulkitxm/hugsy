import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { ConformanceTester } from "lighthouse/third-party/ard/ard.js";
import { describe, expect, it } from "vitest";
import { components as website } from "../generated/components";
import data from "../generated/registry.json";
import { catalog, showcase } from "../registry/catalog";
import { componentSchema, registrySchema } from "../registry/schema";
import { demos } from "../src/demos/registry";

const registry = registrySchema.parse(data);

describe("iOS registry", () => {
  it("has six animated components with UIKit adapters and accurate checksums", () => {
    expect(registry.platform).toBe("ios");
    expect(registry.minimumVersion).toBe("17.0");
    expect(showcase.map((item) => item.name)).toEqual([
      "swipe-deck",
      "parallax-carousel",
      "morphing-capsule",
      "expanding-cards",
      "radial-menu",
      "stacked-cards",
    ]);
    expect(catalog.filter((item) => item.category === "Infrastructure")).toHaveLength(1);
    for (const item of registry.components) {
      const source = readFileSync(`registry/swift/${item.filename}`, "utf8");
      expect(item.source).toBe(source);
      expect(item.frameworks).toEqual(["SwiftUI", "UIKit"]);
      for (const file of item.files) {
        const data = readFileSync(`registry/swift/${file.path}`);
        expect(file.data).toBe(data.toString("base64"));
        expect(file.sha256).toBe(createHash("sha256").update(data).digest("hex"));
      }
      expect(createHash("sha256").update(source).digest("hex")).toBe(item.sha256);
    }
    for (const item of showcase) {
      const source = readFileSync(`registry/swift/${item.filename}`, "utf8");
      expect(source).toContain("accessibilityReduceMotion");
      expect(item.states.length).toBeGreaterThan(2);
      expect(item.dependencies).toEqual(["uikit-bridge"]);
      expect(item.uikitUsage).toContain("ViewController");
      const adapter = item.filename.replace(".swift", "ViewController.swift");
      expect(item.files.map((file) => file.path)).toEqual([item.filename, adapter]);
      expect(readFileSync(`registry/swift/${adapter}`, "utf8")).toMatch(/^#if canImport\(UIKit\)/);
    }
  });
  it("ships only showcase summaries to every page and full source to each component page", async () => {
    expect(website.map((item) => item.name)).toEqual(showcase.map((item) => item.name));
    for (const item of website) {
      expect(Object.keys(item)).not.toContain("files");
      const { page } = await import(`../generated/pages/${item.name}.ts`);
      const entry = registry.components.find((candidate) => candidate.name === item.name);
      expect(page.sources.map((file: { path: string }) => file.path)).toEqual(
        entry?.files.map((file) => file.path),
      );
      expect(Object.keys(page.highlights)).toContain(page.usage);
      expect(Object.keys(page.highlights)).toContain(page.uikitUsage);
      expect(JSON.stringify(page)).not.toContain("sha256");
    }
  });
  it("registers an interactive device demo for every showcase component", () => {
    expect(Object.keys(demos)).toEqual(showcase.map((item) => item.name));
    for (const screens of Object.values(demos)) {
      expect(screens.length).toBeGreaterThan(0);
      expect(new Set(screens.map((screen) => screen.id)).size).toBe(screens.length);
    }
  });
  it("publishes an agent catalog that passes the Lighthouse validator", () => {
    const tester = new ConformanceTester();
    const valid = tester.validate_manifest(
      readFileSync("public/.well-known/ai-catalog.json", "utf8"),
      "ai-catalog.json",
    );
    expect(tester.errors).toEqual([]);
    expect(tester.warnings).toEqual([]);
    expect(valid).toBe(true);
  });
  it("rejects malformed, unknown, and unsafe registry fields", () => {
    expect(() => registrySchema.parse({ ...registry, version: 1 })).toThrow();
    expect(() => registrySchema.parse({ ...registry, platform: "web" })).toThrow();
    expect(() => registrySchema.parse({ ...registry, extra: true })).toThrow();
    const item = registry.components[0];
    expect(() => componentSchema.parse({ ...item, filename: "../outside.swift" })).toThrow();
    expect(() => componentSchema.parse({ ...item, sha256: "broken" })).toThrow();
  });
  it("accepts Apple framework requirements and rejects invalid dependency graphs", () => {
    const item = registry.components[0];
    if (!item) {
      throw new Error("Missing fixture");
    }
    expect(
      componentSchema.parse({ ...item, frameworks: ["UIKit", "Foundation", "MapKit"] }).frameworks,
    ).toContain("UIKit");
    for (const components of [
      [item, item],
      [{ ...item, dependencies: [item.name] }],
      [{ ...item, dependencies: ["missing"] }],
      [{ ...item, files: [] }],
      [{ ...item, files: [...item.files, ...item.files] }],
    ]) {
      expect(() => registrySchema.parse({ ...registry, components })).toThrow();
    }
  });
});
