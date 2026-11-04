import Foundation
import PackagePlugin

@main struct RegistryPlugin: BuildToolPlugin {
  func createBuildCommands(context: PluginContext, target: Target) async throws -> [Command] {
    let root = context.package.directoryURL.appendingPathComponent("registry")
    let catalog = root.appendingPathComponent("catalog.json")
    let sources = try FileManager.default.contentsOfDirectory(
      at: root.appendingPathComponent("swift"), includingPropertiesForKeys: nil
    ).filter { $0.pathExtension == "swift" }
    let output = context.pluginWorkDirectoryURL.appendingPathComponent("EmbeddedRegistry.swift")
    return [
      .buildCommand(
        displayName: "Compile offline component registry",
        executable: try context.tool(named: "RegistryCompiler").url,
        arguments: [root.path, output.path],
        inputFiles: [catalog] + sources,
        outputFiles: [output]
      )
    ]
  }
}
