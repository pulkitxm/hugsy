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
  @State private var playRequest = 0

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
        component: catalog.component(launch.component), screen: launch.screen, state: launch.state)
      _loaded = State(initialValue: .ready(session, registration, launch.recording))
    } catch {
      _loaded = State(initialValue: .failed(error.localizedDescription))
    }
  }

  public var body: some View {
    switch loaded {
    case .ready(let session, let registration, let recording):
      if let failure = session.failure {
        unavailable(failure)
      } else {
        registration.render(session)
          .accessibilityElement(children: .contain)
          .accessibilityIdentifier("hugsy-gallery-ready")
          .onOpenURL { url in
            if url.scheme == "hugsy-preview", url.host == "play" { playRequest += 1 }
          }
          .task(id: playRequest) {
            if recording || playRequest > 0 { await session.play() }
          }
      }
    case .failed(let failure): unavailable(failure)
    }
  }

  private func unavailable(_ message: String) -> some View {
    ContentUnavailableView(
      "Preview unavailable", systemImage: "exclamationmark.triangle", description: Text(message))
  }
}
