import { components } from "../../generated/components";

type ToolResult = { content: { type: "text"; text: string }[] };
type ToolInput = Record<string, unknown>;
type WebTool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: ToolInput) => Promise<ToolResult>;
};
type ModelContext = { registerTool: (tool: WebTool) => unknown };

const documentationPages = ["introduction", "installation", "cli", "mcp", "accessibility"];
const pagePaths: Record<string, string> = {
  introduction: "/docs.md",
  installation: "/docs/installation.md",
  cli: "/docs/cli.md",
  mcp: "/docs/mcp.md",
  accessibility: "/docs/accessibility.md",
};

function text(value: string): ToolResult {
  return { content: [{ type: "text", text: value }] };
}

async function readMarkdown(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to read ${path}`);
  }
  return text(await response.text());
}

function isModelContext(value: unknown): value is ModelContext {
  return (
    typeof value === "object" &&
    value !== null &&
    "registerTool" in value &&
    typeof value.registerTool === "function"
  );
}

const names = components.map((item) => item.name);
const tools: WebTool[] = [
  {
    name: "list_components",
    description: "List every Hugsy iOS component with its description and supported frameworks.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => text(JSON.stringify(components, null, 2)),
  },
  {
    name: "read_component",
    description: "Read a component's installation steps, SwiftUI and UIKit usage, API, and source.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", enum: names, description: "Component name." } },
      required: ["name"],
    },
    annotations: { readOnlyHint: true },
    execute: async ({ name }) => {
      if (typeof name !== "string" || !names.includes(name)) {
        throw new Error(`Unknown component. Use one of: ${names.join(", ")}`);
      }
      return readMarkdown(`/components/${name}.md`);
    },
  },
  {
    name: "read_documentation",
    description: "Read a Hugsy documentation page as Markdown.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "string", enum: documentationPages, description: "Documentation page." },
      },
      required: ["page"],
    },
    annotations: { readOnlyHint: true },
    execute: async ({ page }) => {
      const path = typeof page === "string" ? pagePaths[page] : undefined;
      if (!path) {
        throw new Error(`Unknown page. Use one of: ${documentationPages.join(", ")}`);
      }
      return readMarkdown(path);
    },
  },
];

export function registerWebTools() {
  const host = [document, navigator].find((candidate) => "modelContext" in candidate);
  const context = host && Reflect.get(host, "modelContext");
  if (isModelContext(context)) {
    for (const tool of tools) {
      context.registerTool(tool);
    }
  }
}
