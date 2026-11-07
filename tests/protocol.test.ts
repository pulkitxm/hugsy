import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { describe, expect, it } from "vitest";

const executable = resolve(process.env["HUGSY_BINARY"] ?? ".build/debug/hugsy");
describe("native Swift CLI", () => {
  it("runs offline without a JavaScript runtime and emits parseable JSON", () => {
    const result = spawnSync(executable, ["list", "--json"], {
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).components).toHaveLength(7);
  });
  it("supports the complete noninteractive installation workflow", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hugsy-cli-"));
    try {
      for (const args of [
        ["init", "--dry-run"],
        ["init"],
        ["add", "expanding-cards", "--dry-run"],
        ["add", "expanding-cards"],
        ["diff", "expanding-cards"],
        ["doctor"],
        ["info", "expanding-cards"],
      ]) {
        const result = spawnSync(executable, [...args, "--cwd", cwd, "--json"], {
          encoding: "utf8",
        });
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);
        expect(() => {
          JSON.parse(result.stdout);
        }).not.toThrow();
      }
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
  it("returns structured failures and a nonzero exit code", () => {
    const result = spawnSync(executable, ["info", "unknown", "--json"], {
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr).error.message).toContain("Unknown component");
    expect(result.stdout).toBe("");
  });
  it("creates a local package, retains selections, and reports integration and conflicts", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hugsy-package-"));
    const run = (...args: string[]) =>
      spawnSync(executable, [...args, "--cwd", cwd, "--json"], { encoding: "utf8" });
    try {
      expect(run("init").status).toBe(0);
      const planned = JSON.parse(run("add", "swipe-deck", "--dry-run").stdout);
      expect(planned.distribution).toBe("package");
      expect(planned.instructions.join(" ")).toContain("import HugsyComponents");
      expect(existsSync(join(cwd, "Hugsy"))).toBe(false);
      expect(run("add", "swipe-deck").status).toBe(0);
      expect(run("add", "morphing-capsule").status).toBe(0);
      expect(readFileSync(join(cwd, "Hugsy", "Package.swift"), "utf8")).toContain(
        "HugsyComponents",
      );
      const source = join(
        cwd,
        "Hugsy",
        "Sources",
        "HugsyComponents",
        "swipe-deck",
        "HugsySwipeDeck.swift",
      );
      writeFileSync(source, "local edits\n");
      const doctor = JSON.parse(run("doctor").stdout);
      expect(doctor.conflicts).toContain("Sources/HugsyComponents/swipe-deck/HugsySwipeDeck.swift");
      expect(doctor.targetLinkage).toContain("Not inspected");
      expect(run("add", "swipe-deck").status).toBe(1);
      expect(readFileSync(source, "utf8")).toBe("local edits\n");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
  it("supports explicit source distribution without a fabricated import module", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hugsy-source-"));
    try {
      expect(
        spawnSync(executable, [
          "init",
          "--distribution",
          "source",
          "--directory",
          "App/UI",
          "--cwd",
          cwd,
        ]).status,
      ).toBe(0);
      const result = spawnSync(executable, ["add", "swipe-deck", "--cwd", cwd, "--json"], {
        encoding: "utf8",
      });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).instructions.join(" ")).toContain(
        "Do not import the directory name",
      );
      expect(existsSync(join(cwd, "App/UI/HugsySwipeDeck.swift"))).toBe(true);
      expect(existsSync(join(cwd, "App/UI/Package.swift"))).toBe(false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

it("negotiates MCP and serves tools, resources, prompts, validation, and errors", async () => {
  const client = new Client({ name: "hugsy-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: executable,
    args: ["mcp"],
  });
  try {
    await client.connect(transport);
    expect(client.getServerVersion()?.name).toBe("hugsy");
    expect((await client.listTools()).tools.map((tool) => tool.name)).toEqual([
      "search_components",
      "get_component",
      "plan_install",
    ]);
    const source = await client.callTool({
      name: "get_component",
      arguments: { name: "swipe-deck" },
    });
    expect(source.isError).not.toBe(true);
    expect(JSON.stringify(source)).toContain("import SwiftUI");
    expect(
      (await client.callTool({ name: "get_component", arguments: { name: "../outside" } })).isError,
    ).toBe(true);
    expect(
      (await client.callTool({ name: "get_component", arguments: { name: "unknown" } })).isError,
    ).toBe(true);
    expect(
      JSON.stringify(
        await client.callTool({ name: "search_components", arguments: { query: "morphing" } }),
      ),
    ).toContain("morphing-capsule");
    expect(
      JSON.stringify(
        await client.callTool({ name: "plan_install", arguments: { names: ["expanding-cards"] } }),
      ),
    ).toContain("--dry-run");
    expect(
      JSON.stringify(
        await client.callTool({ name: "plan_install", arguments: { names: ["expanding-cards"] } }),
      ),
    ).toContain("import HugsyComponents");
    expect((await client.listResources()).resources).toHaveLength(7);
    expect(
      JSON.stringify(await client.readResource({ uri: "hugsy://components/swipe-deck" })),
    ).toContain("import SwiftUI");
    expect(
      (await client.readResource({ uri: "hugsy://components/swipe-deck" })).contents[0]?.mimeType,
    ).toBe("application/json");
    expect(JSON.stringify(await client.readResource({ uri: "hugsy://registry" }))).toContain(
      "expanding-cards",
    );
    expect((await client.listPrompts()).prompts).toHaveLength(1);
    expect(
      JSON.stringify(
        await client.getPrompt({
          name: "integrate_component",
          arguments: { name: "expanding-cards" },
        }),
      ),
    ).toContain("Reduce Motion");
  } finally {
    await client.close();
  }
}, 20000);
