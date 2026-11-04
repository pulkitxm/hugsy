# Contributing

Hugsy focuses on iOS interactions that take real work: coordinated geometry, gesture-driven state, accessibility, and interruptible animation. Please open an issue before expanding the collection.

## Develop

The website and capture tooling use TypeScript and Bun 1.4.2. Swift work requires Xcode, macOS, and Swift 6. Do not introduce Python. Native components, the CLI, and MCP do not require a JavaScript runtime.

```sh
bun install --frozen-lockfile
bun run dev
```

The development site is at `http://localhost:3000/hugsy/`. The static preview is at `http://127.0.0.1:4173/hugsy/`.

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

If Command Line Tools is selected, prefix Swift commands with `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`. Use a dedicated simulator named `Hugsy Preview` for captures. Set its UUID in `HUGSY_SIMULATOR`, then run `bun scripts/capture-native.ts`. Never use a personal simulator for evidence.

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

## Pull requests

Use conventional titles and commits, a single-line description, coherent checkpoint commits, and small diffs. No prose comments in code. Put rationale in names and documentation. Never add attribution trailers. Use Pukbot for supported GitHub operations and squash merges.

Visual changes need end-result evidence from synthetic fixtures. Never upload private data, original project captures, credentials, or unsanitized local paths.
