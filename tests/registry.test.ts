import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import data from "../generated/registry.json";
import { catalog, showcase } from "../registry/catalog";
import { registry as website } from "../registry/registry";
import { componentSchema, registrySchema } from "../registry/schema";

const registry = registrySchema.parse(data);

describe("iOS registry", () => {
  it("has five animated components with UIKit adapters and accurate checksums", () => {
    expect(registry.platform).toBe("ios");
    expect(registry.minimumVersion).toBe("17.0");
    expect(showcase.map((item) => item.name)).toEqual([
      "swipe-deck",
      "parallax-carousel",
      "morphing-capsule",
      "expanding-cards",
      "radial-menu",
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
  it("does not ship binary payloads in the website registry", () => {
    expect(website.components.map((item) => item.name)).toEqual(
      registry.components.map((item) => item.name),
    );
    for (const item of website.components) {
      expect(item.files.every((file) => !("data" in file))).toBe(true);
    }
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
