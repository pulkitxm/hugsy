import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { componentName, componentSchema } from "../registry/schema";
import { getComponent, registry, searchComponents } from "./registry";

export function startMcp() {
  const handle = serveStdio(() => {
    const server = new McpServer(
      { name: "hugsy", version: "0.1.0" },
      {
        instructions:
          "Discover animated SwiftUI components, inspect source, then plan installation. All tools are read-only. Ask permission before replacing customized files. macOS 14+, Swift 6. No third-party Swift dependencies.",
        maxToolInputElements: 100,
      },
    );
    const annotations = {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    };
    server.registerTool(
      "search_components",
      {
        description:
          "Search the offline SwiftUI component registry by name, animation technique, or category.",
        inputSchema: z.object({ query: z.string().max(200).default("") }),
        outputSchema: z.object({ components: z.array(componentSchema.omit({ source: true })) }),
        annotations,
      },
      ({ query }) => {
        const output = {
          components: searchComponents(query).map(({ source: _, ...item }) => item),
        };
        return {
          content: [{ type: "text", text: JSON.stringify(output) }],
          structuredContent: output,
        };
      },
    );
    server.registerTool(
      "get_component",
      {
        description:
          "Get complete editable SwiftUI source, usage, accessibility behavior, and its SHA-256 checksum.",
        inputSchema: z.object({ name: componentName }),
        outputSchema: componentSchema,
        annotations,
      },
      ({ name }) => {
        const output = getComponent(name);
        return {
          content: [{ type: "text", text: JSON.stringify(output) }],
          structuredContent: output,
        };
      },
    );
    server.registerTool(
      "plan_install",
      {
        description:
          "Return source files and safe CLI commands for installation. Does not read or write the filesystem.",
        inputSchema: z.object({ names: z.array(componentName).min(1).max(6) }),
        annotations,
      },
      ({ names }) => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              files: [...new Set(names)].map((name) => getComponent(name)),
              commands: [
                "hugsy init",
                `hugsy add ${names.map((name) => getComponent(name).name).join(" ")} --dry-run --json`,
                `hugsy add ${names.join(" ")}`,
              ],
              warning:
                "Check the deployment target and app target membership. Never use --force without explicit permission.",
            }),
          },
        ],
      }),
    );
    server.registerResource(
      "registry",
      "hugsy://registry",
      { mimeType: "application/json", description: "Complete versioned registry and Swift source" },
      (uri) => ({
        contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(registry) }],
      }),
    );
    for (const item of registry.components) {
      server.registerResource(
        item.name,
        `hugsy://components/${item.name}`,
        { mimeType: "text/x-swift", description: item.description },
        (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/x-swift", text: item.source }] }),
      );
    }
    server.registerPrompt(
      "integrate_component",
      {
        description: "Integration checklist and source for one animated SwiftUI component.",
        argsSchema: z.object({ name: componentName }),
      },
      ({ name }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Integrate ${name} into my macOS app. Inspect the project and deployment target first. Preserve local edits, keep Reduce Motion behavior and native keyboard access. Plan before writing.\n\n${JSON.stringify(getComponent(name))}`,
            },
          },
        ],
      }),
    );
    return server;
  });
  const close = () => {
    void handle.close();
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}
