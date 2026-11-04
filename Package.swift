// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "Hugsy",
  platforms: [.macOS(.v14)],
  products: [
    .library(name: "Hugsy", targets: ["Hugsy"]),
    .executable(name: "HugsyGallery", targets: ["HugsyGallery"]),
  ],
  targets: [
    .target(name: "Hugsy", path: "registry/swift"),
    .executableTarget(name: "HugsyGallery", dependencies: ["Hugsy"], path: "examples"),
    .testTarget(name: "HugsyTests", dependencies: ["Hugsy"], path: "tests/swift"),
  ],
  swiftLanguageModes: [.v6]
)
