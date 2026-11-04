import Foundation
import Observation

#if SWIFT_PACKAGE
  import RegistryModels
#endif

public struct PreviewPosition: Hashable, Sendable {
  public let screen: String
  public let state: String
}

@MainActor @Observable public final class PreviewSession {
  public enum Phase: String, Sendable { case ready, playing, finished, cancelled }

  public let component: Component
  public let definition: PreviewDefinition
  public let entryScreen: PreviewScreen
  public private(set) var screen: PreviewScreen
  public private(set) var state: String
  public private(set) var phase = Phase.ready
  public private(set) var failure: String?
  private var generation = UUID()

  public var position: PreviewPosition { .init(screen: screen.id, state: state) }

  public init(component: Component, screen: String? = nil, state: String? = nil) throws {
    guard let preview = component.preview else {
      throw PreviewDefinitionError.invalid("This component does not declare a visual preview.")
    }
    try preview.validate()
    let selected = try preview.screen(screen)
    let selectedState = state ?? selected.initialState
    guard selected.states.contains(selectedState) else {
      throw PreviewDefinitionError.invalid("Unknown preview state: \(selectedState)")
    }
    self.component = component
    self.definition = preview
    self.entryScreen = selected
    self.screen = selected
    self.state = selectedState
  }

  public func show(screen id: String, state: String? = nil) {
    do {
      let selected = try definition.screen(id)
      let selectedState = state ?? selected.initialState
      guard selected.states.contains(selectedState) else {
        throw PreviewDefinitionError.invalid("Unknown preview state: \(selectedState)")
      }
      screen = selected
      self.state = selectedState
      failure = nil
    } catch {
      failure = error.localizedDescription
    }
  }

  public func select(state: String) { show(screen: screen.id, state: state) }

  public func reset() {
    generation = UUID()
    phase = .ready
    show(screen: entryScreen.id)
  }

  public func play(
    sleep: @MainActor (Duration) async throws -> Void = { try await Task.sleep(for: $0) }
  ) async {
    let token = UUID()
    generation = token
    phase = .playing
    for step in entryScreen.timeline {
      guard generation == token, !Task.isCancelled else { return }
      show(screen: step.screen, state: step.state)
      do {
        try await sleep(.milliseconds(step.durationMilliseconds))
      } catch {
        if generation == token { phase = .cancelled }
        return
      }
    }
    if generation == token { phase = .finished }
  }
}
