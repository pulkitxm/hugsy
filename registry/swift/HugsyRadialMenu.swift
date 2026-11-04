import SwiftUI

public struct HugsyRadialAction: Identifiable {
  public let id: String
  public let title: String
  public let symbol: String
  public let action: @MainActor () -> Void

  public init(id: String, title: String, symbol: String, action: @escaping @MainActor () -> Void) {
    self.id = id
    self.title = title
    self.symbol = symbol
    self.action = action
  }
}

public struct HugsyRadialMenu: View {
  public let actions: [HugsyRadialAction]
  public let radius: CGFloat
  @Binding public var expanded: Bool
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(actions: [HugsyRadialAction], isExpanded: Binding<Bool>, radius: CGFloat = 100) {
    self.actions = actions
    self._expanded = isExpanded
    self.radius = max(70, radius)
  }

  public var body: some View {
    ZStack(alignment: .bottom) {
      ForEach(Array(actions.enumerated()), id: \.element.id) { index, item in
        let angle =
          actions.count == 1 ? 0 : Double(index) / Double(actions.count - 1) * .pi - .pi / 2
        Button {
          expanded = false
          item.action()
        } label: {
          Image(systemName: item.symbol).font(.system(size: 22, weight: .medium))
            .frame(width: 56, height: 56).background(.regularMaterial, in: Circle())
            .overlay(Circle().stroke(.primary.opacity(0.08)))
        }
        .buttonStyle(.plain).accessibilityLabel(item.title)
        .offset(x: expanded ? sin(angle) * radius : 0, y: expanded ? -cos(angle) * radius - 18 : 0)
        .scaleEffect(expanded || reduceMotion ? 1 : 0.55)
        .opacity(expanded ? 1 : 0)
        .allowsHitTesting(expanded).accessibilityHidden(!expanded)
        .animation(
          reduceMotion
            ? nil
            : .spring(response: 0.4, dampingFraction: 0.72).delay(
              expanded ? Double(index) * 0.035 : 0), value: expanded)
      }
      Button {
        expanded.toggle()
      } label: {
        Image(systemName: "plus").font(.system(size: 24, weight: .medium))
          .rotationEffect(.degrees(expanded && !reduceMotion ? 45 : 0))
          .frame(width: 64, height: 64).background(.tint, in: Circle()).foregroundStyle(.white)
      }
      .buttonStyle(.plain).disabled(actions.isEmpty)
      .accessibilityLabel(expanded ? "Close actions" : "Open actions")
      .accessibilityValue(expanded ? "Expanded" : "Collapsed")
      .animation(
        reduceMotion ? nil : .spring(response: 0.35, dampingFraction: 0.7), value: expanded)
    }
    .frame(width: radius * 2 + 72, height: radius + 100)
    .accessibilityAction(.escape) { expanded = false }
    .onChange(of: actions.map(\.id)) { _, _ in expanded = false }
  }
}
