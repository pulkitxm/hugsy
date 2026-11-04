import { Command } from "commander";
import { z } from "zod";
import { initialize, inspectProject, install, planInstall } from "./install";
import { startMcp } from "./mcp";
import { getComponent, searchComponents } from "./registry";

const program = new Command()
  .name("hugsy")
  .description("Animated SwiftUI components. Your source, your rules.")
  .version("0.1.0")
  .option("--cwd <directory>", "Project directory", ".")
  .option("--json", "Machine-readable output", false)
  .showHelpAfterError();
const optionsSchema = z.object({ cwd: z.string(), json: z.boolean() });
const options = () => optionsSchema.parse(program.opts());
function output(data: unknown, text: string) {
  process.stdout.write(`${options().json ? JSON.stringify(data) : text}\n`);
}

program
  .command("list")
  .description("List components, optionally filtered by a search query")
  .argument("[query]", "Search terms", "")
  .action((query: string) => {
    const components = searchComponents(query).map(({ source: _, ...item }) => item);
    output(
      { components },
      components.map((item) => `${item.name.padEnd(20)} ${item.description}`).join("\n") ||
        "No matching components.",
    );
  });
program
  .command("info")
  .description("Read source, usage, and accessibility notes")
  .argument("<name>")
  .action((name: string) => {
    const item = getComponent(name);
    output(
      item,
      `${item.title}\n${item.description}\n\n${item.integration}\n\n${item.usage}\n\n${item.accessibility}`,
    );
  });
program
  .command("init")
  .description("Create hugsy.json without changing your Xcode project")
  .option("--directory <path>", "Relative component directory", "Hugsy")
  .option("--dry-run", "Plan without writing", false)
  .action((raw: unknown) => {
    const flags = z.object({ directory: z.string(), dryRun: z.boolean() }).parse(raw);
    const result = initialize(options().cwd, flags.directory, flags.dryRun);
    output(
      result,
      `${flags.dryRun ? "Would create" : "Created"} hugsy.json. Components go in ${flags.directory}/. Next: hugsy add fluid-tabs`,
    );
  });
program
  .command("add")
  .description("Copy Swift source, refusing to overwrite customized files")
  .argument("<names...>")
  .option("--dry-run", "Show the complete plan without writing", false)
  .option("--force", "Replace existing component files", false)
  .action((names: string[], raw: unknown) => {
    const flags = z.object({ dryRun: z.boolean(), force: z.boolean() }).parse(raw);
    const result = install(options().cwd, names, flags);
    output(
      result,
      result.files
        .map((file) => `${result.dryRun ? "plan" : "done"} ${file.status.padEnd(10)} ${file.path}`)
        .join("\n"),
    );
  });
program
  .command("diff")
  .description("Inspect installed files against the bundled source, without writing")
  .argument("<names...>")
  .action((names: string[]) => {
    const { files } = planInstall(options().cwd, names);
    output(
      { files },
      files
        .map(
          (file) =>
            `${file.name}: ${file.status}\n${file.previous === null ? "Not installed" : `Installed:\n${file.previous}`}\nRegistry:\n${file.source}`,
        )
        .join("\n"),
    );
  });
program
  .command("doctor")
  .description("Validate configuration and explain project integration")
  .action(() => {
    const result = inspectProject(options().cwd);
    output(
      result,
      `${result.configured ? "Configuration valid" : "Not initialized: run hugsy init"}\nRequires macOS ${result.minimumMacOS}+, Swift ${result.swift}+.\n${result.note}`,
    );
  });
program
  .command("mcp")
  .description("Start the local, read-only MCP server on stdio")
  .action(startMcp);
program
  .command("mcp-config")
  .description("Print portable MCP host configuration")
  .action(() => {
    process.stdout.write(
      `${JSON.stringify({ mcpServers: { hugsy: { command: "hugsy", args: ["mcp"] } } }, null, 2)}\n`,
    );
  });

try {
  await program.parseAsync();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unexpected failure";
  process.stderr.write(
    `${options().json ? JSON.stringify({ error: { message } }) : `hugsy: ${message}`}\n`,
  );
  process.exitCode = 1;
}
