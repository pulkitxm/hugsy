import { createFileRoute, Link } from "@tanstack/react-router";
import { CodeBlock } from "../components/code-block";
import { ArrowRight } from "../components/icons";
import { seo } from "../lib/seo";
import { sourceExample, uikitExample } from "../lib/snippets";

export const Route = createFileRoute("/docs/")({
  head: () =>
    seo(
      "Introduction",
      "Get started with Hugsy, copy-and-own animated iOS components for SwiftUI and UIKit. Learn how the source, native Swift CLI, and local MCP server fit together.",
      "/docs/",
    ),
  component: Introduction,
});

function Introduction() {
  return (
    <>
      <div className="page-heading">
        <p className="overline">Documentation</p>
        <h1>Introduction</h1>
        <p>A little less rebuilding. A lot more room to make it yours.</p>
      </div>
      <div className="prose">
        <p>
          Hugsy is a small collection of animated iOS components: a swipe deck, a parallax carousel,
          a morphing capsule, expanding cards, and a radial menu. Each is the kind of interaction
          that takes time to get right.
        </p>
        <p>
          Every component ships a SwiftUI view and a UIKit view controller. SwiftUI apps use the
          view directly. UIKit apps add the view controller with standard containment and supply
          their own UIViews. This is source you adopt, packaged locally by default.
        </p>
        <section className="doc-section">
          <h2>Start with an interaction</h2>
          <p>
            Explore a <Link to="/components/">component</Link>, read its source, then copy the
            source or add it with the CLI. You own the colors, content, gestures, and animation
            parameters.
          </p>
          <CodeBlock label="SwiftUI" code={sourceExample} />
          <CodeBlock label="UIKit" code={uikitExample} />
        </section>
        <section className="doc-section">
          <h2>What you need</h2>
          <ul>
            <li>An iOS app targeting iOS 17 or newer.</li>
            <li>Xcode with a Swift 6 toolchain.</li>
            <li>
              The generated local package attached to your app target, or directly included source.
            </li>
          </ul>
          <p>
            The CLI runs natively on macOS 14+. Your iOS app does not need the CLI, MCP SDK, or any
            third-party package at runtime.
          </p>
        </section>
        <section className="doc-section">
          <h2>Three ways to work</h2>
          <div className="doc-link-grid">
            <Link to="/docs/installation/">
              <strong>Copy the source</strong>
              <span>Pick one component. Add one Swift file.</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/docs/cli/">
              <strong>Use the native CLI</strong>
              <span>Discover, plan, and add components safely.</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/docs/mcp/">
              <strong>Connect your tools</strong>
              <span>Read source and plan integrations over MCP.</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <div className="document-footer">
          <span>Ready when you are.</span>
          <Link to="/docs/installation/">
            Installation
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
