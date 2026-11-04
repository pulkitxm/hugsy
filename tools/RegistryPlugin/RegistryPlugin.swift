import Foundation
import PackagePlugin

@main struct RegistryPlugin: BuildToolPlugin {
  func createBuildCommands(context: PluginContext, target: Target) async throws -> [Command] {
    let root = context.package.directoryURL.appendingPathComponent("registry")
    let catalog = root.appendingPathComponent("catalog.json")
    let sources =
      FileManager.default.enumerator(
        at: root.appendingPathComponent("swift"), includingPropertiesForKeys: [.isRegularFileKey])?
      .compactMap { $0 as? URL } ?? []
    let output = context.pluginWorkDirectoryURL.appendingPathComponent("EmbeddedRegistry.swift")
    return [
      .buildCommand(
        displayName: "Compile offline component registry",
        executable: try context.tool(named: "RegistryCompiler").url,
        arguments: [root.path, output.path],
        inputFiles: [catalog, context.package.directoryURL.appendingPathComponent("LICENSE")]
          + sources,
        outputFiles: [output]
      )
    ]
  }
}
