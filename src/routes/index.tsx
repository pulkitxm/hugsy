import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { components } from "../../generated/components";
import { CodeBlock } from "../components/code-block";
import { ComponentCard } from "../components/component-card";
import { HighlightProvider, loadDocsHighlights } from "../lib/highlights";
import { seo } from "../lib/seo";
import { sourceExample } from "../lib/snippets";

export const Route = createFileRoute("/")({
  head: () =>
    seo(
      "SwiftUI, beautifully in motion",
      "Expressive, source-owned SwiftUI components for iOS. Explore native iPhone demos, copy the Swift source, and make the details your own.",
      "/",
    ),
  loader: loadDocsHighlights,
  component: Home,
});

function Home() {
  return (
    <HighlightProvider highlights={Route.useLoaderData()}>
      <section className="landing-hero container">
        <div className="hero-copy">
          <p className="overline">A considered collection for iOS.</p>
          <h1>
            Native motion.
            <br />
            <span>
              Nothing in
              <br className="hero-line" /> the way.
            </span>
          </h1>
          <p className="hero-description">
            The details that make an app feel different.
            <br className="wide-break" /> Expressive SwiftUI components you can copy,
            <br className="wide-break" /> shape, and make your own.
          </p>
          <div className="hero-actions">
            <Link to="/components/" className="button-primary">
              Browse components
              <ArrowUpRight size={15} />
            </Link>
            <Link to="/docs/" className="text-link">
              Read the docs
              <ArrowRight size={15} />
            </Link>
          </div>
          <p className="hero-meta">
            iOS 17+
            <span />
            Pure SwiftUI
            <span />
            Open source
          </p>
        </div>
      </section>
      <section className="featured-section container">
        <div className="section-heading">
          <div>
            <p className="overline">The collection</p>
            <h2>Small details. A different feeling.</h2>
          </div>
          <Link to="/components/" className="text-link">
            All components
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="featured-grid">
          {components.slice(0, 3).map((item) => (
            <ComponentCard key={item.name} {...item} />
          ))}
        </div>
      </section>
      <section className="source-section container">
        <div>
          <p className="overline">Yours, all the way down.</p>
          <h2>
            Adopt the code.
            <br />
            Not a dependency.
          </h2>
          <p>
            One Swift file becomes part of your app. Change the gesture, tune the spring, or take it
            somewhere entirely different.
          </p>
          <Link to="/docs/installation/" className="text-link">
            Start building
            <ArrowRight size={15} />
          </Link>
        </div>
        <CodeBlock label="SwiftUI" code={sourceExample} />
      </section>
      <section className="principle-section container">
        <div>
          <h3>Actually native.</h3>
          <p>
            SwiftUI views, system materials, and native gestures. Built for the iPhone, not
            translated from the web.
          </p>
        </div>
        <div>
          <h3>Motion with a purpose.</h3>
          <p>
            Interruptible springs and connected states. With Reduce Motion and alternatives to
            gesture-only actions.
          </p>
        </div>
        <div>
          <h3>A workflow that fits.</h3>
          <p>
            Copy the source, use the native Swift CLI, or let your tools discover it through MCP.
            Your app stays dependency-free.
          </p>
        </div>
      </section>
    </HighlightProvider>
  );
}
