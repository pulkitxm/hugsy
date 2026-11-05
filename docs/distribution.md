# Component distribution

## Decision

Use one native CLI and one registry for iOS components and services. Every
current component ships a SwiftUI view and a UIKit adapter. UIKit,
Foundation, MapKit, WebKit, AVKit, SpriteKit, SceneKit, RealityKit, ARKit, Metal,
Core Image, Core ML, and other system frameworks can use the same pipeline.
Framework metadata describes requirements; it does not imply catalog coverage.

The default installation is an editable local Swift package named
`HugsyComponents`. Users attach its library product to their app target once and
write `import HugsyComponents`. Subsequent additions are discovered by SwiftPM.
No project-file parser or automatic Xcode project rewriting is required.

An explicit `source` distribution copies source into a caller-selected app source
directory. This is suitable for small components and existing package targets.
It requires target membership and does not create a module named after its folder.
Package-only resources are rejected in this mode instead of being silently broken.

## Registry contract

- Each entry declares system frameworks, dependencies on other registry entries,
  and an explicit list of source files and binary-capable resources.
- Files have project-relative, traversal-free paths and individual SHA-256 hashes.
  The CLI embeds the complete payload and works offline.
- Dependencies resolve transitively, once each, in deterministic order. Missing
  dependencies, cycles, duplicate paths, and corrupt payloads fail validation.
- The current deployment baseline is iOS 17 and Swift 6. Broader distribution does
  not claim support for older OS versions or non-iOS platforms.
- Dependencies are registry-owned source, not third-party runtime packages.
  Supporting arbitrary external packages requires a separate policy decision.
- All selected source compiles into one `HugsyComponents` module. Registry
  dependencies share that module, so do not import them as separate modules.
  Prefix public and helper symbols to avoid collisions between entries.

## Installed layout

```text
hugsy.json
Hugsy/
  Package.swift
  LICENSE
  hugsy.lock.json
  Sources/HugsyComponents/
    expanding-cards/HugsyExpandingCards.swift
    Resources/<component>/<resource path>
```

`hugsy.lock.json` records the selected entries and the original hashes of installed
files. Adding another entry retains previous selections. Unmodified older source
can update; customized source requires an explicit `--force`. Generated manifests
and licenses receive the same conflict protection. State is installer-managed;
malformed or incompatible state is rejected. Removed upstream files are not
silently deleted; installations requiring removals fail with a
manual reconciliation message.

Resources are copied as a directory and accessed using `Bundle.module` beneath
`Resources/<component>/`. This preserves filenames and binary contents without
flattening collisions. Source authors use conditional compilation for code that
also supports direct copying. Resource-dependent entries require package mode.

## Developer workflow

```sh
hugsy list --json
hugsy info expanding-cards --json
hugsy init
hugsy add expanding-cards --dry-run
hugsy add expanding-cards
hugsy doctor
```

Then use Xcode's Add Package Dependencies > Add Local, select `Hugsy`, and attach
`HugsyComponents` to the iOS app target. The CLI reports this step, the required
import, and usage instead of claiming that writing files links the app.

For direct source adoption, initialize explicitly with
`hugsy init --distribution source --directory YourApp/Components/Hugsy`.
Version 1 configurations must be deliberately replaced with version 2 after
reviewing existing source. No implicit migration changes ownership or layout.

## Release and growth

The repository's existing remote `Hugsy` product remains available through SwiftPM
for consumers who want the whole current catalog as an upstream dependency. Use
a reviewed revision until semantic-version tags exist. Do not advertise an
unpublished version. Its CLI dependencies are tooling, not app runtime products.

Future complex features should separate reusable services from UI adapters. For
example, a Foundation image-cache entry can supply shared source to separate UIKit
and SwiftUI image components through registry dependency edges. Do not build an
image cache solely to demonstrate packaging. Validate this contract with synthetic
multi-file, mixed-framework, dependency, and binary-resource fixtures instead.

Other iOS feature areas include Swift Charts, WidgetKit, App Intents, MapKit,
WebKit, AVFoundation, SpriteKit, RealityKit, SwiftData, Core Data, Combine, and
Observation. Their source can use the same registry contract. Feature-specific
entitlements, privacy declarations, extensions, model compilation, and app setup
remain explicit integration requirements, not work that writing a package can
silently perform. This implementation packages Swift source and copied resources;
it is not a replacement for every framework's specialized build pipeline.

Only introduce separate remote packages when independent release cycles, external
dependencies, licensing, or platform requirements justify them. Binary XCFramework
distribution is deferred until there is a real binary-only requirement.

## Acceptance

Test both distributions, repeated and incremental installs, dependency validation,
edit preservation, update hashes, resources, unsafe paths, symlinks, and rollback.
Build the generated package and a synthetic consuming module, including UIKit and
Foundation fixtures. Keep CLI JSON, MCP plans, website instructions, and README in
agreement. Run repository, Swift, protocol, and browser checks before opening the PR.
