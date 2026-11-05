import SwiftUI

public enum HugsyCapsulePhase: String, CaseIterable, Hashable, Sendable {
  case compact, alert, expanded
}

public struct HugsyMorphingCapsule<Content: View>: View {
  @Binding public var phase: HugsyCapsulePhase
  public let compactSize: CGSize
  public let alertSize: CGSize
  public let expandedSize: CGSize
  public let content: (HugsyCapsulePhase) -> Content
  @State private var stretch: CGFloat = 0
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(
    phase: Binding<HugsyCapsulePhase>, compactSize: CGSize = CGSize(width: 126, height: 37),
    alertSize: CGSize = CGSize(width: 300, height: 58),
    expandedSize: CGSize = CGSize(width: 360, height: 200),
    @ViewBuilder content: @escaping (HugsyCapsulePhase) -> Content
  ) {
    self._phase = phase
    let compact = CGSize(width: max(44, compactSize.width), height: max(28, compactSize.height))
    self.compactSize = compact
    self.alertSize = CGSize(
      width: max(compact.width, alertSize.width), height: max(compact.height, alertSize.height))
    self.expandedSize = CGSize(
      width: max(self.alertSize.width, expandedSize.width),
      height: max(self.alertSize.height, expandedSize.height))
    self.content = content
  }

  private var size: CGSize {
    switch phase {
    case .compact: compactSize
    case .alert: alertSize
    case .expanded: expandedSize
    }
  }

  private var radius: CGFloat {
    phase == .expanded ? 44 : size.height / 2
  }

  public var body: some View {
    let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
    ZStack {
      content(phase)
        .id(phase)
        .transition(reduceMotion ? .opacity : AnyTransition(.blurReplace))
    }
    .frame(width: size.width, height: max(size.height * 0.85, size.height + stretch))
    .background(.black, in: shape)
    .clipShape(shape)
    .foregroundStyle(.white)
    .environment(\.colorScheme, .dark)
    .contentShape(shape)
    .onTapGesture { toggle() }
    .gesture(
      DragGesture(minimumDistance: 8)
        .onChanged { value in
          stretch = reduceMotion ? 0 : rubberBand(value.translation.height)
        }
        .onEnded { value in
          if value.translation.height > 36, phase != .expanded {
            phase = .expanded
          } else if value.translation.height < -36, phase == .expanded {
            phase = .compact
          }
          stretch = 0
        }
    )
    .frame(maxWidth: .infinity)
    .accessibilityElement(children: .contain)
    .accessibilityLabel(phase.rawValue.capitalized)
    .accessibilityAddTraits(phase == .expanded ? [] : .isButton)
    .accessibilityAction { toggle() }
    .accessibilityAction(.escape) { phase = .compact }
    .animation(reduceMotion ? nil : .spring(response: 0.48, dampingFraction: 0.74), value: phase)
    .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.6), value: stretch)
    #if os(iOS)
      .sensoryFeedback(.impact(flexibility: .soft), trigger: phase)
    #endif
  }

  private func toggle() {
    phase = phase == .expanded ? .compact : .expanded
  }

  private func rubberBand(_ distance: CGFloat) -> CGFloat {
    let limit: CGFloat = 28
    let sign: CGFloat = distance < 0 ? -1 : 1
    return sign * limit * (1 - 1 / (abs(distance) / limit / 3 + 1))
  }
}
