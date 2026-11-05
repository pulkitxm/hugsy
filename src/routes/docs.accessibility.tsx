import { createFileRoute, Link } from "@tanstack/react-router";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/docs/accessibility")({
  head: () =>
    seo(
      "Accessibility and motion",
      "Understand Hugsy’s Reduce Motion behavior, VoiceOver labels, gesture alternatives, native semantics, and the testing required before shipping an iOS app.",
      "/docs/accessibility/",
    ),
  component: Accessibility,
});

function Accessibility() {
  return (
    <>
      <div className="page-heading">
        <p className="overline">Building with care</p>
        <h1>Accessibility & motion</h1>
        <p>The interaction is only finished when more people can use it.</p>
      </div>
      <div className="prose">
        <section className="doc-section first-section">
          <h2>Reduce Motion</h2>
          <p>
            Every component reads the system’s <code>accessibilityReduceMotion</code> environment
            value. Spring interpolation, decorative rotation, and extra stretching are disabled or
            simplified. Direct manipulation remains available where it conveys the user’s gesture.
          </p>
          <p>
            Do not remove this behavior when changing animation values. Test with Reduce Motion
            enabled in the device’s accessibility settings, not just by slowing a simulator
            animation.
          </p>
        </section>
        <section className="doc-section">
          <h2>VoiceOver and focus</h2>
          <p>
            Actions use native buttons with labels. The swipe deck exposes named actions for both
            directions, carousel indicators announce their position, collapsed radial actions are
            hidden from accessibility, and expanded card content hides the underlying card list.
            UIKit adapters host the same SwiftUI views, so they keep this behavior.
          </p>
          <p>
            Custom inline surfaces are not system modal presentations. If an interaction must
            prevent access to the rest of a screen, use a native <code>.sheet</code> or another
            appropriate system presentation around it.
          </p>
        </section>
        <section className="doc-section">
          <h2>Alternatives to gestures</h2>
          <p>
            The swipe deck has Skip and Like buttons. Carousel indicators jump to any card. The
            morphing capsule expands with a tap and collapses with Escape. Expanding cards include a
            close button, and the radial menu exposes individual actions as ordinary buttons. Do not
            make dragging the only path through an important workflow.
          </p>
        </section>
        <section className="doc-section">
          <h2>Your content matters</h2>
          <ul>
            <li>Test larger Dynamic Type sizes, long translations, and right-to-left layouts.</li>
            <li>Check color contrast after replacing the sample colors and images.</li>
            <li>
              Use stable, unique IDs so animation and accessibility focus follow the intended item.
            </li>
            <li>Verify behavior with VoiceOver and on a physical iPhone before shipping.</li>
          </ul>
        </section>
        <section className="doc-section">
          <h2>What is tested</h2>
          <p>
            The project compiles the native source for iOS and macOS, tests installer safety and
            registry integrity, renders native views in light and dark appearances, and checks the
            documentation website with automated accessibility and browser tests.
          </p>
          <p>
            Those checks are not a certification of your app, every device, or every
            assistive-technology combination. Your content and integration still require testing.
          </p>
        </section>
        <div className="document-footer">
          <Link to="/docs/mcp/">MCP</Link>
          <Link to="/components/">Explore components</Link>
        </div>
      </div>
    </>
  );
}
