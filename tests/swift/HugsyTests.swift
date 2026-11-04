import Hugsy
import SwiftUI
import Testing

@Suite @MainActor struct HugsyTests {
  @Test func toastCapacityIsBoundedAndNewestFirst() {
    let toasts = HugsyToasts()
    for index in 0..<10 { toasts.show("Message \(index)") }
    #expect(toasts.items.count == 4)
    #expect(toasts.items.first?.title == "Message 9")
    #expect(Set(toasts.items.map(\.id)).count == 4)
  }

  @Test func dismissOnlyRemovesTheRequestedToast() {
    let toasts = HugsyToasts()
    toasts.show("First")
    toasts.show("Second")
    let id = toasts.items[0].id
    toasts.dismiss(id)
    toasts.dismiss(id)
    #expect(toasts.items.count == 1)
    #expect(toasts.items.first?.title == "First")
  }

  @Test func toastPreservesItsConfiguration() {
    let toasts = HugsyToasts()
    toasts.show("Offline", symbol: "wifi.slash", duration: .seconds(8))
    #expect(toasts.items.first?.symbol == "wifi.slash")
    #expect(toasts.items.first?.duration == .seconds(8))
  }

  @Test func allViewsAcceptEmptyCollections() {
    _ = HugsyFluidTabs(tabs: [], selection: .constant(""))
    _ = HugsyRadialMenu(actions: [], isExpanded: .constant(false))
    _ = HugsyExpandingCards(items: [Sample](), selection: .constant(nil)) { item, _ in Text(item.id)
    }
    _ = HugsyMorphingSheet(position: .constant(.compact)) { _ in Text("Details") }
    _ = HugsyStretchyHeader {
      Color.blue
    } content: {
      Text("Details")
    }
    _ = HugsyToastStack(toasts: HugsyToasts())
  }

  @Test(arguments: [false, true]) func nativeViewsRenderInBothAppearances(dark: Bool) {
    let toasts = HugsyToasts()
    toasts.show("Synthetic notification")
    let content = VStack {
      HugsyFluidTabs(tabs: ["Overview", "Activity"], selection: .constant("Overview"))
      HugsyRadialMenu(
        actions: [
          .init(id: "files", title: "Files", symbol: "folder") {}
        ], isExpanded: .constant(true))
      HugsyExpandingCards(items: [Sample(id: "story")], selection: .constant(nil)) { item, _ in
        Text(item.id).frame(maxWidth: .infinity, maxHeight: .infinity).background(.blue)
      }
      HugsyMorphingSheet(position: .constant(.compact)) { _ in Text("Now playing") }
      HugsyToastStack(toasts: toasts)
    }
    .environment(\.colorScheme, dark ? .dark : .light)
    .frame(width: 600, height: 1000)
    let renderer = ImageRenderer(content: content)
    #expect(renderer.nsImage?.size.width == 600)
    #expect(renderer.nsImage?.size.height == 1000)
  }

  private struct Sample: Identifiable { let id: String }
}
