import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "../components/code-block";
import { seo } from "../lib/seo";
import { firstComponent, installCommand, manualInstall, packageConfig } from "../lib/snippets";

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
        <p>One Swift file. No dependency in your app.</p>
      </div>
      <div className="prose">
        <section className="doc-section first-section" id="copy">
          <h2>Copy a component</h2>
          <ol>
            <li>
              Open a <Link to="/components/">component page</Link> and select{" "}
              <strong>Source</strong>.
            </li>
            <li>Copy the Swift file into your project.</li>
            <li>
              In Xcode, select the file and confirm your iOS app is checked under{" "}
              <strong>Target Membership</strong>.
            </li>
            <li>
              Use the component in your SwiftUI view. Keep its supporting types in the same file.
            </li>
          </ol>
          <p>
            Nothing needs to be added to Package Dependencies. Retain the MIT license notice when
            adopting source.
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
            Replace <code>YourApp</code> with your project’s actual directory. The CLI creates a
            small configuration file, previews the write plan, then copies the source. It does not
            edit your Xcode project.
          </p>
          <CodeBlock label="hugsy.json" code={packageConfig} />
          <p>
            For a Swift package, choose a directory inside the appropriate source target, such as{" "}
            <code>Sources/YourApp/Hugsy</code>. For a traditional Xcode app, confirm Target
            Membership after adding the files.
          </p>
        </section>
        <section className="doc-section">
          <h2>Your changes stay yours</h2>
          <p>
            Installing an unchanged component twice is safe. If you customize a file, Hugsy refuses
            to overwrite it. Run <code>hugsy diff expanding-cards</code> to compare your source
            before explicitly opting into <code>--force</code>.
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
