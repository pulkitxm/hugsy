import { Link } from "@tanstack/react-router";
import { components } from "../../generated/components";

export function LibrarySidebar() {
  return (
    <aside className="library-sidebar">
      <nav aria-label="Library navigation">
        <div className="sidebar-group">
          <span>Getting started</span>
          <Link to="/docs/" activeOptions={{ exact: true }}>
            Introduction
          </Link>
          <Link to="/docs/installation/">Installation</Link>
          <Link to="/docs/cli/">CLI</Link>
          <Link to="/docs/mcp/">MCP</Link>
          <Link to="/docs/accessibility/">Accessibility</Link>
        </div>
        <div className="sidebar-group">
          <span>Components</span>
          <Link to="/components/" activeOptions={{ exact: true }}>
            All components
          </Link>
          {components.map((item) => (
            <Link key={item.name} to="/components/$name/" params={{ name: item.name }}>
              {item.title}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
