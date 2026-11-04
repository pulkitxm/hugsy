import Foundation

public struct ComponentFile: Codable, Equatable, Sendable {
  public enum Kind: String, Codable, Sendable { case source, resource }
  public let path: String
  public let kind: Kind
  public var data: Data
  public var sha256: String

  public static func isSafePath(_ path: String) -> Bool {
    path.count <= 240
      && path.range(
        of: "^[A-Za-z0-9_-]+(\\.[A-Za-z0-9_-]+)*(/[A-Za-z0-9_-]+(\\.[A-Za-z0-9_-]+)*)*$",
        options: .regularExpression) != nil
  }

  private enum CodingKeys: String, CodingKey { case path, kind, data, sha256 }

  public init(from decoder: Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    path = try values.decode(String.self, forKey: .path)
    kind = try values.decode(Kind.self, forKey: .kind)
    data = try values.decodeIfPresent(Data.self, forKey: .data) ?? Data()
    sha256 = try values.decodeIfPresent(String.self, forKey: .sha256) ?? ""
  }
}

public struct Component: Codable, Sendable {
  public let name: String
  public let title: String
  public let description: String
  public let category: String
  public let technique: String
  public let filename: String
  public let frameworks: [String]
  public let dependencies: [String]
  public var files: [ComponentFile]
  public let states: [String]
  public let interaction: String
  public let accessibility: String
  public let integration: String
  public let usage: String
  public let preview: PreviewDefinition
  public var source: String
  public var sha256: String

  private enum CodingKeys: String, CodingKey {
    case name, title, description, category, technique, filename, states
    case interaction, accessibility, integration, usage, preview, source, sha256, frameworks, dependencies,
      files
  }

  public init(from decoder: Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    name = try values.decode(String.self, forKey: .name)
    title = try values.decode(String.self, forKey: .title)
    description = try values.decode(String.self, forKey: .description)
    category = try values.decode(String.self, forKey: .category)
    technique = try values.decode(String.self, forKey: .technique)
    filename = try values.decode(String.self, forKey: .filename)
    frameworks = try values.decode([String].self, forKey: .frameworks)
    dependencies = try values.decode([String].self, forKey: .dependencies)
    files = try values.decode([ComponentFile].self, forKey: .files)
    states = try values.decode([String].self, forKey: .states)
    interaction = try values.decode(String.self, forKey: .interaction)
    accessibility = try values.decode(String.self, forKey: .accessibility)
    integration = try values.decode(String.self, forKey: .integration)
    usage = try values.decode(String.self, forKey: .usage)
    preview = try values.decode(PreviewDefinition.self, forKey: .preview)
    try preview.validate()
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
    version = 2
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
  public let frameworks: [String]

  public init(_ component: Component) {
    name = component.name
    title = component.title
    description = component.description
    category = component.category
    technique = component.technique
    frameworks = component.frameworks
  }
}
