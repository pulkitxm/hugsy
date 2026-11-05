import SwiftUI

public enum HugsySwipeDirection: String, CaseIterable, Sendable {
  case left, right
}

public struct HugsySwipeDeck<Item: Identifiable, Content: View>: View {
  @Binding public var items: [Item]
  public let visibleCount: Int
  public let threshold: CGFloat
  public let leftLabel: String
  public let rightLabel: String
  public let onSwipe: @MainActor (Item, HugsySwipeDirection) -> Void
  public let content: (Item, Double) -> Content
  @State private var offset = CGSize.zero
  @State private var leaving: Item.ID?
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(
    items: Binding<[Item]>, visibleCount: Int = 3, threshold: CGFloat = 110,
    leftLabel: String = "Skip", rightLabel: String = "Like",
    onSwipe: @escaping @MainActor (Item, HugsySwipeDirection) -> Void = { _, _ in },
    @ViewBuilder content: @escaping (Item, Double) -> Content
  ) {
    self._items = items
    self.visibleCount = min(5, max(1, visibleCount))
    self.threshold = max(44, threshold)
    self.leftLabel = leftLabel
    self.rightLabel = rightLabel
    self.onSwipe = onSwipe
    self.content = content
  }

  private var progress: Double {
    Double(max(-1, min(1, offset.width / threshold)))
  }

  public var body: some View {
    VStack(spacing: 24) {
      ZStack {
        ForEach(Array(items.prefix(visibleCount).enumerated().reversed()), id: \.element.id) {
          index, item in
          card(item, index: index)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      HStack(spacing: 28) {
        control(.left, symbol: "xmark")
        control(.right, symbol: "heart.fill")
      }
    }
    #if os(iOS)
      .sensoryFeedback(.impact(weight: .light), trigger: items.count)
    #endif
  }

  private func card(_ item: Item, index: Int) -> some View {
    let top = index == 0
    let depth = max(0, Double(index) - abs(progress))
    return content(item, top ? progress : 0)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
      .shadow(color: .black.opacity(top ? 0.16 : 0.08), radius: 18, y: 10)
      .scaleEffect(1 - depth * 0.05)
      .offset(y: depth * 16)
      .offset(top ? offset : .zero)
      .rotationEffect(
        .degrees(top && !reduceMotion ? Double(offset.width) / 16 : 0), anchor: .bottom
      )
      .zIndex(Double(visibleCount - index))
      .allowsHitTesting(top && leaving == nil)
      .accessibilityHidden(!top)
      .accessibilityElement(children: .combine)
      .accessibilityAction(named: Text(leftLabel)) { swipe(.left) }
      .accessibilityAction(named: Text(rightLabel)) { swipe(.right) }
      .gesture(
        DragGesture()
          .onChanged { value in offset = value.translation }
          .onEnded { value in
            let travel = value.predictedEndTranslation.width
            if abs(value.translation.width) > threshold || abs(travel) > threshold * 2 {
              swipe(travel > 0 ? .right : .left)
            } else {
              withAnimation(reduceMotion ? nil : .spring(response: 0.42, dampingFraction: 0.68)) {
                offset = .zero
              }
            }
          }
      )
  }

  private func control(_ direction: HugsySwipeDirection, symbol: String) -> some View {
    let emphasis = max(0, direction == .right ? progress : -progress)
    return Button {
      swipe(direction)
    } label: {
      Image(systemName: symbol)
        .font(.system(size: 22, weight: .semibold))
        .frame(width: 60, height: 60)
        .background(.regularMaterial, in: Circle())
        .overlay(Circle().stroke(.primary.opacity(0.08)))
        .scaleEffect(1 + emphasis * 0.18)
    }
    .buttonStyle(.plain)
    .accessibilityLabel(direction == .left ? leftLabel : rightLabel)
    .disabled(items.isEmpty || leaving != nil)
  }

  private func swipe(_ direction: HugsySwipeDirection) {
    guard leaving == nil, let item = items.first else { return }
    leaving = item.id
    guard !reduceMotion else {
      finish(item, direction)
      return
    }
    let distance: CGFloat = direction == .right ? 640 : -640
    withAnimation(.spring(response: 0.38, dampingFraction: 0.92)) {
      offset = CGSize(width: distance, height: offset.height + 60)
    } completion: {
      finish(item, direction)
    }
  }

  private func finish(_ item: Item, _ direction: HugsySwipeDirection) {
    var transaction = Transaction()
    transaction.disablesAnimations = true
    withTransaction(transaction) {
      items.removeAll { $0.id == item.id }
      offset = .zero
      leaving = nil
    }
    onSwipe(item, direction)
  }
}
