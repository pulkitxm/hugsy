import Foundation
import HugsyCore
import RegistryModels
import Testing

@Suite struct DistributionTests {
  private struct FixtureFile: Encodable {
    let path: String
    let kind: String
    let data: Data
    let sha256: String
  }

  private struct Fixture: Encodable {
    let name: String
    let filename: String
    let frameworks: [String]
    let dependencies: [String]
    let files: [FixtureFile]
    let source: String
    let sha256: String
    let title = "Fixture"
    let description = "Synthetic component"
    let category = "Infrastructure"
    let technique = "Native SDK"
    let states = ["Ready"]
    let interaction = "Synthetic interaction"
    let accessibility = "Synthetic accessibility"
    let integration = "Synthetic integration"
    let usage = "Synthetic usage"
  }
  private func project() throws -> URL {
    let root = FileManager.default.temporaryDirectory.appendingPathComponent(
      "hugsy-distribution-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: root, withIntermediateDirectories: false)
    return root
  }

  private func component(
    _ name: String, frameworks: [String] = ["Foundation"], dependencies: [String] = [],
    files: [String: Data] = [:], source: String = "import Foundation\n"
  ) throws -> Component {
    let filename = "Hugsy\(name.split(separator: "-").map { $0.capitalized }.joined()).swift"
    let payloads = files.merging([filename: Data(source.utf8)]) { _, primary in primary }
    let fixture = Fixture(
      name: name, filename: filename, frameworks: frameworks, dependencies: dependencies,
      files: payloads.sorted { $0.key < $1.key }.map { path, data in
        FixtureFile(
          path: path, kind: path.hasSuffix(".swift") ? "source" : "resource", data: data,
          sha256: HugsyRegistry.digest(data))
      }, source: source, sha256: HugsyRegistry.digest(Data(source.utf8)))
    return try JSONDecoder().decode(Component.self, from: JSONEncoder().encode(fixture))
  }

  @Test func packageInstallRetainsSelectionsAndLicense() throws {
    let root = try project()
    defer { try? FileManager.default.removeItem(at: root) }
    let installer = Installer()
    _ = try installer.initialize(cwd: root.path, directory: "Packages/Hugsy")
    let dry = try installer.install(cwd: root.path, names: ["fluid-tabs"], dryRun: true)
    #expect(dry.distribution == .package)
    #expect(dry.instructions.contains { $0.contains("import HugsyComponents") })
    #expect(!FileManager.default.fileExists(atPath: root.appendingPathComponent("Packages").path))
    _ = try installer.install(cwd: root.path, names: ["fluid-tabs"])
    let result = try installer.install(cwd: root.path, names: ["toast-stack"])
    #expect(Set(result.components) == ["fluid-tabs", "toast-stack"])
    #expect(
      result.files.contains {
        $0.path.hasSuffix("fluid-tabs/HugsyFluidTabs.swift") && $0.status == .unchanged
      })
    #expect(
      try Data(contentsOf: root.appendingPathComponent("Packages/Hugsy/LICENSE"))
        == HugsyRegistry.license())
    let manifest = try String(
      contentsOf: root.appendingPathComponent("Packages/Hugsy/Package.swift"), encoding: .utf8)
    #expect(!manifest.contains(".package(url:"))
    #expect(!manifest.contains("resources:"))
    #expect(
      try installer.plan(cwd: root.path, names: ["toast-stack"]).files.allSatisfy {
        $0.status == .unchanged
      })
  }

  @Test func resolvesSharedDependenciesAndCopiesBinaryResources() throws {
    let root = try project()
    defer { try? FileManager.default.removeItem(at: root) }
    let bytes = Data([0, 255, 10, 128])
    let cache = try component(
      "image-cache", files: ["Helpers/Storage.swift": Data("struct Storage {}\n".utf8)])
    let image = try component(
      "cached-image", frameworks: ["UIKit"], dependencies: ["image-cache"],
      files: ["placeholder.bin": bytes])
    let registry = try HugsyRegistry(document: RegistryDocument(components: [image, cache]))
    #expect(
      try registry.resolved(["cached-image", "image-cache"]).map(\.name) == [
        "image-cache", "cached-image",
      ])
    #expect(registry.search("UIKit").map(\.name) == ["cached-image"])
    let installer = Installer(registry: registry)
    _ = try installer.initialize(cwd: root.path, directory: "Hugsy")
    let plan = try installer.install(cwd: root.path, names: ["cached-image"])
    #expect(plan.frameworks == ["Foundation", "UIKit"])
    #expect(
      try Data(
        contentsOf: root.appendingPathComponent(
          "Hugsy/Sources/HugsyComponents/Resources/cached-image/placeholder.bin")) == bytes)
    #expect(
      FileManager.default.fileExists(
        atPath: root.appendingPathComponent(
          "Hugsy/Sources/HugsyComponents/image-cache/Helpers/Storage.swift"
        ).path))
    #expect(
      try String(contentsOf: root.appendingPathComponent("Hugsy/Package.swift"), encoding: .utf8)
        .contains(".copy(\"Resources\")"))
  }

  @Test func updatesOnlyUnmodifiedUpstreamFiles() throws {
    let root = try project()
    defer { try? FileManager.default.removeItem(at: root) }
    let old = try component("service", source: "public let value = 1\n")
    let next = try component("service", source: "public let value = 2\n")
    let original = Installer(
      registry: try HugsyRegistry(document: RegistryDocument(components: [old])))
    let updated = Installer(
      registry: try HugsyRegistry(document: RegistryDocument(components: [next])))
    _ = try original.initialize(cwd: root.path, directory: "Hugsy")
    _ = try original.install(cwd: root.path, names: ["service"])
    #expect(
      try updated.install(cwd: root.path, names: ["service"]).files.contains {
        $0.status == .update
      })
    let path = root.appendingPathComponent(
      "Hugsy/Sources/HugsyComponents/service/HugsyService.swift")
    try Data("local edits\n".utf8).write(to: path)
    #expect(throws: HugsyError.self) { try updated.install(cwd: root.path, names: ["service"]) }
    #expect(try String(contentsOf: path, encoding: .utf8) == "local edits\n")
    _ = try updated.install(cwd: root.path, names: ["service"], force: true)
    let manifest = root.appendingPathComponent("Hugsy/Package.swift")
    try Data("custom manifest\n".utf8).write(to: manifest)
    #expect(throws: HugsyError.self) { try updated.install(cwd: root.path, names: ["service"]) }
  }

  @Test func rejectsInvalidGraphsPathsPayloadsAndLegacyConfig() throws {
    let cycle = try component("cycle", dependencies: ["cycle"])
    let missing = try component("missing", dependencies: ["unknown"])
    let unsafe = try component("unsafe", files: ["../escape.swift": Data("x".utf8)])
    for item in [cycle, missing, unsafe] {
      #expect(throws: HugsyError.self) {
        try HugsyRegistry(document: RegistryDocument(components: [item]))
      }
    }
    var corrupt = try component("corrupt")
    corrupt.files[0].data = Data("tampered".utf8)
    #expect(throws: HugsyError.self) {
      try HugsyRegistry(document: RegistryDocument(components: [corrupt]))
    }
    #expect(throws: HugsyError.self) {
      try JSONDecoder().decode(
        ProjectConfig.self, from: Data("{\"version\":1,\"directory\":\"Hugsy\"}".utf8))
    }
  }

  @Test func rejectsResourcesInSourceModeAndNestedSymlinks() throws {
    let root = try project()
    let outside = try project()
    defer {
      try? FileManager.default.removeItem(at: root)
      try? FileManager.default.removeItem(at: outside)
    }
    let item = try component("resource", files: ["asset.bin": Data([0, 255])])
    let installer = Installer(
      registry: try HugsyRegistry(document: RegistryDocument(components: [item])))
    _ = try installer.initialize(cwd: root.path, directory: "UI", distribution: .source)
    #expect(throws: HugsyError.self) { try installer.install(cwd: root.path, names: ["resource"]) }
    #expect(!FileManager.default.fileExists(atPath: root.appendingPathComponent("UI").path))
    try FileManager.default.removeItem(at: root.appendingPathComponent("hugsy.json"))
    _ = try Installer().initialize(cwd: root.path, directory: "Hugsy")
    try FileManager.default.createDirectory(
      at: root.appendingPathComponent("Hugsy"), withIntermediateDirectories: false)
    try FileManager.default.createSymbolicLink(
      at: root.appendingPathComponent("Hugsy/Sources"), withDestinationURL: outside)
    #expect(throws: HugsyError.self) {
      try Installer().install(cwd: root.path, names: ["fluid-tabs"])
    }
    #expect(try FileManager.default.contentsOfDirectory(atPath: outside.path).isEmpty)
  }
}
