import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "../components/code-block";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/docs/cli")({
  head: () =>
    seo(
      "CLI reference",
      "Use the native Hugsy Swift CLI to discover components, preview installations, preserve local edits, compare source, and connect a read-only MCP server.",
      "/docs/cli/",
    ),
  component: CLI,
});

function CLI() {
  const commands = [
    ["hugsy list [query]", "List or search component names, categories, and animation techniques."],
    [
      "hugsy info <name>",
      "Read source, usage, integration requirements, and accessibility behavior.",
    ],
    ["hugsy init", "Create hugsy.json. Use --directory to select the destination."],
    [
      "hugsy add <names...>",
      "Copy one or more components, verifying integrity and preserving local edits.",
    ],
    ["hugsy diff <names...>", "Read the installed and registry versions without changing files."],
    ["hugsy doctor", "Validate configuration and explain iOS target integration."],
    ["hugsy mcp", "Start the local, read-only MCP server over stdio."],
    ["hugsy mcp-config", "Print portable MCP host configuration."],
  ];
  return (
    <>
      <div className="page-heading">
        <p className="overline">Native tooling</p>
        <h1>CLI</h1>
        <p>A Swift command that stays out of your way.</p>
      </div>
      <div className="prose">
        <p>
          <Link to="/docs/installation/">Install Hugsy</Link>, then run <code>hugsy --help</code>.
          Each subcommand also supports <code>--help</code>.
        </p>
        <section className="doc-section">
          <h2>Commands</h2>
          <div className="api-table">
            <table>
              <caption className="sr-only">CLI commands</caption>
              <thead>
                <tr>
                  <th>Command</th>
                  <th>Behavior</th>
                </tr>
              </thead>
              <tbody>
                {commands.map(([command, description]) => (
                  <tr key={command}>
                    <td>
                      <code>{command}</code>
                    </td>
                    <td>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="doc-section">
          <h2>Plan before writing</h2>
          <p>
            <code>init</code> and <code>add</code> accept <code>--dry-run</code>. Adding components
            preflights the entire batch and refuses conflicts before copying anything. Only use{" "}
            <code>--force</code> after inspecting the local changes.
          </p>
          <CodeBlock code="hugsy list --json\nhugsy info expanding-cards --json\nhugsy add expanding-cards --dry-run --json" />
        </section>
        <section className="doc-section">
          <h2>Automation</h2>
          <p>
            Data commands accept <code>--json</code> and <code>--cwd &lt;directory&gt;</code> after
            the subcommand. Runtime failures in JSON mode produce a structured error on stderr. Exit
            status is zero on success and nonzero on failure. Invalid command syntax uses the
            standard argument parser diagnostics.
          </p>
          <p>
            The registry is compiled into the executable. Commands do not fetch remote source, run
            installation scripts, collect telemetry, or modify Xcode project files.
          </p>
        </section>
        <section className="doc-section">
          <h2>Interrupted installations</h2>
          <p>
            Cooperating installers share a lock. Handled write failures roll back changed files, but
            process termination or a disk failure can interrupt a batch. Inspect your project after
            interruption. Remove a stale <code>.hugsy-install.lock</code> only after confirming no
            installer is running.
          </p>
        </section>
        <div className="document-footer">
          <Link to="/docs/installation/">Installation</Link>
          <Link to="/docs/mcp/">
            MCP
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
