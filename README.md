# hugsy

Expressive, source-owned SwiftUI components for iOS.

[Website](https://hugsi.pulkit.page/) · [Components](https://hugsi.pulkit.page/components/) · [Documentation](https://hugsi.pulkit.page/docs/)

Hugsy focuses on difficult interactions: expanding cards, gesture-driven sheets, radial actions, spring-reflow toasts, shared-geometry tabs, and stretchy headers. Each component is a standalone Swift file. Your app gains no third-party runtime dependency.

## Use a component

Copy source from a component page into your iOS app and confirm its Xcode Target Membership. Requires iOS 17+ and Swift 6. Retain the MIT license notice.

Or install the native Swift CLI on a Mac with Xcode:

```sh
curl -fsSL https://hugsi.pulkit.page/install.sh | sh
hugsy init --directory YourApp/Components/Hugsy
hugsy add expanding-cards --dry-run
hugsy add expanding-cards
```

The installer verifies a pinned source archive, builds with Swift, and installs to `~/.local/bin`. Add that directory to PATH. CLI and MCP operations work offline after the first build. No JavaScript runtime is required to use the components, CLI, or MCP server.

```sh
hugsy list --json
hugsy info expanding-cards --json
hugsy diff expanding-cards
hugsy doctor
hugsy mcp
```

Customized files are preserved unless you explicitly use `--force`. The installer never edits Xcode project files.

## MCP

`hugsy mcp` exposes read-only search, full Swift source, installation planning, resources, and an integration prompt over stdio. Get host configuration with `hugsy mcp-config`. MCP does not inspect or write your project.

## Native previews

The iPhone previews are real SwiftUI captures from a dedicated simulator using fictional content. The sample app is in `examples/`.

```sh
sh scripts/build-ios.sh
```

The same views can be exercised on macOS with `swift run HugsyGallery`. Capture automation is TypeScript in `scripts/capture-native.ts`. It only accepts a dedicated simulator named `Hugsy Preview`.

## Website development

The static website uses TanStack Start, TypeScript, and Bun. Syntax highlighting is generated at build time. GitHub Pages hosts only prerendered HTML and static assets.

```sh
bun install --frozen-lockfile
bun run dev
bun run ci
bun run test:e2e
bun run check:swift
bun run test:protocol
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for checks and the no-comment policy. MIT licensed.
