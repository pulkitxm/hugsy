import { createFileRoute } from "@tanstack/react-router";
import { ComponentList } from "../components/component-list";
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
    <div className="container">
      <div className="page-heading">
        <h1>Components</h1>
        <p>Each one ships a SwiftUI view, a UIKit view controller, and an interactive preview.</p>
      </div>
      <ComponentList />
    </div>
  );
}
