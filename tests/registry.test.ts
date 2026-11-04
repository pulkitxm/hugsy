import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalog } from "../registry/catalog";
import { registry } from "../registry/registry";
import { componentSchema, registrySchema } from "../registry/schema";

describe("iOS registry", () => {
  it("has six source-owned iOS components with accurate checksums", () => {
    expect(registry.platform).toBe("ios");
    expect(registry.minimumVersion).toBe("17.0");
    expect(catalog).toHaveLength(6);
    for (const item of registry.components) {
      const source = readFileSync(`registry/swift/${item.filename}`, "utf8");
      expect(item.source).toBe(source);
      expect(createHash("sha256").update(source).digest("hex")).toBe(item.sha256);
      expect(source).toContain("accessibilityReduceMotion");
      expect(item.states.length).toBeGreaterThan(2);
    }
  });
  it("rejects malformed, unknown, and unsafe registry fields", () => {
    expect(() => registrySchema.parse({ ...registry, version: 2 })).toThrow();
    expect(() => registrySchema.parse({ ...registry, platform: "web" })).toThrow();
    expect(() => registrySchema.parse({ ...registry, extra: true })).toThrow();
    const item = registry.components[0];
    expect(() => componentSchema.parse({ ...item, filename: "../outside.swift" })).toThrow();
    expect(() => componentSchema.parse({ ...item, sha256: "broken" })).toThrow();
  });
});
