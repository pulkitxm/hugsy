import SwiftUI

public struct HugsyFluidTabs: View {
  public let tabs: [String]
  @Binding public var selection: String
  @Namespace private var pill
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(tabs: [String], selection: Binding<String>) {
    self.tabs = tabs
    self._selection = selection
  }

  public var body: some View {
    ScrollView(.horizontal) {
      HStack(spacing: 4) {
        ForEach(uniqueTabs, id: \.self) { tab in
          Button {
            selection = tab
          } label: {
            Text(tab)
              .font(.callout.weight(.medium))
              .padding(.horizontal, 18).padding(.vertical, 10)
              .frame(minHeight: 44)
              .background {
                if selection == tab {
                  Capsule().fill(.background)
                    .shadow(color: .black.opacity(0.08), radius: 3, y: 2)
                    .matchedGeometryEffect(id: "pill", in: pill)
                }
              }
          }
          .buttonStyle(.plain)
          .accessibilityAddTraits(selection == tab ? .isSelected : [])
        }
      }.padding(5)
    }
    .scrollIndicators(.hidden)
    .fixedSize(horizontal: false, vertical: true)
    .background(.primary.opacity(0.06), in: Capsule())
    .animation(reduceMotion ? nil : .spring(response: 0.4, dampingFraction: 0.72), value: selection)
    .onChange(of: tabs, initial: true) { _, values in
      if !values.contains(selection), let first = values.first { selection = first }
    }
  }

  private var uniqueTabs: [String] {
    var seen = Set<String>()
    return tabs.filter { seen.insert($0).inserted }
  }
}
