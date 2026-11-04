import Foundation

public struct Component: Codable, Sendable {
  public let name: String
  public let title: String
  public let description: String
  public let category: String
  public let technique: String
  public let filename: String
  public let states: [String]
  public let interaction: String
  public let accessibility: String
  public let integration: String
  public let usage: String
  public var source: String
  public var sha256: String

  private enum CodingKeys: String, CodingKey {
    case name, title, description, category, technique, filename, states
    case interaction, accessibility, integration, usage, source, sha256
  }

  public init(from decoder: Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    name = try values.decode(String.self, forKey: .name)
    title = try values.decode(String.self, forKey: .title)
    description = try values.decode(String.self, forKey: .description)
    category = try values.decode(String.self, forKey: .category)
    technique = try values.decode(String.self, forKey: .technique)
    filename = try values.decode(String.self, forKey: .filename)
    states = try values.decode([String].self, forKey: .states)
    interaction = try values.decode(String.self, forKey: .interaction)
    accessibility = try values.decode(String.self, forKey: .accessibility)
    integration = try values.decode(String.self, forKey: .integration)
    usage = try values.decode(String.self, forKey: .usage)
    source = try values.decodeIfPresent(String.self, forKey: .source) ?? ""
    sha256 = try values.decodeIfPresent(String.self, forKey: .sha256) ?? ""
  }
}

public struct RegistryDocument: Codable, Sendable {
  public let version: Int
  public let platform: String
  public let minimumVersion: String
  public let components: [Component]

  public init(components: [Component]) {
    version = 1
    platform = "ios"
    minimumVersion = "17.0"
    self.components = components
  }
}

public struct ComponentSummary: Codable, Sendable {
  public let name: String
  public let title: String
  public let description: String
  public let category: String
  public let technique: String

  public init(_ component: Component) {
    name = component.name
    title = component.title
    description = component.description
    category = component.category
    technique = component.technique
  }
}
