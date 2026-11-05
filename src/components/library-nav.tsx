import { Link } from "@tanstack/react-router";
import { components } from "../../generated/components";

export function LibraryNav() {
  const exact = { exact: true };
  return (
    <aside className="library-nav" aria-label="Library">
      <nav aria-label="Library pages">
        <p>Getting started</p>
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
        <p>Components</p>
        {components.map((item) => (
          <Link key={item.name} to="/components/$name/" params={{ name: item.name }}>
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
