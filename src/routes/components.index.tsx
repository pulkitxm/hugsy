import { createFileRoute } from "@tanstack/react-router";
import { components } from "../../generated/components";
import { ArrowUpRight } from "../components/icons";
import { LibraryNav } from "../components/library-nav";
import { ShowcaseCard } from "../components/showcase-card";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/components/")({
  head: () =>
    seo(
      "Components",
      "Five animated iOS components for SwiftUI and UIKit: swipe deck, parallax carousel, morphing capsule, expanding cards, and radial menu.",
      "/components/",
    ),
  component: Components,
});

function Components() {
  return (
    <div className="library-layout container">
      <LibraryNav />
      <div className="gallery-page">
        <div className="page-heading">
          <h1>Components</h1>
          <p>Every one is live. Try it here, then add it to your app in SwiftUI or UIKit.</p>
        </div>
        <section className="component-gallery" aria-label="All components">
          {components.map((item) => (
            <ShowcaseCard
              key={item.name}
              name={item.name}
              title={item.title}
              description={item.description}
            />
          ))}
          <a
            className="preview-frame gallery-suggest"
            href="https://github.com/pulkitxm/hugsy/issues"
          >
            <strong>Missing something?</strong>
            <span>Suggest the next animated component.</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
        </section>
      </div>
    </div>
  );
}
