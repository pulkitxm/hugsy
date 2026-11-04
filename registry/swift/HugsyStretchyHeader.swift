import SwiftUI

public struct HugsyStretchyHeader<Header: View, Content: View>: View {
  public let height: CGFloat
  public let header: () -> Header
  public let content: () -> Content
  @Namespace private var coordinateSpace
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(
    height: CGFloat = 320, @ViewBuilder header: @escaping () -> Header,
    @ViewBuilder content: @escaping () -> Content
  ) {
    self.height = max(44, height)
    self.header = header
    self.content = content
  }

  public var body: some View {
    ScrollView {
      VStack(spacing: 0) {
        GeometryReader { proxy in
          let offset = proxy.frame(in: .named(coordinateSpace)).minY
          let stretch = reduceMotion ? 0 : max(0, offset)
          header()
            .frame(width: proxy.size.width, height: height + stretch)
            .clipped()
            .offset(y: -stretch)
        }
        .frame(height: height)
        content().frame(maxWidth: .infinity)
      }
    }
    .coordinateSpace(name: coordinateSpace)
  }
}
