import SwiftUI

public struct HugsyStackedCards<Item: Identifiable, Content: View>: View {
  @Binding public var items: [Item]
  public let visibleCount: Int
  public let cardHeight: CGFloat
  public let threshold: CGFloat
  public let onCycle: @MainActor (Item) -> Void
  public let content: (Item) -> Content
  @State private var offset: CGFloat = 0
  @State private var dragged: Item.ID?
  @State private var cycles = 0
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(
    items: Binding<[Item]>,
    visibleCount: Int = 3,
    cardHeight: CGFloat = 200,
    threshold: CGFloat = 90,
    onCycle: @escaping @MainActor (Item) -> Void = { _ in },
    @ViewBuilder content: @escaping (Item) -> Content
  ) {
    self._items = items
    self.visibleCount = min(5, max(1, visibleCount))
    self.cardHeight = max(44, cardHeight)
    self.threshold = max(44, threshold)
    self.onCycle = onCycle
    self.content = content
  }

  public var body: some View {
    ZStack {
      ForEach(Array(items.prefix(visibleCount).enumerated().reversed()), id: \.element.id) {
        index, item in
        card(item, index: index, top: index == 0)
      }
    }
    .frame(height: cardHeight)
    .onChange(of: items.map(\.id)) { _, ids in
      if let dragged, !ids.contains(dragged) {
        self.dragged = nil
        offset = 0
      }
    }
    #if os(iOS)
      .sensoryFeedback(.impact(weight: .light), trigger: cycles)
    #endif
  }

  private func index(of item: Item) -> Int {
    items.firstIndex(where: { $0.id == item.id }) ?? 0
  }

  private func card(_ item: Item, index: Int, top: Bool) -> some View {
    let depth = Double(index)
    let moving = item.id == dragged
    let tilt = max(-14, min(14, offset / 24))
    return content(item)
      .frame(maxWidth: .infinity)
      .frame(height: cardHeight)
      .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
      .shadow(color: .black.opacity(top ? 0.16 : 0.08), radius: 18, y: 10)
      .scaleEffect(1 - depth * 0.05)
      .offset(y: depth * 14 + (moving ? offset : 0))
      .rotationEffect(.degrees(moving && !reduceMotion ? tilt : 0))
      .zIndex(Double(visibleCount - index))
      .allowsHitTesting(top)
      .accessibilityHidden(!top)
      .accessibilityElement(children: .combine)
      .accessibilityAction(named: Text("Send to back")) { cycle(item) }
      .gesture(
        top
          ? DragGesture(minimumDistance: 12)
            .onChanged { value in
              guard top, dragged == nil else { return }
              dragged = item.id
              offset = value.translation.height
            }
            .onEnded { value in
              guard top, dragged == item.id else { return }
              let travel = value.predictedEndTranslation.height
              if abs(value.translation.height) > threshold || abs(travel) > threshold * 2 {
                cycle(item)
              } else {
                withAnimation(reduceMotion ? nil : .spring(response: 0.8, dampingFraction: 0.7)) {
                  offset = 0
                }
                dragged = nil
              }
            }
          : nil
      )
  }

  private func cycle(_ item: Item) {
    guard dragged == nil || dragged == item.id else { return }
    dragged = item.id
    guard !reduceMotion else {
      finish(item)
      return
    }
    withAnimation(.spring(response: 0.7, dampingFraction: 0.75)) {
      items.append(items.remove(at: index(of: item)))
      offset = 0
      dragged = nil
    }
    cycles += 1
    onCycle(item)
  }

  private func finish(_ item: Item) {
    var transaction = Transaction()
    transaction.disablesAnimations = true
    withTransaction(transaction) {
      items.append(items.remove(at: index(of: item)))
      offset = 0
      dragged = nil
    }
    cycles += 1
    onCycle(item)
  }
}
