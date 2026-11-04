import SwiftUI

public struct HugsyToast: Identifiable {
  public let id = UUID()
  public let title: String
  public let symbol: String
  public let duration: Duration
}

@Observable @MainActor public final class HugsyToasts {
  public private(set) var items: [HugsyToast] = []

  public init() {}

  public func show(
    _ title: String, symbol: String = "checkmark.circle.fill", duration: Duration = .seconds(5)
  ) {
    items.insert(HugsyToast(title: title, symbol: symbol, duration: duration), at: 0)
    items = Array(items.prefix(4))
  }

  public func dismiss(_ id: UUID) {
    items.removeAll { $0.id == id }
  }
}

public struct HugsyToastStack: View {
  public let toasts: HugsyToasts
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  public init(toasts: HugsyToasts) { self.toasts = toasts }

  public var body: some View {
    VStack(spacing: 10) {
      ForEach(toasts.items) { toast in
        HStack(spacing: 12) {
          Image(systemName: toast.symbol).foregroundStyle(.tint)
          Text(toast.title).fixedSize(horizontal: false, vertical: true)
          Spacer(minLength: 8)
          Button("Dismiss notification", systemImage: "xmark") { toasts.dismiss(toast.id) }
            .labelStyle(.iconOnly).buttonStyle(.plain)
        }
        .padding(16)
        .frame(maxWidth: 340)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(.primary.opacity(0.1)))
        .shadow(color: .black.opacity(0.08), radius: 12, y: 4)
        .transition(
          reduceMotion
            ? .opacity
            : .asymmetric(
              insertion: .move(edge: .top).combined(with: .opacity).combined(
                with: .scale(scale: 0.9)),
              removal: .move(edge: .trailing).combined(with: .opacity)
            )
        )
        .task(id: toast.id) {
          do { try await Task.sleep(for: toast.duration) } catch { return }
          toasts.dismiss(toast.id)
        }
      }
    }
    .animation(
      reduceMotion ? nil : .spring(response: 0.45, dampingFraction: 0.78),
      value: toasts.items.map(\.id))
  }
}
