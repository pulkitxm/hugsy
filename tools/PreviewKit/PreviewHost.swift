import SwiftUI

#if SWIFT_PACKAGE
  import RegistryModels
#endif

@MainActor public struct PreviewRegistration: Identifiable {
  public let id: String
  let render: (PreviewSession) -> AnyView

  public init<Content: View>(
    _ id: String, @ViewBuilder content: @escaping (PreviewSession) -> Content
  ) {
    self.id = id
    self.render = { AnyView(content($0)) }
  }
}

@MainActor public struct PreviewHost: View {
  private enum Loaded {
    case ready(PreviewSession, PreviewRegistration, Bool)
    case failed(String)
  }
  @State private var loaded: Loaded
  @State private var playback: Task<Void, Never>?

  public init(
    registrations: [PreviewRegistration], arguments: [String] = ProcessInfo.processInfo.arguments
  ) {
    do {
      let catalog = try PreviewCatalog()
      let ids = Set(registrations.map(\.id))
      guard ids.count == registrations.count,
        ids == Set(catalog.components.map(\.name))
      else {
        throw PreviewDefinitionError.invalid(
          "Every catalog component needs one native preview registration.")
      }
      let launch = try PreviewLaunch(arguments: arguments)
      guard let registration = registrations.first(where: { $0.id == launch.component }) else {
        throw PreviewDefinitionError.invalid("Missing native preview: \(launch.component)")
      }
      let session = try PreviewSession(
        component: catalog.component(launch.component), screen: launch.screen, state: launch.state,
        captureID: launch.captureID)
      _loaded = State(initialValue: .ready(session, registration, launch.recording))
    } catch {
      _loaded = State(initialValue: .failed(error.localizedDescription))
    }
  }

  public var body: some View {
    ZStack {
      switch loaded {
      case .ready(let session, let registration, _):
        if let failure = session.failure {
          unavailable(failure)
        } else {
          registration.render(session)
            .accessibilityElement(children: .contain)
            .accessibilityIdentifier("hugsy-gallery-ready")
        }
      case .failed(let failure): unavailable(failure)
      }
    }
    .onAppear {
      if case .ready(let session, _, _) = loaded { session.ready() }
      if case .ready(_, _, true) = loaded { play() }
    }
    .onDisappear { playback?.cancel() }
  }

  private func play() {
    if case .ready(let session, _, _) = loaded {
      playback?.cancel()
      playback = Task { await session.play() }
    }
  }

  private func unavailable(_ message: String) -> some View {
    ContentUnavailableView(
      "Preview unavailable", systemImage: "exclamationmark.triangle", description: Text(message))
  }
}
