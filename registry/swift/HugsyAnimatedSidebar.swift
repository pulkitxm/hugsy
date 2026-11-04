import SwiftUI

public struct HugsySidebarItem: Identifiable {
  public let id: String
  public let title: String
  public let symbol: String

  public init(id: String, title: String, symbol: String) {
    self.id = id
    self.title = title
    self.symbol = symbol
  }
}

public struct HugsyAnimatedSidebar: View {
  public let title: String
  public let items: [HugsySidebarItem]
  @Binding public var selection: String
  @State private var expanded = true
  @Namespace private var indicator
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(title: String, items: [HugsySidebarItem], selection: Binding<String>) {
    self.title = title
    self.items = items
    self._selection = selection
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        if expanded { Text(title).font(.headline).transition(.opacity) }
        Spacer(minLength: 0)
        Button(expanded ? "Collapse sidebar" : "Expand sidebar", systemImage: "sidebar.left") {
          expanded.toggle()
        }.labelStyle(.iconOnly).buttonStyle(.plain)
      }.padding(12)
      Divider()
      ScrollView {
        VStack(spacing: 4) {
          ForEach(items) { item in
            Button {
              selection = item.id
            } label: {
              HStack(spacing: 12) {
                Image(systemName: item.symbol).frame(width: 20)
                if expanded { Text(item.title).transition(.opacity) }
                Spacer(minLength: 0)
              }
              .padding(12)
              .frame(maxWidth: .infinity, alignment: .leading)
              .background {
                if selection == item.id {
                  RoundedRectangle(cornerRadius: 8).fill(.tint.opacity(0.12))
                    .matchedGeometryEffect(id: "active", in: indicator)
                }
              }
            }
            .buttonStyle(.plain).help(item.title).accessibilityLabel(item.title)
            .accessibilityAddTraits(selection == item.id ? .isSelected : [])
          }
        }
      }
    }
    .padding(8)
    .frame(width: expanded ? 220 : 64)
    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
    .animation(reduceMotion ? nil : .spring(response: 0.4, dampingFraction: 0.82), value: expanded)
    .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.8), value: selection)
    .onChange(of: items.map(\.id), initial: true) { _, ids in
      if !ids.contains(selection), let first = ids.first { selection = first }
    }
  }
}
