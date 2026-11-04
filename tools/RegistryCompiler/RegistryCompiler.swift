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
      for fileIndex in components[index].files.indices {
        let path = components[index].files[fileIndex].path
        guard ComponentFile.isSafePath(path) else { throw CocoaError(.fileReadInvalidFileName) }
        let payload = try Data(contentsOf: root.appendingPathComponent("swift/\(path)"))
        components[index].files[fileIndex].data = payload
        components[index].files[fileIndex].sha256 = SHA256.hash(data: payload)
          .map { String(format: "%02x", $0) }.joined()
      }
      guard
        let primary = components[index].files.first(where: {
          $0.path == components[index].filename && $0.kind == .source
        })
      else { throw CocoaError(.fileReadInvalidFileName) }
      let source = primary.data
      guard let text = String(data: source, encoding: .utf8) else {
        throw CocoaError(.fileReadInapplicableStringEncoding)
      }
      components[index].source = text
      components[index].sha256 = primary.sha256
    }
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
    let registry = try encoder.encode(RegistryDocument(components: components))
    let license = try Data(
      contentsOf: root.deletingLastPathComponent().appendingPathComponent("LICENSE"))
    let output =
      "let embeddedRegistryBase64 = \"\(registry.base64EncodedString())\"\nlet embeddedLicenseBase64 = \"\(license.base64EncodedString())\"\n"
    try output.write(toFile: CommandLine.arguments[2], atomically: true, encoding: .utf8)
  }
}
