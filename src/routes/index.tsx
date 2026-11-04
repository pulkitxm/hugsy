import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code,
  Command,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { catalog } from "../../registry/catalog";
import { CodeBlock } from "../components/code-block";
import { CommandDemo, ComponentDemo } from "../components/demos";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    seo(
      "SwiftUI, with a little more feeling",
      "Animation-heavy, copy-and-own SwiftUI components for macOS. Explore interactive demos, get the source, and make the motion yours.",
      "/",
    ),
  component: Home,
});

const categories = ["All components", "Navigation", "Overlay", "Feedback", "Layout"];
function Home() {
  const [category, setCategory] = useState("All components");
  const [query, setQuery] = useState("");
  const visible = catalog.filter(
    (item) =>
      (category === "All components" || item.category === category) &&
      `${item.title} ${item.description} ${item.technique}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="hero section-width">
        <div className="hero-copy">
          <a className="release-badge" href="#components">
            <span />
            THE FIRST COLLECTION IS HERE
            <ArrowUpRight size={12} />
          </a>
          <h1>
            Native feel.
            <br />
            Extraordinary
            <br />
            <em>motion.</em>
            <span className="hero-spark" aria-hidden="true">
              ✳
            </span>
          </h1>
          <p>
            The SwiftUI components you don’t want to build
            <br className="desktop-break" /> from scratch. Thoughtful motion. Native soul.
            <br className="desktop-break" /> Copy the code. Make it yours.
          </p>
          <div className="hero-ctas">
            <a href="#components" className="button-primary">
              Explore components
              <ArrowDown size={15} />
            </a>
            <Link to="/docs/" className="text-link">
              Get started
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span>
              <Check size={12} />
              100% SwiftUI
            </span>
            <span>
              <Check size={12} />
              No dependencies
            </span>
            <span>
              <Check size={12} />
              Open source
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-art-label">
            <span className="small-cross">+</span>BUILT TO FEEL RIGHT<span>01 / 06</span>
          </div>
          <div className="hero-demo-wrap">
            <CommandDemo hero />
            <div className="floating-note">
              <span className="note-check">
                <Check size={13} />
              </span>
              <div>
                A little less work.<small>A little more delight.</small>
              </div>
              <Sparkles size={16} />
            </div>
          </div>
          <div className="hero-art-footer">
            <span>
              <span className="live-dot" />
              LIVE PREVIEW
            </span>
            <span>
              Go on. Give it a try.
              <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </section>
      <div className="principles">
        <div className="section-width principles-inner">
          <span>NOT ANOTHER COMPONENT LIBRARY.</span>
          <p>The tricky parts, already figured out.</p>
          <div>
            <Command size={15} />
            Keyboard-first
          </div>
          <div>
            <Sparkles size={15} />
            Motion with intention
          </div>
          <div>
            <Code size={15} />
            Source you own
          </div>
        </div>
      </div>
      <section className="collection section-width" id="components">
        <div className="section-topline">
          <span className="eyebrow">
            <span className="orange-square" />
            THE COLLECTION
          </span>
          <span className="mono">SMALL BY DESIGN. BIG ON FEELING.</span>
        </div>
        <div className="collection-heading">
          <div>
            <h2>The good stuff.</h2>
            <p>Complex interactions. Carefully choreographed. Ready for your app.</p>
          </div>
          <span className="collection-count">
            06<span>COMPONENTS & COUNTING</span>
          </span>
        </div>
        <div className="collection-toolbar">
          <fieldset className="category-tabs">
            <legend className="sr-only">Filter by category</legend>
            {categories.map((name) => (
              <button
                type="button"
                key={name}
                className={category === name ? "active" : ""}
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name}
                {name === "All components" && <span>6</span>}
              </button>
            ))}
          </fieldset>
          <div className="gallery-search">
            <Search size={15} />
            <input
              aria-label="Search components"
              placeholder="Find your next component…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {visible.length} components found
        </p>
        <div className="component-grid">
          {visible.map((item, index) => (
            <article className={`component-card preview-${item.name}`} key={item.name}>
              <div className="card-demo-label">
                <span className="mono">
                  {String(catalog.findIndex((entry) => entry.name === item.name) + 1).padStart(
                    2,
                    "0",
                  )}
                </span>
                <span className="demo-live">
                  <span />
                  INTERACTIVE
                </span>
              </div>
              <div className="demo-surface">
                <ComponentDemo name={item.name} />
              </div>
              <div className="component-card-info">
                <div>
                  <Link
                    to="/components/$name/"
                    params={{ name: item.name }}
                    className="component-title"
                  >
                    {item.title}
                    <ArrowUpRight size={16} />
                  </Link>
                  <p>{item.description}</p>
                </div>
                <span className="technique-tag">{item.technique}</span>
              </div>
              <span className="sr-only">
                Component {index + 1} of {visible.length}
              </span>
            </article>
          ))}
        </div>
        {visible.length === 0 && (
          <div className="gallery-empty">
            <Search size={28} />
            <h3>No components found.</h3>
            <p>Try another search, or give everything a look.</p>
            <button
              type="button"
              className="demo-action"
              onClick={() => {
                setQuery("");
                setCategory("All components");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <div className="collection-bottom">
          <span>
            <span className="live-dot" />
            Every preview is interactive. Click, hover, explore.
          </span>
          <a href="https://github.com/pulkitxm/hugsy/issues">
            Have something in mind? Request a component
            <ArrowUpRight size={13} />
          </a>
        </div>
      </section>
      <section className="ownership section-width">
        <div className="ownership-copy">
          <span className="eyebrow">YOUR CODE. YOUR CALL.</span>
          <h2>
            Not installed.
            <br />
            <em>Adopted.</em>
          </h2>
          <p>
            No package to wrestle with. No version to chase.
            <br />
            Just SwiftUI source that becomes part of your project.
          </p>
          <Link to="/docs/" className="text-link">
            Meet your new workflow
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="ownership-terminal">
          <CodeBlock
            code={
              "hugsy init\nhugsy add command-palette toast-stack\n\nhugsy list --json\nhugsy mcp"
            }
          />
          <div className="terminal-caption">
            <span>
              <Check size={13} />
              Offline-ready CLI
            </span>
            <span>
              <Check size={13} />
              Local MCP
            </span>
            <span>
              <Check size={13} />
              Agent-friendly
            </span>
          </div>
        </div>
      </section>
      <section className="closing section-width">
        <span className="closing-asterisk" aria-hidden="true">
          ✳
        </span>
        <h2>
          Make something that <em>feels</em> like something.
        </h2>
        <a href="https://github.com/pulkitxm/hugsy" className="text-link">
          Build with us on GitHub
          <ArrowUpRight size={14} />
        </a>
      </section>
    </>
  );
}
