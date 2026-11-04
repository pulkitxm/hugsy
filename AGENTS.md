# Working on Hugsy

Hugsy is an animation-heavy, iOS-first, copy-and-own SwiftUI registry. Do not add basic controls or introduce third-party Swift runtime dependencies into adopting apps.

- The source of truth is `registry/catalog.json` and `registry/swift/`. `registry/catalog.ts` validates website metadata. The Swift build plugin compiles the same metadata and source into the native CLI. Never edit generated registry files.
- Run `bun install --frozen-lockfile`, `bun run build`, then `bun run ci` and `bun run test:e2e`.
- On macOS, also run `bun run check:swift` with a full Xcode toolchain.
- Keep `strict`, unchecked-index checks, exact optional properties, and unused-code checks enabled. No `any`, assertions, non-null assertions, or type-error suppressions.
- No prose comments in code. Functional compiler, formatter, and accessibility-lint directives are the only exceptions. Explain decisions in documentation and names.
- Every animation must respect Reduce Motion. Keep native labels, keyboard access, stable IDs, and an alternative to drag-only interactions.
- Native captures and interactive browser studies must be labeled accurately. Present native iOS captures inside an iPhone device, not as desktop web widgets.
- New components need source, metadata, interaction states, usage, a browser demo, and compilation in the native gallery.
- Pages deploys only `dist/client`. Never introduce runtime server functions, secrets, analytics, or external fonts.
- Keep website, build, and capture automation in TypeScript. Do not introduce Python. Swift is for the native components, example app, CLI, and MCP server.
- Maintain the `/hugsy/` base path, unique canonical URLs, prerendered content, and gzip budgets.
- Use synthetic demo content. Never publish project data or credentials in screenshots or logs.
- Use Pukbot for supported GitHub writes, checkpoint commits, and squash merges. PR descriptions must be one line.

## Using the registry

Run `hugsy list --json`, then `hugsy info <name> --json`. Inspect the app target and iOS deployment target before installing. Run `hugsy add <name> --dry-run --json` first. Never use `--force` without explicit approval. Installation uses native Swift tooling, never npm.

`hugsy mcp` exposes read-only tools, resources, and an integration prompt over stdio. The local CLI performs writes, not the MCP server.
