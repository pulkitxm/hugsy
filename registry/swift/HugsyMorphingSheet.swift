import SwiftUI

public enum HugsySheetPosition: String, CaseIterable {
  case compact
  case expanded
}

public struct HugsyMorphingSheet<Content: View>: View {
  @Binding public var position: HugsySheetPosition
  public let compactHeight: CGFloat
  public let expandedHeight: CGFloat
  public let content: (HugsySheetPosition) -> Content
  @GestureState private var translation: CGFloat = 0
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(
    position: Binding<HugsySheetPosition>, compactHeight: CGFloat = 200,
    expandedHeight: CGFloat = 430,
    @ViewBuilder content: @escaping (HugsySheetPosition) -> Content
  ) {
    self._position = position
    self.compactHeight = max(100, compactHeight)
    self.expandedHeight = max(compactHeight + 44, expandedHeight)
    self.content = content
  }

  public var body: some View {
    let base = position == .compact ? compactHeight : expandedHeight
    VStack(spacing: 0) {
      Button {
        position = position == .compact ? .expanded : .compact
      } label: {
        Capsule().fill(.secondary.opacity(0.4)).frame(width: 36, height: 5)
          .frame(maxWidth: .infinity).frame(height: 44).contentShape(Rectangle())
      }
      .buttonStyle(.plain)
      .accessibilityLabel(position == .compact ? "Expand sheet" : "Collapse sheet")
      .gesture(
        DragGesture().updating($translation) { value, state, _ in
          state = value.translation.height
        }.onEnded { value in
          let predicted = base - value.predictedEndTranslation.height
          position = predicted > (compactHeight + expandedHeight) / 2 ? .expanded : .compact
        })
      content(position).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }
    .frame(height: min(expandedHeight + 24, max(compactHeight - 24, base - translation)))
    .background(
      .regularMaterial, in: RoundedRectangle(cornerRadius: position == .compact ? 32 : 26)
    )
    .overlay(
      RoundedRectangle(cornerRadius: position == .compact ? 32 : 26).stroke(.primary.opacity(0.08))
    )
    .animation(reduceMotion ? nil : .spring(response: 0.5, dampingFraction: 0.84), value: position)
    .animation(
      reduceMotion ? nil : .spring(response: 0.36, dampingFraction: 0.85), value: translation
    )
    .accessibilityAdjustableAction { direction in
      switch direction {
      case .increment: position = .expanded
      case .decrement: position = .compact
      @unknown default: break
      }
    }
    .accessibilityValue(position.rawValue)
  }
}
