import { createFileRoute, Link } from "@tanstack/react-router";
import { components } from "../../generated/components";
import { CodeBlock } from "../components/code-block";
import { CodeTabs } from "../components/code-tabs";
import { ArrowRight, Boxes, Layers, TerminalSquare } from "../components/icons";
import { ShowcaseCard } from "../components/showcase-card";
import { HighlightProvider, loadDocsHighlights } from "../lib/highlights";
import { seo } from "../lib/seo";
import { firstComponent, installCommand, sourceExample, uikitExample } from "../lib/snippets";

export const Route = createFileRoute("/")({
  head: () =>
    seo(
      "Animated iOS components",
      "Five animated iOS components with a SwiftUI view and a UIKit view controller each. Try them on a realistic iPhone, iPad, or Mac, then own the Swift source.",
      "/",
    ),
  loader: loadDocsHighlights,
  component: Home,
});

const features = [
  {
    Icon: Layers,
    title: "SwiftUI and UIKit",
    text: "Every component ships a SwiftUI view and a UIKit view controller built on the same source.",
  },
  {
    Icon: Boxes,
    title: "Yours to change",
    text: "Source lands in your repository. Tune the springs, swap the content, keep the edits.",
  },
  {
    Icon: TerminalSquare,
    title: "CLI and MCP",
    text: "Add components with a native Swift CLI, or let your editor read them over MCP.",
  },
];

function Home() {
  return (
    <HighlightProvider highlights={Route.useLoaderData()}>
      <section className="hero container">
        <Link to="/docs/installation/" hash="uikit" className="hero-badge">
          <span>New</span>
          UIKit view controllers for every component
          <ArrowRight aria-hidden="true" />
        </Link>
        <h1>Animated components for iOS.</h1>
        <p>
          Gestures, springs, and shape morphing you would rather not build twice. Try each one on a
          real-feeling iPhone, iPad, or Mac, then copy the Swift source into your app.
        </p>
        <div className="hero-actions">
          <Link to="/components/" className="button">
            Browse components
          </Link>
          <Link to="/docs/" className="button button-soft">
            Get started
          </Link>
        </div>
        <div className="hero-install">
          <CodeBlock code={installCommand} />
        </div>
      </section>
      <section className="showcase container" aria-label="Live components">
        {components.map((item) => (
          <ShowcaseCard key={item.name} name={item.name} title={item.title} />
        ))}
        <article className="preview-frame showcase-code">
          <div className="preview-bar">
            <h2>One component, two frameworks</h2>
          </div>
          <div className="showcase-code-body">
            <CodeTabs
              label="Framework"
              tabs={[
                { name: "SwiftUI", code: sourceExample },
                { name: "UIKit", code: uikitExample },
              ]}
            />
            <Link to="/components/" className="text-link">
              See every component
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </article>
      </section>
      <section className="features container" aria-label="Why Hugsy">
        {features.map(({ Icon, title, text }) => (
          <div key={title}>
            <Icon aria-hidden="true" />
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        ))}
      </section>
      <section className="cta container">
        <div>
          <h2>Add your first component.</h2>
          <p>Works offline after the first build. Your app gains no runtime dependency.</p>
          <Link to="/docs/installation/" className="text-link">
            Read the installation guide
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <CodeBlock code={firstComponent} />
      </section>
    </HighlightProvider>
  );
}
