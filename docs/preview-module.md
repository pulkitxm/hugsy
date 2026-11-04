# Native preview module

HugsyPreviewKit shares preview sessions across the native gallery, automated captures, and component pages. The website plays lightweight native recordings by default. A local simulator is optional and starts only after choosing **Try live locally**.

The component is rendered by its actual Apple-framework implementation. The browser never recreates its typography, materials, gestures, or layout with HTML. It scales the complete captured screen without cropping it.

## One definition, several consumers

```text
registry/catalog.json
  preview screens, states, assets, and timelines
          |
          +-- HugsyPreviewKit: validated native session and flow playback
          +-- native gallery: registered component-specific views
          +-- capture-native.ts: posters and recordings for every screen
          +-- component page: screen selection and native playback
```

`registry/preview.ts` and `tools/Models/PreviewModels.swift` validate the same structure. Unknown states, invalid destinations, duplicate IDs, unsafe asset names, and unbounded recordings are rejected. Non-visual services can omit `preview`; they are still distributable through the framework-neutral package installer.

## Add a component preview

Add the component's source and normal distribution metadata first. Then add a `preview` definition to its catalog entry:

```json
{
  "headline": "A native workflow.",
  "initialScreen": "list",
  "screens": [
    {
      "id": "list",
      "label": "Collection",
      "asset": "example-list",
      "initialState": "ready",
      "states": ["ready", "empty"],
      "timeline": [
        { "screen": "list", "state": "ready", "durationMilliseconds": 1200 },
        { "screen": "detail", "state": "open", "durationMilliseconds": 1800 }
      ]
    },
    {
      "id": "detail",
      "label": "Details",
      "asset": "example-detail",
      "initialState": "open",
      "states": ["open"],
      "timeline": [{ "screen": "detail", "state": "open", "durationMilliseconds": 1800 }]
    }
  ]
}
```

Create one renderer in `examples/PreviewScenes/`, accepting a `PreviewSession`, and add one registration to `ComponentPreviews.all` in `examples/Gallery.swift`:

```swift
.init("example") { ExamplePreview(session: $0) }
```

Use `session.screen.id` and `session.state` to resolve the declared configuration. Native bindings can call `session.show(screen:)` and `session.select(state:)`. The session validates transitions before changing state. `PreviewScaffold` and synthetic artwork are optional helpers, not required application chrome. Complex scenes can own a native navigation stack, sheets, or UIKit representables.

Do not add component-specific branches to the host, recorder, or website. `FluidTabsPreview` demonstrates three screens with cross-screen timelines. `ExpandingCardsPreview` demonstrates several states within one screen.

## Capture and verify

Use only a dedicated iPhone simulator named `Hugsy Preview`. Set its UUID in `HUGSY_SIMULATOR`, then run:

```sh
HUGSY_COMPONENTS=fluid-tabs bun scripts/capture-native.ts
bun run build
bun run ci
bun run test:e2e
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer bun run check:swift
```

The recorder selects each declared screen, captures its initial state, waits for recording startup, and asks the shared host to play that screen's timeline. Capture length and captions come from the definition. Output uses each screen's `asset` name under `public/native/`.

All fixtures must be synthetic. Review the encoded recordings and posters, not only the native source. Device categories must correspond to real, verified native layouts; never stretch an iPhone recording into a Mac or iPad frame.

## Distribution stays independent

The preview module belongs to gallery and capture tooling. Installed components do not import it. Multi-file sources, resources, shared dependencies, package installation, and explicit source-mode installation keep using the distribution registry. Adding a preview must not change the adopting application's runtime dependencies.
