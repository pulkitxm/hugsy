import SwiftUI

public struct HugsyDockItem: Identifiable {
  public let id: String
  public let title: String
  public let symbol: String
  public let color: Color
  public let action: @MainActor () -> Void

  public init(
    id: String, title: String, symbol: String, color: Color, action: @escaping @MainActor () -> Void
  ) {
    self.id = id
    self.title = title
    self.symbol = symbol
    self.color = color
    self.action = action
  }
}

public struct HugsyMagnifyingDock: View {
  public let items: [HugsyDockItem]
  @State private var hovered: String?
  @FocusState private var focused: String?
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(items: [HugsyDockItem]) { self.items = items }

  public var body: some View {
    HStack(alignment: .bottom, spacing: 10) {
      ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
        let distance = distance(from: index)
        let size: CGFloat = reduceMotion ? 48 : max(48, 72 - CGFloat(distance) * 12)
        Button(action: item.action) {
          Image(systemName: item.symbol)
            .font(.system(size: size * 0.43, weight: .medium))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(item.color.gradient, in: RoundedRectangle(cornerRadius: size * 0.25))
        }
        .buttonStyle(.plain)
        .focused($focused, equals: item.id)
        .onHover { hovered = $0 ? item.id : nil }
        .help(item.title)
        .accessibilityLabel(item.title)
      }
    }
    .padding(12)
    .frame(height: 96, alignment: .bottom)
    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 24))
    .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.65), value: hovered)
    .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.65), value: focused)
  }

  private func distance(from index: Int) -> Int {
    guard let active = hovered ?? focused,
      let position = items.firstIndex(where: { $0.id == active })
    else { return 3 }
    return abs(position - index)
  }
}
