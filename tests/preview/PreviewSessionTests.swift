import Foundation
import HugsyPreviewKit
import RegistryModels
import Testing

@MainActor struct PreviewSessionTests {
  @Test func resolvesEveryCatalogPreview() throws {
    let catalog = try PreviewCatalog()
    #expect(!catalog.components.isEmpty)
    for component in catalog.components {
      let session = try PreviewSession(component: component)
      #expect(session.screen.id == session.definition.initialScreen)
      #expect(session.state == session.screen.initialState)
    }
  }

  @Test func screensAndStatesAreValidated() throws {
    let component = try PreviewCatalog().component("fluid-tabs")
    let session = try PreviewSession(component: component, screen: "following")
    #expect(session.screen.label == "Following")
    session.show(screen: "saved")
    #expect(session.screen.label == "Saved")
    session.show(screen: "missing")
    #expect(session.screen.id == "saved")
    #expect(session.failure != nil)
    session.show(screen: "for-you", state: "missing")
    #expect(session.screen.id == "saved")
    #expect(throws: PreviewDefinitionError.self) {
      try PreviewSession(component: component, screen: "missing")
    }
  }

  @Test func runsTheDeclaredMultiScreenFlow() async throws {
    let component = try PreviewCatalog().component("fluid-tabs")
    let session = try PreviewSession(component: component)
    var screens: [String] = []
    await session.play { _ in screens.append(session.screen.id) }
    #expect(screens == ["for-you", "following", "saved", "for-you"])
    #expect(session.phase == .finished)
  }

  @Test func resettingInvalidatesTheRunningFlow() async throws {
    let component = try PreviewCatalog().component("fluid-tabs")
    let session = try PreviewSession(component: component, screen: "following")
    await session.play { _ in session.reset() }
    #expect(session.screen.id == "following")
    #expect(session.phase == .ready)
  }

  @Test func playbackCancellationDoesNotAdvanceTheScenario() async throws {
    let component = try PreviewCatalog().component("fluid-tabs")
    let session = try PreviewSession(component: component)
    await session.play { _ in throw CancellationError() }
    #expect(session.phase == .cancelled)
    #expect(session.screen.id == "for-you")
  }

  @Test func rejectsMissingLaunchValues() throws {
    #expect(throws: PreviewDefinitionError.self) {
      try PreviewLaunch(arguments: ["gallery", "--screen"])
    }
    let launch = try PreviewLaunch(
      arguments: ["gallery", "--component", "fluid-tabs", "--screen", "saved", "--record"])
    #expect(launch.component == "fluid-tabs")
    #expect(launch.screen == "saved")
    #expect(launch.recording)
  }
}
