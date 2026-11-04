import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { CodeBlock } from "../components/code-block";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/docs")({
  head: () =>
    seo(
      "Documentation",
      "Install Hugsy, copy animated SwiftUI source, configure the local MCP server, and build native macOS interfaces with source you own.",
      "/docs/",
    ),
  component: Docs,
});

function Docs() {
  return (
    <div className="docs-page section-width">
      <div className="docs-header">
        <span className="eyebrow">LESS SETUP. MORE MAKING.</span>
        <h1>
          Make yourself
          <br />
          <em>at home.</em>
        </h1>
        <p>A few commands between a good idea and something you can feel.</p>
      </div>
      <div className="docs-layout">
        <aside className="docs-nav">
          <span className="eyebrow">ON THIS PAGE</span>
          <a href="#installation">Installation</a>
          <a href="#workflow">Your first component</a>
          <a href="#cli">CLI reference</a>
          <a href="#mcp">MCP & agents</a>
          <a href="#native">Native gallery</a>
          <a href="#architecture">How it works</a>
        </aside>
        <div className="docs-content">
          <section id="installation">
            <span className="step-label">01 / GET THE TOOLS</span>
            <h2>One small install.</h2>
            <p>
              The CLI requires Node.js 22.16 or newer. Install the self-contained, versioned package
              directly from this site. It has no npm runtime dependencies and works offline after
              installation.
            </p>
            <CodeBlock code="npm install --global https://pulkitxm.github.io/hugsy/hugsy-0.1.0.tgz" />
            <p>
              The executable is <code>hugsy</code>. This is a GitHub Pages-hosted package, not an
              npm registry release. Prefer a local install? Omit <code>--global</code> and use{" "}
              <code>npx hugsy</code>.
            </p>
            <p>
              Swift components require macOS 14+, Swift 6, and an Xcode installation. iOS is not
              currently supported.
            </p>
          </section>
          <section id="workflow">
            <span className="step-label">02 / MAKE IT YOURS</span>
            <h2>Adopt your first component.</h2>
            <CodeBlock code="cd your-macos-project\nhugsy init --directory Sources/YourApp/Hugsy\nhugsy add fluid-tabs --dry-run\nhugsy add fluid-tabs" />
            <p>
              For an Xcode app without Swift Package Manager, use{" "}
              <code>hugsy init --directory Hugsy</code>, then add the copied files to your app
              target in Xcode. Hugsy never modifies project files automatically.
            </p>
            <p>
              The installer verifies SHA-256 checksums, rejects symlinks and linked files,
              preflights the full batch, and refuses to overwrite customized source. Use{" "}
              <code>hugsy diff fluid-tabs</code> before explicitly opting into <code>--force</code>.
            </p>
            <CodeBlock
              label="hugsy.json"
              code={'{\n  "version": 1,\n  "directory": "Sources/YourApp/Hugsy"\n}'}
            />
            <p>
              Directories are project-relative. Use letters, numbers, underscores, hyphens, and
              forward-slash separators. Absolute paths, traversal, and symlinks are intentionally
              unsupported. Add the MIT license notice to your project when adopting source.
            </p>
          </section>
          <section id="cli">
            <span className="step-label">03 / THE REFERENCE</span>
            <h2>A CLI that stays out of the way.</h2>
            <div className="reference-table">
              <table>
                <caption className="sr-only">Hugsy CLI commands</caption>
                <thead>
                  <tr>
                    <th>Command</th>
                    <th>What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["hugsy list [query]", "Discover components and search animation techniques."],
                    ["hugsy info <name>", "Read usage, integration, and accessibility notes."],
                    ["hugsy init", "Create hugsy.json. Supports --directory and --dry-run."],
                    ["hugsy add <names...>", "Copy source. Supports --dry-run and --force."],
                    [
                      "hugsy diff <names...>",
                      "Read installed and registry source without writing.",
                    ],
                    ["hugsy doctor", "Validate configuration and explain target membership."],
                    ["hugsy mcp", "Serve local MCP over stdio. No network server."],
                    ["hugsy mcp-config", "Print portable host configuration."],
                  ].map(([command, description]) => (
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
            <p>
              All data commands accept <code>--json</code> and <code>--cwd &lt;directory&gt;</code>.
              Failures exit nonzero, with structured runtime errors on stderr in JSON mode. Parser
              usage errors use standard CLI diagnostics. No telemetry, prompts, or remote registry
              calls.
            </p>
          </section>
          <section id="mcp">
            <span className="step-label">04 / A GOOD PAIR OF HANDS</span>
            <h2>Built for agents, too.</h2>
            <p>
              Add this to your MCP host’s configuration. Ensure the host can find <code>hugsy</code>{" "}
              on PATH, or replace it with the absolute executable path.
            </p>
            <CodeBlock
              label="MCP configuration"
              code={
                '{\n  "mcpServers": {\n    "hugsy": {\n      "command": "hugsy",\n      "args": ["mcp"]\n    }\n  }\n}'
              }
            />
            <p>
              Three read-only tools: <code>search_components</code>, <code>get_component</code>, and{" "}
              <code>plan_install</code>. Source is also available as{" "}
              <code>hugsy://components/&lt;name&gt;</code>, with the full registry at{" "}
              <code>hugsy://registry</code>. The <code>integrate_component</code> prompt includes a
              source-aware checklist.
            </p>
            <p>
              MCP deliberately does not write to your project. Agents inspect the source, plan the
              changes, and use the CLI with your permission. Start with{" "}
              <code>--dry-run --json</code>. Never replace customized source without approval.
            </p>
            <p>
              Prefer plain HTTP? Read <a href="/hugsy/llms.txt">llms.txt</a>,{" "}
              <a href="/hugsy/llms-full.txt">llms-full.txt</a>, or the{" "}
              <a href="/hugsy/r/index.json">versioned JSON registry</a>. GitHub Pages does not host
              an MCP process.
            </p>
          </section>
          <section id="native">
            <span className="step-label">05 / THE REAL THING</span>
            <h2>Feel it on a Mac.</h2>
            <p>
              Browser demos recreate each interaction with HTML and CSS. They are not pixel-perfect
              SwiftUI renders. The repository includes a native gallery using the actual component
              source.
            </p>
            <CodeBlock code="git clone https://github.com/pulkitxm/hugsy.git\ncd hugsy\nswift run HugsyGallery" />
            <p>
              Use a full Xcode toolchain. If your selected toolchain is Command Line Tools, set{" "}
              <code>DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer</code> for Swift
              commands. Test keyboard navigation, light and dark appearances, and the macOS Reduce
              Motion setting before shipping.
            </p>
          </section>
          <section id="architecture">
            <span className="step-label">06 / UNDER THE HOOD</span>
            <h2>Static by choice.</h2>
            <p>
              TanStack Start renders every page on the server at build time, then publishes plain
              HTML, CSS, and JavaScript to GitHub Pages under <code>/hugsy/</code>. There is no
              production server, database, external font, or analytics script. Direct component
              links work without a client-side fallback.
            </p>
            <p>
              The CLI, MCP server, JSON endpoints, and docs are built from the same typed registry.
              Every native source file compiles in the gallery and can be copied independently.
              Animation uses SwiftUI springs and matched geometry, with explicit Reduce Motion
              behavior.
            </p>
            <p>
              <Link to="/" hash="components">
                Explore the collection
                <ArrowUpRight size={13} />
              </Link>{" "}
              or{" "}
              <a href="https://github.com/pulkitxm/hugsy">
                contribute on GitHub
                <ArrowUpRight size={13} />
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
