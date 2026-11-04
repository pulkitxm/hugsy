import Foundation

#if SWIFT_PACKAGE
  import RegistryModels
#endif

public struct PreviewCatalog: Sendable {
  public let components: [Component]

  public init() throws {
    guard let data = Data(base64Encoded: embeddedRegistryBase64) else {
      throw PreviewDefinitionError.invalid("The bundled preview catalog is invalid.")
    }
    components = try JSONDecoder().decode(RegistryDocument.self, from: data).components.filter {
      $0.preview != nil
    }
  }

  public func component(_ id: String) throws -> Component {
    guard let component = components.first(where: { $0.name == id }) else {
      throw PreviewDefinitionError.invalid("Unknown native preview: \(id)")
    }
    return component
  }
}

public struct PreviewLaunch: Sendable {
  public let component: String
  public let screen: String?
  public let state: String?
  public let recording: Bool

  public init(arguments: [String]) throws {
    func value(_ flag: String) throws -> String? {
      guard let index = arguments.firstIndex(of: flag) else { return nil }
      guard arguments.indices.contains(index + 1), !arguments[index + 1].hasPrefix("--") else {
        throw PreviewDefinitionError.invalid("Expected a value after \(flag)")
      }
      return arguments[index + 1]
    }
    component = try value("--component") ?? "expanding-cards"
    screen = try value("--screen")
    state = try value("--state")
    recording = arguments.contains("--record")
  }
}
