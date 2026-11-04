import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "../components/code-block";
import { seo } from "../lib/seo";
import { mcpConfig } from "../lib/snippets";

export const Route = createFileRoute("/docs/mcp")({
  head: () =>
    seo(
      "MCP",
      "Connect the native Hugsy MCP server to discover SwiftUI components, inspect complete Swift source, and plan safe iOS integrations without filesystem access.",
      "/docs/mcp/",
    ),
  component: MCP,
});

function MCP() {
  return (
    <>
      <div className="page-heading">
        <p className="overline">Connected tools</p>
        <h1>MCP</h1>
        <p>Give your tools the source, not permission to change everything.</p>
      </div>
      <div className="prose">
        <p>
          Hugsy includes a native Swift MCP server. It runs locally over stdio, with the same
          offline registry as the CLI. All tools and resources are read-only.
        </p>
        <section className="doc-section">
          <h2>Connect a host</h2>
          <p>
            <Link to="/docs/installation/">Install the CLI</Link>, then add this configuration to
            your MCP host. Use an absolute executable path if the host does not inherit your shell’s
            PATH.
          </p>
          <CodeBlock label="MCP configuration" code={mcpConfig} />
          <p>
            Print the same configuration with <code>hugsy mcp-config</code>. Run the server directly
            with:
          </p>
          <CodeBlock code="hugsy mcp" />
        </section>
        <section className="doc-section">
          <h2>Tools</h2>
          <div className="api-table">
            <table>
              <caption className="sr-only">Read-only MCP tools</caption>
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Input</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>search_components</code>
                  </td>
                  <td>
                    Optional <code>query</code>
                  </td>
                  <td>Component summaries, categories, and animation techniques.</td>
                </tr>
                <tr>
                  <td>
                    <code>get_component</code>
                  </td>
                  <td>
                    <code>name</code>
                  </td>
                  <td>Full Swift source, usage, accessibility notes, and checksum.</td>
                </tr>
                <tr>
                  <td>
                    <code>plan_install</code>
                  </td>
                  <td>
                    <code>names</code>, up to six
                  </td>
                  <td>Source files and safe CLI commands. No filesystem access.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className="doc-section">
          <h2>Resources and prompts</h2>
          <p>
            Read <code>hugsy://registry</code> for the complete registry or{" "}
            <code>hugsy://components/&lt;name&gt;</code> for an individual Swift source file. The{" "}
            <code>integrate_component</code> prompt accepts a component name and returns a
            source-aware integration checklist.
          </p>
        </section>
        <section className="doc-section">
          <h2>A deliberate boundary</h2>
          <p>
            The MCP process does not read your project, write files, or execute shell commands. Your
            tools inspect the source, explain the integration, and use the CLI with your approval.
            Start with <code>--dry-run --json</code>, and never replace customized files without
            permission.
          </p>
          <p>
            The static website also provides <a href="/hugsy/llms.txt">llms.txt</a>,{" "}
            <a href="/hugsy/llms-full.txt">complete component notes</a>, and the{" "}
            <a href="/hugsy/r/index.json">JSON registry</a>. GitHub Pages does not host an MCP
            process.
          </p>
        </section>
        <div className="document-footer">
          <Link to="/docs/cli/">CLI</Link>
          <Link to="/docs/accessibility/">
            Accessibility
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
