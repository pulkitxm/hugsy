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
  public enum Phase: String, Codable, Sendable { case ready, playing, finished, cancelled }

  public let component: Component
  public let definition: PreviewDefinition
  public let entryScreen: PreviewScreen
  public private(set) var screen: PreviewScreen
  public private(set) var state: String
  public private(set) var phase = Phase.ready
  public private(set) var failure: String?
  private var generation = UUID()
  private let captureID: String?

  public var position: PreviewPosition { .init(screen: screen.id, state: state) }

  public init(
    component: Component, screen: String? = nil, state: String? = nil, captureID: String? = nil
  ) throws {
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
    self.captureID = captureID
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

  public func ready() { report(startedAt: Date().timeIntervalSince1970) }

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
    let startedAt = Date().timeIntervalSince1970
    report(startedAt: startedAt)
    trace("started")
    for step in entryScreen.timeline {
      guard generation == token, !Task.isCancelled else { return }
      show(screen: step.screen, state: step.state)
      trace("step")
      do {
        try await sleep(.milliseconds(step.durationMilliseconds))
      } catch {
        trace("cancelled")
        if generation == token { phase = .cancelled }
        report(startedAt: startedAt)
        return
      }
    }
    if generation == token {
      phase = .finished
      trace("finished")
      report(startedAt: startedAt)
    }
  }

  private func trace(_ event: String) {
    if ProcessInfo.processInfo.environment["HUGSY_PREVIEW_TRACE"] == "1" {
      print(
        "preview \(event) \(component.name)/\(screen.id)/\(state) \(Date().timeIntervalSince1970)")
    }
  }

  private func report(startedAt: TimeInterval) {
    guard let captureID else { return }
    struct Report: Encodable {
      let captureID: String
      let component: String
      let screen: String
      let state: String
      let phase: Phase
      let startedAt: TimeInterval
    }
    do {
      let directory = try FileManager.default.url(
        for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      let value = Report(
        captureID: captureID, component: component.name, screen: screen.id,
        state: state, phase: phase, startedAt: startedAt)
      try JSONEncoder().encode(value).write(
        to: directory.appendingPathComponent("HugsyPreviewCapture.json"), options: .atomic)
    } catch {
      failure = error.localizedDescription
    }
  }
}
