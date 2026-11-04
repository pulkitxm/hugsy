import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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
    expect(JSON.parse(result.stdout).components).toHaveLength(6);
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
      arguments: { name: "fluid-tabs" },
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
        await client.callTool({ name: "search_components", arguments: { query: "toast" } }),
      ),
    ).toContain("toast-stack");
    expect(
      JSON.stringify(
        await client.callTool({ name: "plan_install", arguments: { names: ["expanding-cards"] } }),
      ),
    ).toContain("--dry-run");
    expect((await client.listResources()).resources).toHaveLength(7);
    expect(
      JSON.stringify(await client.readResource({ uri: "hugsy://components/fluid-tabs" })),
    ).toContain("import SwiftUI");
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
