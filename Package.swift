// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "Hugsy",
  platforms: [.iOS(.v17), .macOS(.v14)],
  products: [
    .library(name: "Hugsy", targets: ["Hugsy"]),
    .library(name: "HugsyPreviewKit", targets: ["HugsyPreviewKit"]),
    .executable(name: "HugsyGallery", targets: ["HugsyGallery"]),
    .executable(name: "hugsy", targets: ["HugsyCLI"]),
  ],
  dependencies: [
    .package(url: "https://github.com/apple/swift-argument-parser.git", exact: "1.8.2"),
    .package(url: "https://github.com/modelcontextprotocol/swift-sdk.git", exact: "0.12.1"),
  ],
  targets: [
    .target(name: "Hugsy", path: "registry/swift"),
    .executableTarget(
      name: "HugsyGallery", dependencies: ["Hugsy", "HugsyPreviewKit"], path: "examples",
      exclude: ["Info.plist"]),
    .target(
      name: "HugsyPreviewKit", dependencies: ["RegistryModels"], path: "tools/PreviewKit",
      plugins: ["RegistryPlugin"]),
    .testTarget(
      name: "HugsyPreviewKitTests", dependencies: ["HugsyPreviewKit", "RegistryModels"],
      path: "tests/preview"),
    .testTarget(name: "HugsyTests", dependencies: ["Hugsy"], path: "tests/swift"),
    .testTarget(name: "HugsyRenderTests", dependencies: ["Hugsy"], path: "tests/render"),
    .target(name: "RegistryModels", path: "tools/Models"),
    .target(
      name: "HugsyCore", dependencies: ["RegistryModels"], path: "tools/Core",
      plugins: ["RegistryPlugin"]),
    .executableTarget(
      name: "HugsyCLI",
      dependencies: [
        "HugsyCore",
        "RegistryModels",
        .product(name: "ArgumentParser", package: "swift-argument-parser"),
        .product(name: "MCP", package: "swift-sdk"),
      ], path: "tools/CLI"),
    .executableTarget(
      name: "RegistryCompiler", dependencies: ["RegistryModels"], path: "tools/RegistryCompiler"),
    .plugin(
      name: "RegistryPlugin", capability: .buildTool(), dependencies: ["RegistryCompiler"],
      path: "tools/RegistryPlugin"),
    .testTarget(
      name: "HugsyCoreTests", dependencies: ["HugsyCore", "RegistryModels"], path: "tests/core"),
  ],
  swiftLanguageModes: [.v6]
)
