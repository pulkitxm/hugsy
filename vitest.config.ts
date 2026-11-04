import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/policy.test.ts", "tests/registry.test.ts"],
    coverage: {
      provider: "v8",
      include: ["scripts/policy.ts", "registry/schema.ts", "registry/catalog.ts"],
      reporter: ["text", "lcov"],
      thresholds: { lines: 90, functions: 95, branches: 85, statements: 90 },
    },
  },
});
