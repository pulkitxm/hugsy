import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "../components/code-block";
import { seo } from "../lib/seo";
import { sourceExample } from "../lib/snippets";

export const Route = createFileRoute("/docs/")({
  head: () =>
    seo(
      "Introduction",
      "Get started with Hugsy, a copy-and-own SwiftUI collection for iOS. Learn how the source, native Swift CLI, and local MCP server fit into your workflow.",
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
          Hugsy is a collection of animation-heavy SwiftUI components for iOS. Expanding cards,
          gesture-driven sheets, spring-reflow notifications, and other interactions that take time
          to get right.
        </p>
        <p>
          This is source you adopt, packaged locally by default. The CLI can distribute multiple
          files, shared dependencies, and resources for UIKit, Foundation services, and other Apple
          frameworks too. Today’s catalog remains focused on SwiftUI interactions.
        </p>
        <section className="doc-section">
          <h2>Start with an interaction</h2>
          <p>
            Explore a <Link to="/components/">component</Link>, watch its native iPhone demo, then
            copy the source or add it with the CLI. You own the colors, content, gestures, and
            animation parameters.
          </p>
          <CodeBlock label="SwiftUI" code={sourceExample} />
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
        <section className="doc-section">
          <h2>About the previews</h2>
          <p>
            The device previews are recordings and screenshots of the actual SwiftUI example app
            running in an iOS simulator. They are not React recreations. The sample content is
            fictional.
          </p>
          <p>
            Preview captures use iOS 27.2 on an iPhone 17 Pro. The source targets iOS 17+. Always
            verify your app’s content, older deployment targets, Dynamic Type, VoiceOver, and Reduce
            Motion on the devices you support.
          </p>
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
