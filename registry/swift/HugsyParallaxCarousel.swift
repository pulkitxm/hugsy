import SwiftUI

public struct HugsyParallaxCarousel<Item: Identifiable, Content: View>: View {
  public let items: [Item]
  public let spacing: CGFloat
  public let peek: CGFloat
  public let parallax: CGFloat
  public let content: (Item) -> Content
  @Binding public var selection: Item.ID?
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(
    items: [Item], selection: Binding<Item.ID?>, spacing: CGFloat = 14, peek: CGFloat = 48,
    parallax: CGFloat = 48, @ViewBuilder content: @escaping (Item) -> Content
  ) {
    self.items = items
    self._selection = selection
    self.spacing = max(0, spacing)
    self.peek = max(0, peek)
    self.parallax = min(120, max(0, parallax))
    self.content = content
  }

  private var current: Item.ID? { selection ?? items.first?.id }

  public var body: some View {
    VStack(spacing: 18) {
      ScrollView(.horizontal) {
        LazyHStack(spacing: spacing) {
          ForEach(items) { item in
            card(item)
          }
        }
        .scrollTargetLayout()
      }
      .contentMargins(.horizontal, peek, for: .scrollContent)
      .scrollTargetBehavior(.viewAligned)
      .scrollPosition(id: $selection)
      .scrollIndicators(.hidden)
      .scrollClipDisabled()
      indicators
    }
    .onChange(of: items.map(\.id)) { _, ids in
      if let selection, !ids.contains(selection) { self.selection = ids.first }
    }
  }

  private func card(_ item: Item) -> some View {
    let travel = reduceMotion ? 0 : parallax
    let tilt = reduceMotion ? 0.0 : -16.0
    return ZStack {
      content(item)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.horizontal, -travel)
        .scrollTransition(axis: .horizontal) { view, phase in
          view.offset(x: phase.value * -travel)
        }
    }
    .containerRelativeFrame(.horizontal)
    .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
    .scrollTransition(axis: .horizontal) { view, phase in
      view
        .scaleEffect(phase.isIdentity ? 1 : 0.9)
        .rotation3DEffect(
          .degrees(phase.value * tilt), axis: (x: 0, y: 1, z: 0),
          perspective: 0.5
        )
        .opacity(phase.isIdentity ? 1 : 0.72)
    }
    .accessibilityElement(children: .combine)
    .accessibilityAddTraits(current == item.id ? .isSelected : [])
  }

  private var indicators: some View {
    HStack(spacing: 2) {
      ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
        let active = current == item.id
        Button {
          withAnimation(reduceMotion ? nil : .spring(response: 0.5, dampingFraction: 0.86)) {
            selection = item.id
          }
        } label: {
          Capsule()
            .fill(active ? AnyShapeStyle(.primary) : AnyShapeStyle(.secondary.opacity(0.35)))
            .frame(width: active ? 22 : 8, height: 8)
            .frame(minWidth: 30, minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Show item \(index + 1) of \(items.count)")
        .accessibilityAddTraits(active ? .isSelected : [])
      }
    }
    .animation(reduceMotion ? nil : .spring(response: 0.4, dampingFraction: 0.8), value: current)
  }
}
