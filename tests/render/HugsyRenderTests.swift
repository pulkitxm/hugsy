import AppKit
import Hugsy
import SwiftUI
import Testing

@Suite @MainActor struct HugsyRenderTests {
  private struct Sample: Identifiable { let id: String }

  @Test(arguments: [false, true]) func nativeViewsRenderInBothAppearances(dark: Bool) {
    let samples = [Sample(id: "first"), Sample(id: "second"), Sample(id: "third")]
    let content = VStack {
      HugsySwipeDeck(items: .constant(samples)) { item, _ in
        Text(item.id).frame(maxWidth: .infinity, maxHeight: .infinity).background(.orange)
      }
      .frame(height: 300)
      HugsyParallaxCarousel(items: samples, selection: .constant("first")) { item in
        Text(item.id).frame(maxWidth: .infinity, maxHeight: .infinity).background(.teal)
      }
      .frame(height: 200)
      HugsyMorphingCapsule(phase: .constant(.expanded)) { phase in Text(phase.rawValue) }
      HugsyRadialMenu(
        actions: [.init(id: "files", title: "Files", symbol: "folder") {}],
        isExpanded: .constant(true))
      HugsyExpandingCards(items: [Sample(id: "story")], selection: .constant(nil)) { item, _ in
        Text(item.id).frame(maxWidth: .infinity, maxHeight: .infinity).background(.blue)
      }
    }
    .environment(\.colorScheme, dark ? .dark : .light)
    .frame(width: 600, height: 1400)
    let renderer = ImageRenderer(content: content)
    #expect(renderer.nsImage?.size.width == 600)
    #expect(renderer.nsImage?.size.height == 1400)
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

  @Test func capsuleDrawsItsExpandedShapeOnBlack() throws {
    let renderer = ImageRenderer(
      content: HugsyMorphingCapsule(phase: .constant(.expanded)) { _ in Color.clear }
        .frame(width: 400, height: 240).background(.white))
    renderer.scale = 1
    let bitmap = NSBitmapImageRep(cgImage: try #require(renderer.cgImage))
    let center = try #require(bitmap.colorAt(x: 200, y: 120)?.usingColorSpace(.sRGB))
    #expect(center.brightnessComponent < 0.1)
    let corner = try #require(bitmap.colorAt(x: 4, y: 4)?.usingColorSpace(.sRGB))
    #expect(corner.brightnessComponent > 0.9)
  }
}
