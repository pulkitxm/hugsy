import Foundation

public struct PreviewStep: Codable, Hashable, Sendable {
  public let screen: String
  public let state: String
  public let durationMilliseconds: Int
}

public struct PreviewScreen: Codable, Hashable, Sendable, Identifiable {
  public let id: String
  public let label: String
  public let asset: String
  public let initialState: String
  public let states: [String]
  public let timeline: [PreviewStep]

  public var durationMilliseconds: Int {
    timeline.reduce(0) { $0 + $1.durationMilliseconds }
  }
}

public struct PreviewDefinition: Codable, Hashable, Sendable {
  public let headline: String
  public let initialScreen: String
  public let screens: [PreviewScreen]

  public func screen(_ id: String? = nil) throws -> PreviewScreen {
    let selected = id ?? initialScreen
    guard let screen = screens.first(where: { $0.id == selected }) else {
      throw PreviewDefinitionError.invalid("Unknown preview screen: \(selected)")
    }
    return screen
  }

  public func validate() throws {
    guard !headline.isEmpty, !screens.isEmpty,
      Set(screens.map(\.id)).count == screens.count,
      Set(screens.map(\.asset)).count == screens.count
    else {
      throw PreviewDefinitionError.invalid("Preview screens and assets must be unique.")
    }
    _ = try screen()
    for candidate in screens {
      guard Self.validID(candidate.id), Self.validID(candidate.asset),
        !candidate.label.isEmpty, !candidate.states.isEmpty,
        Set(candidate.states).count == candidate.states.count,
        candidate.states.allSatisfy(Self.validID),
        candidate.states.contains(candidate.initialState),
        !candidate.timeline.isEmpty,
        candidate.timeline.allSatisfy({ (100...10000).contains($0.durationMilliseconds) }),
        candidate.durationMilliseconds <= 30000
      else {
        throw PreviewDefinitionError.invalid("Invalid preview screen: \(candidate.id)")
      }
      for step in candidate.timeline {
        let destination = try screen(step.screen)
        guard destination.states.contains(step.state),
          (100...10000).contains(step.durationMilliseconds)
        else {
          throw PreviewDefinitionError.invalid("Invalid preview step: \(step.screen)/\(step.state)")
        }
      }
    }
  }

  private static func validID(_ value: String) -> Bool {
    value.count <= 80
      && value.range(of: "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$", options: .regularExpression) != nil
  }
}

public enum PreviewDefinitionError: Error, LocalizedError, Sendable {
  case invalid(String)

  public var errorDescription: String? {
    switch self {
    case .invalid(let description): description
    }
  }
}
