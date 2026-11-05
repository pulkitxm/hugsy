# Working on Hugsy

Hugsy is an animation-heavy, iOS-first, copy-and-own registry. Every component ships a SwiftUI view and a UIKit view controller adapter. Do not add basic controls or introduce third-party Swift runtime dependencies into adopting apps.

- The source of truth is `registry/catalog.json` and `registry/swift/`. `registry/catalog.ts` validates website metadata. The Swift build plugin compiles the same metadata and source into the native CLI. Never edit generated registry files.
- Run `bun install --frozen-lockfile`, `bun run build`, then `bun run ci` and `bun run test:e2e`.
- On macOS, also run `bun run check:swift` with a full Xcode toolchain.
- Keep `strict`, unchecked-index checks, exact optional properties, and unused-code checks enabled. No `any`, assertions, non-null assertions, or type-error suppressions.
- No prose comments in code. Functional compiler, formatter, and accessibility-lint directives are the only exceptions. Explain decisions in documentation and names.
- Every animation must respect Reduce Motion. Keep native labels, keyboard access, stable IDs, and an alternative to drag-only interactions.
- Keep the catalog to a small set of animated components. Each needs a SwiftUI view, a UIKit adapter named `<Component>ViewController.swift` guarded by `#if canImport(UIKit)` that depends on `uikit-bridge`, and a demo in the native gallery for both frameworks.
- New components need source, metadata, interaction states, SwiftUI and UIKit usage, compilation in the native gallery, and an interactive web demo registered in `src/demos/registry.ts`.
- Device previews are pure CSS frames (`src/components/device.tsx`) hosting lazily loaded web demos. Keep frames faithful to real hardware proportions. Size demo content in `--pt` screen points, respect `--safe-top` and `--safe-bottom`, label previews as interactive web previews, and never ship recorded media or device images.
- Theme colors are CSS variables using `light-dark()`. Never swap themes from React or read the theme during render. The inline `<head>` script in `src/lib/theme.ts` applies a saved choice before first paint.
- Every page has a Markdown version at the same path with `.md`, generated from its rendered HTML by `scripts/markdown-pages.ts`. Add new routes to `sitePaths` there.
- Pages deploys only `dist/client`. Never introduce runtime server functions, secrets, analytics, or external fonts.
- Keep website and build automation in TypeScript. Do not introduce Python. Swift is for the native components, example app, CLI, and MCP server.
- Maintain root-path routing on `https://hugsy.pulkit.page`, unique canonical URLs, prerendered content, and per-page gzip budgets. Keep runtime validation libraries out of the client; validate at build time and emit typed modules.
- Use synthetic demo content. Never publish project data or credentials in screenshots or logs.
- Use Pukbot for supported GitHub writes, checkpoint commits, and squash merges. PR descriptions must be one line.

## Using the registry

Run `hugsy list --json`, then `hugsy info <name> --json`. Inspect the app target and iOS deployment target before installing. Run `hugsy add <name> --dry-run --json` first. Never use `--force` without explicit approval. Installation uses native Swift tooling, never npm.

`hugsy mcp` exposes read-only tools, resources, and an integration prompt over stdio. The local CLI performs writes, not the MCP server.
