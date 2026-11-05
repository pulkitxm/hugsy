import { Link } from "@tanstack/react-router";

export function DocsNav() {
  const exact = { exact: true };
  return (
    <aside className="docs-nav">
      <nav aria-label="Documentation">
        <Link to="/docs/" activeOptions={exact}>
          Introduction
        </Link>
        <Link to="/docs/installation/" activeOptions={exact}>
          Installation
        </Link>
        <Link to="/docs/cli/" activeOptions={exact}>
          CLI
        </Link>
        <Link to="/docs/mcp/" activeOptions={exact}>
          MCP
        </Link>
        <Link to="/docs/accessibility/" activeOptions={exact}>
          Accessibility
        </Link>
      </nav>
    </aside>
  );
}
