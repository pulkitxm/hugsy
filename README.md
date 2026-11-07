# hugsy

Source-owned iOS components and services, distributed with one native Swift CLI.

[Website](https://hugsy.pulkit.page/) · [Components](https://hugsy.pulkit.page/components/) · [Documentation](https://hugsy.pulkit.page/docs/)

Six animated components: swipe deck, parallax carousel, morphing capsule, expanding cards, radial menu, and stacked cards. Each ships a SwiftUI view and a UIKit view controller, so SwiftUI and UIKit apps adopt the same source. The distribution format also supports Foundation services and other Apple frameworks through multi-file entries, shared dependencies, and binary resources. Adopting apps gain no third-party runtime dependency.

## Use a component

Install the native CLI on a Mac with Xcode:

```sh
curl -fsSL https://hugsy.pulkit.page/install.sh | sh
hugsy init
hugsy add expanding-cards --dry-run
hugsy add expanding-cards
hugsy doctor
```

In Xcode, choose **Add Package Dependencies > Add Local**, select the generated `Hugsy` directory, and attach the **HugsyComponents** library product to your iOS app target. Add `import HugsyComponents` to consuming Swift files, then use the example from `hugsy info expanding-cards`. Requires iOS 17+ and Swift 6. Installing files does not link the app automatically.

The generated package contains only selected components and their transitive registry dependencies. You can edit its source. Later additions retain earlier selections. Resources are bundled through SwiftPM. Commit the package and `hugsy.json` to your app repository.

The installer verifies a pinned source archive, builds with Swift, and installs to `~/.local/bin`. Add that directory to PATH. CLI and MCP operations work offline after the first build. No JavaScript runtime is required.

```sh
hugsy list --json
hugsy info expanding-cards --json
hugsy diff expanding-cards
hugsy doctor
hugsy mcp
```

Customized files are preserved unless you explicitly use `--force`. Unmodified files can update using hashes recorded in `hugsy.lock.json`. The installer never edits Xcode project files or runs package installation scripts.

## Other distribution modes

For direct copying, start in a separate destination with `hugsy init --distribution source --directory YourApp/Components/Hugsy`. Add installed source to the app target and use its types directly, without importing the directory name. Resource-bearing entries require package mode. You may also copy the current standalone components from the website. Retain the MIT license notice.

For the whole current catalog as an upstream dependency, add `https://github.com/pulkitxm/hugsy` in Xcode, select the **Hugsy** product, and use `import Hugsy`. Select a reviewed revision until version tags are published. This is distinct from the editable, selective local package.

Version 1 configurations are rejected. Review existing copied files, choose a fresh destination, and replace `hugsy.json` deliberately before initializing version 2. See the [distribution plan](docs/distribution.md) for architecture, resource paths, future image-cache adapters, and release policy.

## MCP

`hugsy mcp` exposes read-only search, full Swift source, installation planning, resources, and an integration prompt over stdio. Get host configuration with `hugsy mcp-config`. MCP does not inspect or write your project.

## UIKit

Every component installs a view controller next to its SwiftUI view. Add it with standard view controller containment and supply your own `UIView` for each item:

```swift
let deck = HugsySwipeDeckViewController(items: cards) { card in
  CardView(card: card)
}
deck.didSwipe = { card, direction in print(card.id, direction) }
addChild(deck)
view.addSubview(deck.view)
deck.didMove(toParent: self)
```

The adapters share the `uikit-bridge` entry, which the CLI installs automatically. Adapter files compile only where UIKit is available.

## Native gallery

The sample app in `examples/` shows every component in SwiftUI and in UIKit with synthetic content.

```sh
sh scripts/build-ios.sh
swift run HugsyGallery
```

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
