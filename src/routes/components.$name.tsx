import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { components } from "../../generated/components";
import { componentParameters } from "../../registry/parameters";
import type { ComponentPage as ComponentPageData } from "../../registry/schema";
import { CodeBlock } from "../components/code-block";
import { CodeTabs } from "../components/code-tabs";
import { DevicePreview } from "../components/device-preview";
import { HighlightProvider } from "../lib/highlights";
import { seo } from "../lib/seo";

const pages = import.meta.glob<{ page: ComponentPageData }>("../../generated/pages/*.ts");

export const Route = createFileRoute("/components/$name")({
  loader: async ({ params }) => {
    const load = pages[`../../generated/pages/${params.name}.ts`];
    if (!load) {
      throw notFound();
    }
    return (await load()).page;
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo(loaderData.title, loaderData.description, `/components/${loaderData.name}/`)
      : {},
  component: ComponentPage,
});

function ComponentPage() {
  const item = Route.useLoaderData();
  const index = components.findIndex((entry) => entry.name === item.name);
  const previous = components[index - 1];
  const next = components[index + 1];
  const usage = [{ name: "SwiftUI", code: item.usage }];
  if (item.uikitUsage) {
    usage.push({ name: "UIKit", code: item.uikitUsage });
  }
  return (
    <HighlightProvider highlights={item.highlights}>
      <article className="container">
        <div className="page-heading doc-column">
          <Link to="/components/" className="overline">
            Components
          </Link>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
          <div className="component-meta">
            <span>iOS 17+</span>
            <span>{item.frameworks.join(" + ")}</span>
            <span>{item.technique}</span>
            <a href={`https://github.com/pulkitxm/hugsy/blob/main/registry/swift/${item.filename}`}>
              Source
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </div>
        </div>
        <DevicePreview name={item.name} title={item.title} />
        <div className="doc-column">
          <section className="doc-section" id="installation">
            <h2>Installation</h2>
            <CodeBlock code={`hugsy add ${item.name}`} />
            <p>
              Run <code>hugsy init</code> once, attach the generated <code>HugsyComponents</code>{" "}
              package to your app target, and <code>import HugsyComponents</code>. The SwiftUI view
              is also a <a href={`/r/${item.name}.swift`}>single Swift file</a> you can copy
              directly. See <Link to="/docs/installation/">installation</Link> for other options.
            </p>
          </section>
          <section className="doc-section" id="usage">
            <h2>Usage</h2>
            <CodeTabs label="Framework" tabs={usage} />
            <p>{item.integration}</p>
          </section>
          <section className="doc-section" id="api">
            <h2>API</h2>
            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users scroll the wide table. */}
            <section className="api-table" aria-label="Parameters" tabIndex={0}>
              <table>
                <caption className="sr-only">{item.title} parameters</caption>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody>
                  {(componentParameters[item.name] ?? []).map((parameter) => (
                    <tr key={parameter.name}>
                      <td>
                        <code>{parameter.name}</code>
                      </td>
                      <td>
                        <code>{parameter.type}</code>
                        <p>{parameter.description}</p>
                      </td>
                      <td>
                        <code>{parameter.defaultValue}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </section>
          <section className="doc-section" id="behavior">
            <h2>Behavior</h2>
            <p>{item.interaction}</p>
            <p>{item.accessibility}</p>
          </section>
          <section className="doc-section source-preview" id="source">
            <h2>Source</h2>
            <details className="source-files">
              <summary>
                {item.sources.length} files: {item.sources.map((file) => file.path).join(", ")}
              </summary>
              {item.sources.map((file) => (
                <CodeBlock key={file.path} code={file.code} label={file.path} />
              ))}
            </details>
          </section>
          <nav className="document-footer" aria-label="More components">
            {previous ? (
              <Link to="/components/$name/" params={{ name: previous.name }}>
                <ArrowLeft size={14} aria-hidden="true" />
                {previous.title}
              </Link>
            ) : (
              <Link to="/components/">All components</Link>
            )}
            {next && (
              <Link to="/components/$name/" params={{ name: next.name }}>
                {next.title}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      </article>
    </HighlightProvider>
  );
}
