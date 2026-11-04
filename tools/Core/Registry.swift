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
    let document = try JSONDecoder().decode(RegistryDocument.self, from: data)
    guard document.version == 1, document.platform == "ios", document.minimumVersion == "17.0",
      Set(document.components.map(\.name)).count == document.components.count
    else {
      throw HugsyError("Unsupported or duplicate registry entries")
    }
    for component in document.components {
      guard component.name.range(of: "^[a-z]+(-[a-z]+)*$", options: .regularExpression) != nil,
        component.filename.range(of: "^Hugsy[A-Za-z]+\\.swift$", options: .regularExpression)
          != nil,
        !component.source.isEmpty,
        Self.digest(Data(component.source.utf8)) == component.sha256
      else {
        throw HugsyError("Invalid component integrity: \(component.name)")
      }
    }
    self.document = document
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
      let text = "\(item.name) \(item.description) \(item.category) \(item.technique)".lowercased()
      return terms.allSatisfy { text.contains($0) }
    }
  }

  public static func digest(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
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
