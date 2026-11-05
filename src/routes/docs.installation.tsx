import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "../components/code-block";
import { seo } from "../lib/seo";
import {
  firstComponent,
  installCommand,
  manualInstall,
  packageConfig,
  uikitExample,
} from "../lib/snippets";

export const Route = createFileRoute("/docs/installation")({
  head: () =>
    seo(
      "Installation",
      "Install Hugsy with native Swift tooling or copy a component directly into your iOS app. No JavaScript runtime or app package dependency is required.",
      "/docs/installation/",
    ),
  component: Installation,
});

function Installation() {
  return (
    <>
      <div className="page-heading">
        <p className="overline">Getting started</p>
        <h1>Installation</h1>
        <p>One CLI. Editable packages or directly owned source.</p>
      </div>
      <div className="prose">
        <section className="doc-section first-section" id="distribution">
          <h2>Choose your distribution</h2>
          <p>
            The default is a local Swift package containing only your selected components and their
            registry dependencies. It supports multiple Swift files and binary resources, without
            third-party runtime packages. You can edit the installed source.
          </p>
          <p>
            Every component installs a SwiftUI view, a UIKit view controller, and the shared
            <code> uikit-bridge</code> entry. UIKit files compile only where UIKit is available.
          </p>
        </section>
        <section className="doc-section" id="cli">
          <h2>Install the native CLI</h2>
          <p>
            The optional <code>hugsy</code> command is written in Swift. The installer downloads a
            pinned source archive, verifies its SHA-256 checksum, and builds it with your local
            Swift toolchain.
          </p>
          <CodeBlock code={installCommand} />
          <p>
            You need macOS 14+, Xcode, Swift 6, and an internet connection for this first build. The
            command is installed to <code>~/.local/bin</code>. Make sure that directory is on your
            PATH. After installation, discovery, source copying, and MCP work offline.
          </p>
          <p>Prefer to inspect and build it yourself?</p>
          <CodeBlock code={manualInstall} />
          <p>
            If Xcode is installed but Command Line Tools is selected, set{" "}
            <code>DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer</code> for Swift
            commands.
          </p>
        </section>
        <section className="doc-section" id="first-component">
          <h2>Add your first component</h2>
          <CodeBlock code={firstComponent} />
          <p>
            Run these commands from your app repository. The CLI creates the local package in
            <code> Hugsy/</code> and prints the remaining integration steps. It does not edit your
            Xcode project or claim the package has been linked.
          </p>
          <ol>
            <li>
              In Xcode, choose <strong>Add Package Dependencies &gt; Add Local</strong> and select{" "}
              <code>Hugsy</code>.
            </li>
            <li>
              Attach the <strong>HugsyComponents</strong> library product to your iOS app target.
            </li>
            <li>
              Add <code>import HugsyComponents</code> to consuming Swift files.
            </li>
            <li>
              Use the example from <code>hugsy info expanding-cards</code> and build your app.
            </li>
          </ol>
          <CodeBlock label="hugsy.json" code={packageConfig} />
          <p>
            Commit the generated package and configuration to your app repository. Further additions
            retain earlier selections. SwiftPM discovers new source files without adding each file
            to the app target manually. The package requires iOS 17+ and Swift 6.
          </p>
        </section>
        <section className="doc-section" id="uikit">
          <h2>Using UIKit</h2>
          <p>
            Each component has a view controller named after it, such as
            <code> HugsySwipeDeckViewController</code>. Add it as a child view controller, lay out
            its view, and return a configured <code>UIView</code> for each item. Callbacks such as
            <code> didSwipe</code> and <code>didSelect</code> report changes, and properties such as
            <code> items</code> and <code>selection</code> update the component.
          </p>
          <CodeBlock label="UIKit" code={uikitExample} />
        </section>
        <section className="doc-section" id="copy">
          <h2>Prefer direct source?</h2>
          <p>
            Initialize with <code>--distribution source --directory YourApp/Components/Hugsy</code>,
            or copy the current standalone Swift file from a{" "}
            <Link to="/components/">component page</Link>. Confirm the files belong to your app
            target in Xcode. Use the types directly in the same module, without{" "}
            <code>import Hugsy</code> or <code>import HugsyComponents</code>. Resource-bearing
            entries require package mode for <code>Bundle.module</code>. Retain the MIT license
            notice.
          </p>
          <p>
            For an existing Swift package target, source mode can install into
            <code> Sources/YourApp/Hugsy</code>. Never place a generated local package inside an
            existing source target.
          </p>
        </section>
        <section className="doc-section" id="remote">
          <h2>Prefer an upstream package?</h2>
          <p>
            Add <code>https://github.com/pulkitxm/hugsy</code> as a package dependency, attach its
            <strong> Hugsy</strong> product, and use <code>import Hugsy</code>. This includes the
            whole current catalog rather than a selective, editable copy. Choose a reviewed revision
            until version tags are published.
          </p>
        </section>
        <section className="doc-section">
          <h2>Your changes stay yours</h2>
          <p>
            Installing an unchanged component twice is safe. Original hashes in
            <code> hugsy.lock.json</code> allow unmodified source to update. If you customize a
            file, Hugsy refuses to overwrite it. Run <code>hugsy diff expanding-cards</code> to
            compare your source before explicitly opting into <code>--force</code>.
          </p>
          <p>
            Version 1 configurations are rejected. Review existing files and use a fresh destination
            before deliberately replacing the configuration with version 2.
          </p>
          <p>
            Paths must be project-relative and use letters, numbers, underscores, hyphens, and
            forward slashes. Traversal, symlinked destinations, and linked files are rejected.
          </p>
        </section>
        <div className="document-footer">
          <Link to="/docs/">Introduction</Link>
          <Link to="/docs/cli/">
            CLI reference
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}
