import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { useState } from "react";
import { registry } from "../../cli/registry";
import { CodeBlock } from "../components/code-block";
import { ComponentDemo } from "../components/demos";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/components/$name")({
  loader: ({ params }) => {
    const item = registry.components.find((entry) => entry.name === params.name);
    if (!item) {
      throw notFound();
    }
    return item;
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo(loaderData.title, loaderData.description, `/components/${loaderData.name}/`)
      : {},
  component: ComponentPage,
});

function ComponentPage() {
  const item = Route.useLoaderData();
  const [view, setView] = useState("Preview");
  return (
    <div className="component-page section-width">
      <Link to="/" hash="components" className="back-link">
        <ArrowLeft size={14} />
        Back to the collection
      </Link>
      <div className="component-page-heading">
        <span className="eyebrow">
          {item.category.toUpperCase()} / {item.technique.toUpperCase()}
        </span>
        <h1>
          {item.title}
          <span className="orange-period">.</span>
        </h1>
        <p>{item.description}</p>
        <div className="detail-tags">
          <span>
            <Check size={12} />
            macOS 14+
          </span>
          <span>
            <Check size={12} />
            Swift 6
          </span>
          <span>
            <Check size={12} />
            Reduce Motion
          </span>
          <span>
            <Check size={12} />
            No dependencies
          </span>
        </div>
      </div>
      <div className="detail-layout">
        <div>
          <div className="preview-switch">
            {["Preview", "Source"].map((tab) => (
              <button
                type="button"
                key={tab}
                aria-pressed={view === tab}
                className={view === tab ? "active" : ""}
                onClick={() => setView(tab)}
              >
                {tab}
              </button>
            ))}
            <span>SWIFTUI / BROWSER RECREATION</span>
          </div>
          {view === "Preview" ? (
            <div className={`detail-demo preview-${item.name}`}>
              <ComponentDemo name={item.name} />
            </div>
          ) : (
            <CodeBlock label={item.filename} code={item.source} />
          )}
          <p className="preview-disclaimer">
            Interactive browser recreation, not a SwiftUI runtime. Run{" "}
            <code>swift run HugsyGallery</code> from the repository for the native implementation.
          </p>
          <section className="detail-section">
            <h2>Installation</h2>
            <p>
              <Link to="/docs/">Install the CLI</Link> once, then add the source to your project.
            </p>
            <CodeBlock code={`hugsy add ${item.name}`} />
          </section>
          <section className="detail-section">
            <h2>Usage</h2>
            <p>{item.integration}</p>
            <CodeBlock label="SwiftUI" code={item.usage} />
          </section>
          <section className="detail-section">
            <h2>Accessibility & motion</h2>
            <p>{item.accessibility}</p>
            <h3>Interaction states</h3>
            <div className="state-tags">
              {item.states.map((state) => (
                <span key={state}>{state}</span>
              ))}
            </div>
          </section>
        </div>
        <aside className="detail-aside">
          <span className="eyebrow">GIVE IT A TRY</span>
          <p>{item.interaction}</p>
          <hr />
          <span className="eyebrow">ONE FILE. ALL YOURS.</span>
          <p>Copy it. Change the spring. Make it feel like your app.</p>
          <a href={`/hugsy/r/${item.name}.json`}>
            Registry JSON
            <ArrowUpRight size={13} />
          </a>
          <a href={`https://github.com/pulkitxm/hugsy/blob/main/registry/swift/${item.filename}`}>
            View Swift source
            <ArrowUpRight size={13} />
          </a>
          <Link to="/docs/" hash="mcp">
            Use with MCP
            <ArrowUpRight size={13} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
