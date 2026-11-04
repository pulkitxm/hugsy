import SwiftUI

public struct HugsyCardStack<Item: Identifiable, Content: View>: View {
  public let items: [Item]
  public let content: (Item) -> Content
  @State private var position = 0
  @GestureState private var drag: CGSize = .zero
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(items: [Item], @ViewBuilder content: @escaping (Item) -> Content) {
    self.items = items
    self.content = content
  }

  public var body: some View {
    VStack(spacing: 28) {
      ZStack {
        ForEach(Array(visible.reversed()), id: \.element.id) { entry in
          let depth = entry.offset
          content(entry.element)
            .frame(maxWidth: .infinity)
            .scaleEffect(reduceMotion ? 1 : 1 - CGFloat(depth) * 0.055)
            .offset(x: depth == 0 ? drag.width : 0, y: CGFloat(depth) * 13)
            .rotationEffect(.degrees(reduceMotion || depth != 0 ? 0 : Double(drag.width / 24)))
            .zIndex(Double(3 - depth))
            .allowsHitTesting(depth == 0)
            .accessibilityHidden(depth != 0)
        }
      }
      .gesture(
        DragGesture().updating($drag) { value, state, _ in
          state = value.translation
        }.onEnded { value in
          if abs(value.translation.width) > 70 { advance() }
        }
      )
      .animation(
        reduceMotion ? nil : .spring(response: 0.45, dampingFraction: 0.78), value: position
      )
      .animation(reduceMotion ? nil : .spring(response: 0.45, dampingFraction: 0.78), value: drag)
      HStack {
        Text(items.isEmpty ? "No cards" : "\(position % items.count + 1) of \(items.count)")
          .font(.caption).foregroundStyle(.secondary)
        Spacer()
        Button("Next card", systemImage: "arrow.right", action: advance)
          .disabled(items.count < 2)
      }
    }
    .onChange(of: items.map(\.id)) { _, _ in position = 0 }
  }

  private var visible: [(offset: Int, element: Item)] {
    guard !items.isEmpty else { return [] }
    return (0..<min(3, items.count)).map { depth in (depth, items[(position + depth) % items.count])
    }
  }

  private func advance() {
    guard !items.isEmpty else { return }
    position = (position + 1) % items.count
  }
}
