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

  private struct Sample: Identifiable { let id: String }

  @Test func invalidSizesAreClampedToUsableBounds() {
    let sheet = HugsyMorphingSheet(
      position: .constant(.compact), compactHeight: -100, expandedHeight: -100
    ) { _ in Text("Details") }
    #expect(sheet.compactHeight == 100)
    #expect(sheet.expandedHeight == 144)
    let cards = HugsyExpandingCards(
      items: [Sample](), selection: .constant(nil), cardHeight: -10, expandedHeight: -20
    ) { item, _ in Text(item.id) }
    #expect(cards.cardHeight == 44)
    #expect(cards.expandedHeight == 44)
    #expect(HugsyRadialMenu(actions: [], isExpanded: .constant(false), radius: -10).radius == 70)
  }

}
