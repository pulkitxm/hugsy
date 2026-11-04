import CryptoKit
import Foundation
import RegistryModels

public struct HugsyError: Error, CustomStringConvertible, Sendable {
  public let description: String
  public init(_ description: String) { self.description = description }
}

public struct HugsyRegistry: Sendable {
  public let document: RegistryDocument

  public init() throws {
    guard let data = Data(base64Encoded: embeddedRegistryBase64) else {
      throw HugsyError("Invalid embedded registry")
    }
    try self.init(document: JSONDecoder().decode(RegistryDocument.self, from: data))
  }

  public init(document: RegistryDocument) throws {
    guard document.version == 2, document.platform == "ios", document.minimumVersion == "17.0",
      Set(document.components.map(\.name)).count == document.components.count
    else {
      throw HugsyError("Unsupported or duplicate registry entries")
    }
    for component in document.components {
      guard component.name.range(of: "^[a-z]+(-[a-z]+)*$", options: .regularExpression) != nil,
        component.filename.range(of: "^Hugsy[A-Za-z]+\\.swift$", options: .regularExpression)
          != nil,
        !component.frameworks.isEmpty,
        component.frameworks.allSatisfy({
          $0.range(of: "^[A-Z][A-Za-z0-9]*$", options: .regularExpression) != nil
        }),
        Set(component.dependencies).count == component.dependencies.count,
        !component.source.isEmpty,
        component.files.contains(where: {
          $0.path == component.filename && $0.kind == .source
            && $0.data == Data(component.source.utf8)
        }),
        Set(component.files.map { $0.path.lowercased() }).count == component.files.count,
        component.files.allSatisfy({
          ComponentFile.isSafePath($0.path) && Self.digest($0.data) == $0.sha256
            && ($0.kind == .resource
              || ($0.path.hasSuffix(".swift") && String(data: $0.data, encoding: .utf8) != nil))
        }),
        Self.digest(Data(component.source.utf8)) == component.sha256
      else {
        throw HugsyError("Invalid component integrity: \(component.name)")
      }
    }
    self.document = document
    _ = try resolved(document.components.map(\.name))
  }

  public func component(_ name: String) throws -> Component {
    guard let item = document.components.first(where: { $0.name == name }) else {
      throw HugsyError("Unknown component: \(name). Run hugsy list.")
    }
    return item
  }

  public func search(_ query: String = "") -> [Component] {
    let terms = query.lowercased().split(whereSeparator: \.isWhitespace)
    return document.components.filter { item in
      let text =
        "\(item.name) \(item.description) \(item.category) \(item.technique) \(item.frameworks.joined(separator: " "))"
        .lowercased()
      return terms.allSatisfy { text.contains($0) }
    }
  }

  public func resolved(_ names: [String]) throws -> [Component] {
    var visiting = Set<String>()
    var visited = Set<String>()
    var result: [Component] = []
    func visit(_ name: String) throws {
      if visited.contains(name) { return }
      guard visiting.insert(name).inserted else { throw HugsyError("Dependency cycle: \(name)") }
      let item = try component(name)
      for dependency in item.dependencies { try visit(dependency) }
      visiting.remove(name)
      visited.insert(name)
      result.append(item)
    }
    for name in names { try visit(name) }
    return result
  }

  public static func digest(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
  }

  public static func license() throws -> Data {
    guard let data = Data(base64Encoded: embeddedLicenseBase64) else {
      throw HugsyError("Invalid embedded license")
    }
    return data
  }
}

public func jsonString<Value: Encodable>(_ value: Value) throws -> String {
  let encoder = JSONEncoder()
  encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
  guard let text = String(data: try encoder.encode(value), encoding: .utf8) else {
    throw HugsyError("Could not encode JSON")
  }
  return text
}
