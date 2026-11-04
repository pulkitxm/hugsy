import Foundation
import RegistryModels

struct InstallState: Codable {
  let version: Int
  let distribution: Distribution
  let components: [String]
  let files: [String: String]

  init(distribution: Distribution, components: [String], files: [String: String]) {
    version = 1
    self.distribution = distribution
    self.components = components
    self.files = files
  }
}

enum PackageLayout {
  static func files(components: [Component], distribution: Distribution) throws -> [String: Data] {
    var result: [String: Data] = ["LICENSE": try HugsyRegistry.license()]
    let hasResources = components.contains { $0.files.contains { $0.kind == .resource } }
    guard distribution == .package || !hasResources else {
      throw HugsyError(
        "Resource-bearing components require package distribution for Bundle.module.")
    }
    for component in components {
      for file in component.files {
        let relative =
          file.kind == .source
          ? "\(component.name)/\(file.path)" : "Resources/\(component.name)/\(file.path)"
        let path = distribution == .package ? "Sources/HugsyComponents/\(relative)" : file.path
        guard !result.keys.contains(where: { $0.lowercased() == path.lowercased() }) else {
          throw HugsyError("Duplicate installation path: \(path)")
        }
        result[path] = file.data
      }
    }
    if distribution == .package {
      let resources = hasResources ? ", resources: [.copy(\"Resources\")]" : ""
      result["Package.swift"] = Data(
        """
        // swift-tools-version: 6.0
        import PackageDescription

        let package = Package(
          name: "HugsyComponents",
          platforms: [.iOS(.v17)],
          products: [.library(name: "HugsyComponents", targets: ["HugsyComponents"])],
          targets: [.target(name: "HugsyComponents"\(resources))],
          swiftLanguageModes: [.v6]
        )

        """.utf8)
    }
    return result
  }

  static func instructions(_ config: ProjectConfig) -> [String] {
    if config.distribution == .package {
      return [
        "In Xcode: Add Package Dependencies > Add Local > select \(config.directory).",
        "Attach the HugsyComponents library product to your iOS app target (iOS 17+, Swift 6).",
        "Add import HugsyComponents to consuming Swift files, then use hugsy info <name> for usage.",
        "Package files written does not mean your app is linked. Build the app after attaching the product.",
      ]
    }
    return [
      "Add files in \(config.directory) to your iOS app target, or use an existing Swift package source target.",
      "Use types directly in the same module. Do not import the directory name.",
      "Confirm target membership and iOS 17+, Swift 6, then build your app. See hugsy info <name> for usage.",
    ]
  }
}
