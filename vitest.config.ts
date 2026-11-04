import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["cli/install.ts", "cli/registry.ts", "registry/schema.ts"],
      reporter: ["text", "lcov"],
      thresholds: { lines: 90, functions: 95, branches: 85, statements: 90 },
    },
  },
});
