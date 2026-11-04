import SwiftUI

public struct HugsyExpandingCards<Item: Identifiable, Content: View>: View {
  public let items: [Item]
  public let cardHeight: CGFloat
  public let expandedHeight: CGFloat
  public let content: (Item, Bool) -> Content
  @Binding public var selected: Item.ID?
  @GestureState private var drag = CGSize.zero
  @Namespace private var geometry
  @AccessibilityFocusState private var focused: Item.ID?
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(
    items: [Item], selection: Binding<Item.ID?>, cardHeight: CGFloat = 180,
    expandedHeight: CGFloat = 440,
    @ViewBuilder content: @escaping (Item, Bool) -> Content
  ) {
    self.items = items
    self._selected = selection
    let minimum = max(44, cardHeight)
    self.cardHeight = minimum
    self.expandedHeight = max(minimum, expandedHeight)
    self.content = content
  }

  public var body: some View {
    ZStack(alignment: .top) {
      VStack(spacing: 16) {
        ForEach(items) { item in
          Button {
            selected = item.id
          } label: {
            content(item, false)
              .frame(maxWidth: .infinity).frame(height: cardHeight)
              .clipShape(RoundedRectangle(cornerRadius: 28))
              .matchedGeometryEffect(id: item.id, in: geometry)
          }
          .buttonStyle(.plain)
          .opacity(selected == item.id ? 0 : 1)
          .accessibilityHint("Opens card details")
          .accessibilityFocused($focused, equals: item.id)
        }
      }
      .accessibilityHidden(selected != nil)
      if let item = items.first(where: { $0.id == selected }) {
        content(item, true)
          .frame(maxWidth: .infinity).frame(height: expandedHeight)
          .clipShape(RoundedRectangle(cornerRadius: 32))
          .matchedGeometryEffect(id: item.id, in: geometry, isSource: false)
          .overlay(alignment: .topTrailing) {
            Button("Close details", systemImage: "xmark") { close() }
              .labelStyle(.iconOnly).padding(14)
              .background(.regularMaterial, in: Circle()).padding(16)
              .accessibilityFocused($focused, equals: item.id)
          }
          .offset(y: max(0, drag.height))
          .gesture(
            DragGesture().updating($drag) { value, state, _ in
              state = value.translation
            }.onEnded { value in
              if value.predictedEndTranslation.height > 140 { close() }
            }
          )
          .accessibilityAction(.escape) { close() }
          .onAppear { focused = item.id }
          .zIndex(2)
      }
    }
    .animation(reduceMotion ? nil : .spring(response: 0.52, dampingFraction: 0.86), value: selected)
    .animation(reduceMotion ? nil : .spring(response: 0.4, dampingFraction: 0.85), value: drag)
    .onChange(of: items.map(\.id)) { _, ids in
      if let selected, !ids.contains(selected) { self.selected = nil }
    }
  }

  private func close() {
    let previous = selected
    selected = nil
    focused = previous
  }
}
