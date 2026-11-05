import SwiftUI

#if SWIFT_PACKAGE
  import Hugsy
#endif

@main struct HugsyGallery: App {
  var body: some Scene {
    WindowGroup {
      GalleryList()
        #if os(macOS)
          .frame(minWidth: 402, minHeight: 874)
        #endif
    }
  }
}

enum GalleryDemo: String, CaseIterable, Identifiable {
  case swipeDeck = "swipe-deck"
  case parallaxCarousel = "parallax-carousel"
  case morphingCapsule = "morphing-capsule"
  case expandingCards = "expanding-cards"
  case radialMenu = "radial-menu"

  var id: String { rawValue }

  var title: String {
    switch self {
    case .swipeDeck: "Swipe deck"
    case .parallaxCarousel: "Parallax carousel"
    case .morphingCapsule: "Morphing capsule"
    case .expandingCards: "Expanding cards"
    case .radialMenu: "Radial menu"
    }
  }

  @MainActor @ViewBuilder var swiftUI: some View {
    switch self {
    case .swipeDeck: SwipeDeckDemo()
    case .parallaxCarousel: ParallaxCarouselDemo()
    case .morphingCapsule: MorphingCapsuleDemo()
    case .expandingCards: ExpandingCardsDemo()
    case .radialMenu: RadialMenuDemo()
    }
  }
}

struct GalleryList: View {
  var body: some View {
    NavigationStack {
      List {
        Section("SwiftUI") {
          ForEach(GalleryDemo.allCases) { demo in
            NavigationLink(demo.title) {
              demo.swiftUI.navigationTitle(demo.title)
            }
          }
        }
        #if os(iOS)
          Section("UIKit") {
            ForEach(GalleryDemo.allCases) { demo in
              NavigationLink(demo.title) {
                UIKitDemo(demo: demo).ignoresSafeArea(edges: .bottom).navigationTitle(demo.title)
              }
            }
          }
        #endif
      }
      .navigationTitle("Hugsy")
    }
  }
}
