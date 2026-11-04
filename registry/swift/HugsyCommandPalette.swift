import SwiftUI

public struct HugsyCommand: Identifiable {
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

public struct HugsyCommandPalette: View {
  public let commands: [HugsyCommand]
  public let onDismiss: () -> Void
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @FocusState private var searchFocused: Bool
  @Namespace private var highlight
  @State private var query = ""
  @State private var selection: String?

  public init(commands: [HugsyCommand], onDismiss: @escaping () -> Void) {
    self.commands = commands
    self.onDismiss = onDismiss
  }

  private var filtered: [HugsyCommand] {
    commands.filter { query.isEmpty || $0.title.localizedCaseInsensitiveContains(query) }
  }

  public var body: some View {
    VStack(spacing: 0) {
      HStack(spacing: 12) {
        Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
        TextField("Search commands", text: $query)
          .textFieldStyle(.plain)
          .focused($searchFocused)
          .onSubmit(performSelection)
        Button("Close", systemImage: "xmark", action: onDismiss).labelStyle(.iconOnly)
      }.padding(18)
      Divider()
      ScrollViewReader { proxy in
        ScrollView {
          VStack(spacing: 4) {
            if filtered.isEmpty {
              ContentUnavailableView.search(text: query)
            }
            ForEach(filtered) { command in
              Button {
                onDismiss()
                command.action()
              } label: {
                Label(command.title, systemImage: command.symbol)
                  .frame(maxWidth: .infinity, alignment: .leading)
                  .padding(12)
                  .background {
                    if selection == command.id {
                      RoundedRectangle(cornerRadius: 8)
                        .fill(.primary.opacity(0.08))
                        .matchedGeometryEffect(id: "selection", in: highlight)
                    }
                  }
              }
              .buttonStyle(.plain)
              .accessibilityAddTraits(selection == command.id ? .isSelected : [])
              .id(command.id)
            }
          }.padding(8)
        }
        .frame(maxHeight: 300)
        .onChange(of: selection) { _, value in
          if let value { proxy.scrollTo(value) }
        }
      }
      Divider()
      Text("↑ ↓ to navigate · Return to run · Escape to close")
        .font(.caption).foregroundStyle(.secondary).padding(12)
    }
    .frame(minWidth: 320, idealWidth: 480)
    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    .animation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.85), value: selection)
    .onAppear {
      searchFocused = true
      selection = filtered.first?.id
    }
    .onChange(of: query) { _, _ in selection = filtered.first?.id }
    .onChange(of: commands.map(\.id)) { _, _ in selection = filtered.first?.id }
    .onMoveCommand { direction in
      let index = filtered.firstIndex { $0.id == selection } ?? 0
      let offset = direction == .up ? -1 : 1
      if direction == .up || direction == .down, !filtered.isEmpty {
        selection = filtered[min(max(index + offset, 0), filtered.count - 1)].id
      }
    }
    .onExitCommand(perform: onDismiss)
  }

  private func performSelection() {
    guard let command = filtered.first(where: { $0.id == selection }) else { return }
    onDismiss()
    command.action()
  }
}
