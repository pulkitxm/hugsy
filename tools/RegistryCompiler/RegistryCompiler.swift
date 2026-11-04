import CryptoKit
import Foundation
import RegistryModels

@main struct RegistryCompiler {
  static func main() throws {
    guard CommandLine.arguments.count == 3 else {
      throw NSError(
        domain: "hugsy", code: 1,
        userInfo: [NSLocalizedDescriptionKey: "Expected registry directory and output file"])
    }
    let root = URL(fileURLWithPath: CommandLine.arguments[1])
    let data = try Data(contentsOf: root.appendingPathComponent("catalog.json"))
    var components = try JSONDecoder().decode([Component].self, from: data)
    for index in components.indices {
      let source = try Data(
        contentsOf: root.appendingPathComponent("swift/\(components[index].filename)"))
      guard let text = String(data: source, encoding: .utf8) else {
        throw CocoaError(.fileReadInapplicableStringEncoding)
      }
      components[index].source = text
      components[index].sha256 = SHA256.hash(data: source).map { String(format: "%02x", $0) }
        .joined()
    }
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
    let registry = try encoder.encode(RegistryDocument(components: components))
    let output = "let embeddedRegistryBase64 = \"\(registry.base64EncodedString())\"\n"
    try output.write(toFile: CommandLine.arguments[2], atomically: true, encoding: .utf8)
  }
}
