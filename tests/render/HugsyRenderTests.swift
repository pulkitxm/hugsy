import AppKit
import Hugsy
import SwiftUI
import Testing

@Suite @MainActor struct HugsyRenderTests {
  private struct Sample: Identifiable { let id: String }

  @Test(arguments: [false, true]) func nativeViewsRenderInBothAppearances(dark: Bool) {
    let toasts = HugsyToasts()
    toasts.show("Synthetic notification")
    let content = VStack {
      HugsyFluidTabs(tabs: ["Overview", "Activity"], selection: .constant("Overview"))
      HugsyRadialMenu(
        actions: [.init(id: "files", title: "Files", symbol: "folder") {}],
        isExpanded: .constant(true))
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

  @Test func expandedCardsStayInsideTheirLayout() throws {
    let content = VStack(spacing: 0) {
      Color.green.frame(height: 40)
      HugsyExpandingCards(
        items: [Sample(id: "first"), Sample(id: "second")], selection: .constant("first"),
        cardHeight: 100, expandedHeight: 200
      ) { _, _ in Color.red }
      Color.blue.frame(height: 40)
    }.frame(width: 200)
    let renderer = ImageRenderer(content: content)
    renderer.scale = 1
    let image = try #require(renderer.cgImage)
    #expect(image.height == 280)
    let bitmap = NSBitmapImageRep(cgImage: image)
    for y in [20, 260] {
      let color = try #require(bitmap.colorAt(x: 100, y: y)?.usingColorSpace(.sRGB))
      #expect(color.redComponent < max(color.greenComponent, color.blueComponent))
    }
    let middle = try #require(bitmap.colorAt(x: 100, y: 140)?.usingColorSpace(.sRGB))
    #expect(middle.redComponent > max(middle.greenComponent, middle.blueComponent))
  }
}
