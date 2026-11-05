import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { componentParameters } from "../../registry/parameters";
import type { ComponentPage as ComponentPageData } from "../../registry/schema";
import { CodeBlock } from "../components/code-block";
import { DevicePreview } from "../components/device-preview";
import { LibrarySidebar } from "../components/library-sidebar";
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
  return (
    <HighlightProvider highlights={item.highlights}>
      <div className="library-layout container">
        <LibrarySidebar />
        <article className="component-document">
          <div className="page-heading">
            <Link to="/components/" className="overline">
              Components / {item.category}
            </Link>
            <h1>{item.title}</h1>
            <p>{item.description}</p>
            <div className="component-meta">
              <span>iOS 17+</span>
              <span>Swift 6</span>
              <span>{item.frameworks.join(", ")}</span>
              <span>MIT</span>
              <a
                href={`https://github.com/pulkitxm/hugsy/blob/main/registry/swift/${item.filename}`}
              >
                View source
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
          <DevicePreview name={item.name} title={item.title} />
          <section className="doc-section source-preview" id="source">
            <h2>Source</h2>
            {item.sources.map((file) => (
              <CodeBlock key={file.path} code={file.code} label={file.path} />
            ))}
          </section>
          <section className="doc-section" id="installation">
            <h2>Installation</h2>
            <p>
              <Link to="/docs/installation/">Install the native Swift CLI</Link>, then add the
              component to your app.
            </p>
            <CodeBlock code={`hugsy add ${item.name}`} />
            <p>
              Run <code>hugsy init</code> first. Add the generated local package in Xcode, attach
              <code> HugsyComponents</code> to your app target, then use
              <code> import HugsyComponents</code>. See the installation guide for source and remote
              package alternatives.
            </p>
            <p>
              Prefer to copy it yourself? Open the{" "}
              <a href={`/r/${item.name}.swift`}>complete Swift file</a> and add it to your iOS app
              target in Xcode. No package dependency is required.
            </p>
          </section>
          <section className="doc-section" id="usage">
            <h2>Usage</h2>
            <CodeBlock code={item.usage} label="SwiftUI" />
            {item.uikitUsage && <CodeBlock code={item.uikitUsage} label="UIKit" />}
            <p>{item.integration}</p>
          </section>
          <section className="doc-section" id="api">
            <h2>API reference</h2>
            <div className="api-table component-api">
              <table>
                <caption className="sr-only">{item.title} parameters</caption>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type & behavior</th>
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
            </div>
          </section>
          <section className="doc-section" id="interaction">
            <h2>Interaction</h2>
            <p>{item.interaction}</p>
            <div className="interaction-states">
              {item.states.map((state) => (
                <span key={state}>{state}</span>
              ))}
            </div>
          </section>
          <section className="doc-section" id="accessibility">
            <h2>Accessibility</h2>
            <p>{item.accessibility}</p>
            <p>
              Test with VoiceOver, Dynamic Type, and Reduce Motion on a physical device before
              shipping. The gallery demonstrates the interaction, not every application-specific
              content state.
            </p>
          </section>
          <div className="document-footer">
            <Link to="/components/">Back to components</Link>
            <a href="https://github.com/pulkitxm/hugsy/issues">
              Suggest an improvement
              <ArrowUpRight size={12} />
            </a>
          </div>
        </article>
      </div>
    </HighlightProvider>
  );
}
