import SwiftUI

#if SWIFT_PACKAGE
  import HugsyPreviewKit
#endif

@main struct HugsyGallery: App {
  var body: some Scene {
    WindowGroup {
      PreviewHost(registrations: ComponentPreviews.all)
        #if os(macOS)
          .frame(width: 390, height: 844)
        #endif
    }
  }
}

@MainActor enum ComponentPreviews {
  static let all: [PreviewRegistration] = [
    .init("expanding-cards") { ExpandingCardsPreview(session: $0) },
    .init("morphing-sheet") { MorphingSheetPreview(session: $0) },
    .init("radial-menu") { RadialMenuPreview(session: $0) },
    .init("toast-stack") { ToastStackPreview(session: $0) },
    .init("fluid-tabs") { FluidTabsPreview(session: $0) },
    .init("stretchy-header") { StretchyHeaderPreview(session: $0) },
  ]
}
