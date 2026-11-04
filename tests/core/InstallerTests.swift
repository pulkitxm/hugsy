import Foundation
import HugsyCore
import RegistryModels
import Testing

@Suite struct InstallerTests {
  private func project() throws -> URL {
    let root = FileManager.default.temporaryDirectory.appendingPathComponent(
      "hugsy-test-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: root, withIntermediateDirectories: false)
    return root
  }

  @Test func registryIsOfflineAndIntegrityChecked() throws {
    let registry = try HugsyRegistry()
    #expect(registry.document.components.count == 6)
    #expect(registry.document.platform == "ios")
    #expect(registry.search("spring").count >= 2)
    #expect(registry.search("nothing-matches").isEmpty)
    #expect(throws: HugsyError.self) { try registry.component("../outside") }
    for component in registry.document.components {
      #expect(HugsyRegistry.digest(Data(component.source.utf8)) == component.sha256)
      #expect(component.source.contains("accessibilityReduceMotion"))
    }
  }

  @Test(arguments: ["../escape", "/absolute", "a/../b", "", "a\\b", "a//b", "."])
  func rejectsUnsafeDirectories(directory: String) {
    #expect(throws: HugsyError.self) { try ProjectConfig(directory: directory) }
  }

  @Test func dryRunInstallAndIdempotence() throws {
    let root = try project()
    defer { try? FileManager.default.removeItem(at: root) }
    let installer = Installer()
    _ = try installer.initialize(
      cwd: root.path, directory: "Sources/UI", distribution: .source, dryRun: true)
    #expect(!FileManager.default.fileExists(atPath: root.appendingPathComponent("hugsy.json").path))
    _ = try installer.initialize(cwd: root.path, directory: "Sources/UI", distribution: .source)
    _ = try installer.install(cwd: root.path, names: ["fluid-tabs"], dryRun: true)
    #expect(!FileManager.default.fileExists(atPath: root.appendingPathComponent("Sources").path))
    let result = try installer.install(
      cwd: root.path, names: ["fluid-tabs", "fluid-tabs", "toast-stack"])
    #expect(result.files.count == 4)
    let repeated = try installer.install(cwd: root.path, names: ["fluid-tabs"])
    #expect(repeated.files.allSatisfy { $0.status == .unchanged })
    #expect(throws: HugsyError.self) {
      try installer.initialize(cwd: root.path, directory: "Other")
    }
  }

  @Test func preservesEditsAndPreflightsWholeBatches() throws {
    let root = try project()
    defer { try? FileManager.default.removeItem(at: root) }
    let installer = Installer()
    _ = try installer.initialize(cwd: root.path, directory: "UI", distribution: .source)
    _ = try installer.install(cwd: root.path, names: ["fluid-tabs"])
    let path = root.appendingPathComponent("UI/HugsyFluidTabs.swift")
    try "custom\n".write(to: path, atomically: true, encoding: .utf8)
    #expect(throws: HugsyError.self) {
      try installer.install(cwd: root.path, names: ["toast-stack", "fluid-tabs"])
    }
    #expect(try String(contentsOf: path, encoding: .utf8) == "custom\n")
    #expect(
      !FileManager.default.fileExists(
        atPath: root.appendingPathComponent("UI/HugsyToastStack.swift").path))
    _ = try installer.install(cwd: root.path, names: ["fluid-tabs"], force: true)
    #expect(
      try String(contentsOf: path, encoding: .utf8)
        == HugsyRegistry().component("fluid-tabs").source)
  }

  @Test func rejectsDestinationAndConfigSymlinks() throws {
    let root = try project()
    let outside = try project()
    defer {
      try? FileManager.default.removeItem(at: root)
      try? FileManager.default.removeItem(at: outside)
    }
    let installer = Installer()
    _ = try installer.initialize(cwd: root.path, directory: "UI", distribution: .source)
    try FileManager.default.createSymbolicLink(
      at: root.appendingPathComponent("UI"), withDestinationURL: outside)
    #expect(throws: HugsyError.self) {
      try installer.install(cwd: root.path, names: ["fluid-tabs"], force: true)
    }
    try FileManager.default.removeItem(at: root.appendingPathComponent("hugsy.json"))
    try FileManager.default.createSymbolicLink(
      at: root.appendingPathComponent("hugsy.json"),
      withDestinationURL: outside.appendingPathComponent("missing"))
    #expect(throws: HugsyError.self) { try installer.plan(cwd: root.path, names: ["fluid-tabs"]) }
  }

  @Test func rollbackRestoresReplacedAndNewFiles() throws {
    let root = try project()
    defer { try? FileManager.default.removeItem(at: root) }
    _ = try Installer().initialize(cwd: root.path, directory: "UI", distribution: .source)
    _ = try Installer().install(cwd: root.path, names: ["fluid-tabs"])
    let path = root.appendingPathComponent("UI/HugsyFluidTabs.swift")
    try "local\n".write(to: path, atomically: true, encoding: .utf8)
    var writes = 0
    let installer = Installer { source, destination in
      writes += 1
      if writes == 3 { throw HugsyError("Synthetic write failure") }
      try Installer.renameFile(source, destination)
    }
    #expect(throws: HugsyError.self) {
      try installer.install(
        cwd: root.path, names: ["toast-stack", "fluid-tabs", "radial-menu"], force: true)
    }
    #expect(try String(contentsOf: path, encoding: .utf8) == "local\n")
    #expect(
      !FileManager.default.fileExists(
        atPath: root.appendingPathComponent("UI/HugsyToastStack.swift").path))
    #expect(
      !FileManager.default.fileExists(
        atPath: root.appendingPathComponent(".hugsy-install.lock").path))
  }
}
