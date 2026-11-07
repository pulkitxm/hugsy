import Hugsy
import SwiftUI
import Testing

@Suite @MainActor struct HugsyTests {
  private struct Sample: Identifiable { let id: String }

  @Test func allViewsAcceptEmptyCollections() {
    _ = HugsySwipeDeck(items: .constant([Sample]())) { item, _ in Text(item.id) }
    _ = HugsyParallaxCarousel(items: [Sample](), selection: .constant(nil)) { item in
      Text(item.id)
    }
    _ = HugsyMorphingCapsule(phase: .constant(.compact)) { phase in Text(phase.rawValue) }
    _ = HugsyRadialMenu(actions: [], isExpanded: .constant(false))
    _ = HugsyExpandingCards(items: [Sample](), selection: .constant(nil)) { item, _ in
      Text(item.id)
    }
    _ = HugsyStackedCards(items: .constant([Sample]())) { item in Text(item.id) }
  }

  @Test func invalidSizesAreClampedToUsableBounds() {
    let deck = HugsySwipeDeck(
      items: .constant([Sample]()), visibleCount: 40, threshold: -10
    ) { item, _ in Text(item.id) }
    #expect(deck.visibleCount == 5)
    #expect(deck.threshold == 44)
    #expect(
      HugsySwipeDeck(items: .constant([Sample]()), visibleCount: 0) { item, _ in Text(item.id) }
        .visibleCount == 1)
    let carousel = HugsyParallaxCarousel(
      items: [Sample](), selection: .constant(nil), spacing: -4, peek: -10, parallax: 900
    ) { item in Text(item.id) }
    #expect(carousel.spacing == 0)
    #expect(carousel.peek == 0)
    #expect(carousel.parallax == 120)
    let cards = HugsyExpandingCards(
      items: [Sample](), selection: .constant(nil), cardHeight: -10, expandedHeight: -20
    ) { item, _ in Text(item.id) }
    #expect(cards.cardHeight == 44)
    #expect(cards.expandedHeight == 44)
    #expect(HugsyRadialMenu(actions: [], isExpanded: .constant(false), radius: -10).radius == 70)
    let stack = HugsyStackedCards(
      items: .constant([Sample]()), visibleCount: 40, cardHeight: -10, threshold: -5
    ) { item in Text(item.id) }
    #expect(stack.visibleCount == 5)
    #expect(stack.cardHeight == 44)
    #expect(stack.threshold == 44)
  }

  @Test func capsuleSizesGrowMonotonically() {
    let capsule = HugsyMorphingCapsule(
      phase: .constant(.compact), compactSize: CGSize(width: 10, height: 10),
      alertSize: CGSize(width: 20, height: 5), expandedSize: .zero
    ) { phase in Text(phase.rawValue) }
    #expect(capsule.compactSize == CGSize(width: 44, height: 28))
    #expect(capsule.alertSize == CGSize(width: 44, height: 28))
    #expect(capsule.expandedSize == CGSize(width: 44, height: 28))
    #expect(HugsyCapsulePhase.allCases == [.compact, .alert, .expanded])
    #expect(HugsySwipeDirection.allCases == [.left, .right])
  }
}
