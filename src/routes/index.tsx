import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { CodeBlock } from "../components/code-block";
import { ComponentList } from "../components/component-list";
import { Device } from "../components/device";
import { demos } from "../demos/registry";
import { HighlightProvider, loadDocsHighlights } from "../lib/highlights";
import { seo } from "../lib/seo";
import { installCommand } from "../lib/snippets";

export const Route = createFileRoute("/")({
  head: () =>
    seo(
      "Animated iOS components",
      "Five animated iOS components with a SwiftUI view and a UIKit view controller each. Try them in an interactive iPhone, iPad, or Mac, then own the Swift source.",
      "/",
    ),
  loader: loadDocsHighlights,
  component: Home,
});

const featured = demos["swipe-deck"]?.[0];

function Home() {
  const Demo = featured?.component;
  return (
    <HighlightProvider highlights={Route.useLoaderData()}>
      <section className="hero container">
        <div className="hero-copy">
          <h1>Animated iOS components.</h1>
          <p>
            Five carefully tuned interactions, each with a SwiftUI view and a UIKit view controller.
            Copy the source and make it yours.
          </p>
          <CodeBlock code={installCommand} />
          <div className="hero-actions">
            <Link to="/components/" className="button">
              Browse components
            </Link>
            <Link to="/docs/" className="text-link">
              Read the docs
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
        {Demo && (
          <div className="hero-device">
            <Device kind="iphone" label="Swipe deck on iPhone">
              <Suspense fallback={<div className="demo" />}>
                <Demo variant="stories" />
              </Suspense>
            </Device>
          </div>
        )}
      </section>
      <section className="container" aria-labelledby="components-title">
        <h2 className="section-title" id="components-title">
          Components
        </h2>
        <ComponentList />
      </section>
    </HighlightProvider>
  );
}
