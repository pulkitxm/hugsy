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
    _ = HugsyCommandPalette(commands: []) {}
    _ = HugsyFluidTabs(tabs: [], selection: .constant(""))
    _ = HugsyMagnifyingDock(items: [])
    _ = HugsyAnimatedSidebar(title: "Empty", items: [], selection: .constant(""))
    _ = HugsyCardStack(items: [HugsySidebarItem]()) { Text($0.title) }
    _ = HugsyToastStack(toasts: HugsyToasts())
  }
}
