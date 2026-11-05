# Contributing

Hugsy focuses on iOS interactions that take real work: coordinated geometry, gesture-driven state, accessibility, and interruptible animation. Please open an issue before expanding the collection.

## Develop

The website and build tooling use TypeScript and Bun 1.4.2. Swift work requires Xcode, macOS, and Swift 6. Do not introduce Python. Native components, the CLI, and MCP do not require a JavaScript runtime.

```sh
bun install --frozen-lockfile
bun run dev
```

The development site is at `http://localhost:3000/`. The static preview is at `http://127.0.0.1:4173/`.

```sh
bun run build
bun run ci
bunx playwright install chromium
bun run test:e2e
bun run check:lighthouse
bun run check:swift
bun run test:protocol
sh scripts/build-ios.sh
```

If Command Line Tools is selected, prefix Swift commands with `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`.

## Adding a component

Add the SwiftUI view and its UIKit adapter to `registry/swift/`, list both files in `registry/catalog.json` with `uikit-bridge` as a dependency, document parameters in `registry/parameters.ts`, and add both demos to the native gallery in `examples/`. The installed package test compiles a consumer that uses SwiftUI and UIKit together.

## Interactive previews

Component pages show each component inside a CSS device frame that switches between an iPhone 17 Pro, an 11-inch iPad Pro, and a 14-inch MacBook Pro. The frame is `src/components/device.tsx` with styles in `src/styles/device.css`. It follows real hardware proportions and uses no images or third-party libraries.

Each demo is a lazily loaded React module in `src/demos/`, registered in `src/demos/registry.ts` with one or more screens. A component with several screens gets a screen switcher automatically. Size demo content with the `--pt` custom property, which equals one screen point of the current device, so the same demo scales across frames. Apps draw under the status bar as they do on iOS, so offset content with `--safe-top` and `--safe-bottom`. On Mac, demos run inside a desktop window. Use container queries on `screen` for layouts that change between devices. Drive gestures with pointer events, keep a button or keyboard alternative for every gesture, and use the shared `--spring-*` easing curves.

Highlighted source for a component page is generated per page into `generated/pages/` and loaded by that route, so other pages never download it. `bun scripts/check-site.ts` enforces an initial JavaScript budget for every page and a size limit for lazy chunks.

## Theme and Markdown pages

Colors are CSS variables built with `light-dark()`, so the first paint follows the visitor's system preference without JavaScript. A saved choice is applied by a small script in the prerendered `<head>`, before the body paints. The site is static, so a per-visitor theme cannot be part of the HTML itself.

Every page has a Markdown version, such as `/docs/cli.md` for `/docs/cli/`, linked from the footer. `scripts/markdown-pages.ts` converts the rendered HTML, so the two never drift. It writes static files after the build and serves the same output from the development server.

## Required checks

- Biome formatting and recommended rules, all accessibility and security rules, strict unused-code rules, and type-aware promise checks.
- Strict TypeScript, exact optional properties, unchecked-index checks, no unused declarations, and no unsafe type escapes.
- Parser-backed comment checks, punctuation, text hygiene, repository health, Markdown, HTML, YAML, and EditorConfig validation.
- Dead-code and dependency checks, installer unit tests, CLI and MCP protocol tests, and coverage thresholds.
- Native Swift formatting, warnings-as-errors builds, Swift 6 strict concurrency, and native tests.
- Desktop and mobile interactions, automated WCAG checks on every route, reduced motion, static 404s, and direct links.
- Prerendered HTML, canonical URLs, local links, registry schemas, CLI package installation, and asset budgets.
- Lighthouse performance at least 95, accessibility, best practices, and SEO at 100, with a layout-shift limit of 0.05.
- Workflow validation, workflow security, secrets, high-severity dependency audit, dependency review, CodeQL, and scheduled deeper scans.

Automated accessibility checks are not a VoiceOver certification. Test the native gallery with a keyboard and assistive technology before changing an interaction contract.

## Intentional configuration choices

`skipLibCheck` skips vendor declaration internals, not project code. The generated route tree is ignored by formatting and policy checks, but remains in the TypeScript program.

Biome's `useLiteralKeys` conflicts with TypeScript's index-signature property-access rule. It is disabled for TypeScript. CSS specificity ordering is disabled only in `src/theme.css` because the rule compares unrelated component selectors across independent scopes. Functional accessibility directives permit keyboard focus on scrollable source blocks.

The secret scanner's entropy threshold accommodates Swift source examples. Gitleaks scans independently. Patched `basic-ftp` and `re2js` overrides fix development-tool advisories; revisit them when upstream tool ranges include the fixes. The blocking audit threshold is high severity, not a claim that every transitive advisory is absent.

The required `CI` job combines source checks, desktop and mobile browser tests, Lighthouse, native Swift compilation, native tests, CLI/MCP interoperability, workflow security, shell checks, and secret scanning. Pages publishes the exact tested artifact only after that gate passes. CodeQL covers TypeScript, Swift, and workflows. Dependency review runs on pull requests; Trivy, SBOM generation, and Scorecard run weekly or on demand. Dependency updates cover Bun, Swift, and pinned actions.

Native image-rendering tests run on Apple Silicon because the Intel runner's virtual Metal device cannot reliably render SwiftUI. Compilation, non-rendering tests, package consumers, and CLI/MCP behavior run in a separate Apple Silicon job. Both jobs block publication. Swift scanning uses the same runner pool. `bun run check:swift` continues to run the complete native suite locally.

## Pull requests

Use conventional titles and commits, a single-line description, coherent checkpoint commits, and small diffs. No prose comments in code. Put rationale in names and documentation. Never add attribution trailers. Use Pukbot for supported GitHub operations and squash merges.

Visual changes need end-result evidence from synthetic fixtures. Never upload private data, original project captures, credentials, or unsanitized local paths.
