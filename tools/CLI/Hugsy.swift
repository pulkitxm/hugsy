import ArgumentParser
import Foundation
import HugsyCore
import RegistryModels

@main struct Hugsy: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "hugsy",
    abstract: "Source-owned iOS components and services, packaged for your app.",
    version: "0.3.0",
    subcommands: [
      List.self, Info.self, Initialize.self, Add.self, Diff.self, Doctor.self, MCPCommand.self,
      MCPConfig.self,
    ]
  )
}

private struct Options: ParsableArguments {
  @Option(name: .long, help: "Project directory.") var cwd = FileManager.default
    .currentDirectoryPath
  @Flag(name: .long, help: "Machine-readable JSON.") var json = false

  func write<Value: Encodable>(_ value: Value, text: String) throws {
    let result = try json ? jsonString(value) : text
    FileHandle.standardOutput.write(Data((result + "\n").utf8))
  }

  func perform(_ action: () throws -> Void) throws {
    do { try action() } catch {
      if json {
        struct Failure: Encodable {
          let error: Details
          struct Details: Encodable { let message: String }
        }
        let output = try jsonString(Failure(error: .init(message: String(describing: error))))
        FileHandle.standardError.write(Data((output + "\n").utf8))
        throw ExitCode.failure
      }
      throw error
    }
  }
}

private struct List: ParsableCommand {
  static let configuration = CommandConfiguration(abstract: "List or search the offline registry.")
  @OptionGroup var options: Options
  @Argument var query: String = ""
  func run() throws {
    try options.perform {
      struct Result: Encodable { let components: [ComponentSummary] }
      let components = try HugsyRegistry().search(query).map(ComponentSummary.init)
      try options.write(
        Result(components: components),
        text: components.map {
          "\($0.name.padding(toLength: 20, withPad: " ", startingAt: 0)) \($0.description)"
        }.joined(separator: "\n"))
    }
  }
}

private struct Info: ParsableCommand {
  static let configuration = CommandConfiguration(
    abstract: "Read Swift source, SwiftUI and UIKit usage, and accessibility notes.")
  @OptionGroup var options: Options
  @Argument var name: String
  func run() throws {
    try options.perform {
      let item = try HugsyRegistry().component(name)
      let uikit = item.uikitUsage.map { "\n\nUIKit:\n\($0)" } ?? ""
      try options.write(
        item,
        text:
          "\(item.title)\n\(item.description)\nFrameworks: \(item.frameworks.joined(separator: ", "))\nFiles: \(item.files.map(\.path).joined(separator: ", "))\nDependencies: \(item.dependencies.joined(separator: ", "))\n\n\(item.integration)\n\nSwiftUI:\n\(item.usage)\(uikit)\n\n\(item.accessibility)"
      )
    }
  }
}

private struct Initialize: ParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "init", abstract: "Create hugsy.json without editing your Xcode project.")
  @OptionGroup var options: Options
  @Option(name: .long) var directory = "Hugsy"
  @Option(name: .long, help: "package (default) or source.") var distribution = "package"
  @Flag(name: .long) var dryRun = false
  func run() throws {
    try options.perform {
      guard let mode = Distribution(rawValue: distribution) else {
        throw HugsyError("Distribution must be package or source.")
      }
      let config = try Installer().initialize(
        cwd: options.cwd, directory: directory, distribution: mode, dryRun: dryRun)
      struct Result: Encodable {
        let config: ProjectConfig
        let dryRun: Bool
      }
      try options.write(
        Result(config: config, dryRun: dryRun),
        text:
          "\(dryRun ? "Would create" : "Created") hugsy.json. \(mode.rawValue) distribution in \(directory)/. Run hugsy add <name>, then hugsy doctor for target integration."
      )
    }
  }
}

private struct Add: ParsableCommand {
  static let configuration = CommandConfiguration(
    abstract: "Install iOS components and their dependencies, preserving customized files.")
  @OptionGroup var options: Options
  @Argument var names: [String]
  @Flag(name: .long) var dryRun = false
  @Flag(name: .long) var force = false
  func run() throws {
    try options.perform {
      let plan = try Installer().install(
        cwd: options.cwd, names: names, dryRun: dryRun, force: force)
      struct File: Encodable {
        let name: String
        let path: String
        let status: FilePlan.Status
        let sha256: String
      }
      struct Result: Encodable {
        let dryRun: Bool
        let files: [File]
        let distribution: Distribution
        let components: [String]
        let frameworks: [String]
        let instructions: [String]
      }
      let files = plan.files.map {
        File(name: $0.name, path: $0.path, status: $0.status, sha256: $0.sha256)
      }
      try options.write(
        Result(
          dryRun: dryRun, files: files, distribution: plan.distribution,
          components: plan.components,
          frameworks: plan.frameworks, instructions: plan.instructions),
        text: files.map { "\(dryRun ? "plan" : "done") \($0.status.rawValue) \($0.path)" }.joined(
          separator: "\n") + "\n\n" + plan.instructions.joined(separator: "\n"))
    }
  }
}

private struct Diff: ParsableCommand {
  static let configuration = CommandConfiguration(
    abstract: "Inspect installed and registry source without writing.")
  @OptionGroup var options: Options
  @Argument var names: [String]
  func run() throws {
    try options.perform {
      let plan = try Installer().plan(cwd: options.cwd, names: names)
      try options.write(
        plan,
        text: plan.files.map {
          "\($0.name): \($0.status.rawValue)\n\nInstalled:\n\($0.previous.flatMap { String(data: $0, encoding: .utf8) } ?? "Not installed or binary data")\n\nRegistry:\n\(String(data: $0.data, encoding: .utf8) ?? "Binary data (see JSON base64 payload)")"
        }.joined(separator: "\n"))
    }
  }
}

private struct Doctor: ParsableCommand {
  static let configuration = CommandConfiguration(
    abstract: "Check configuration and explain iOS target integration.")
  @OptionGroup var options: Options
  func run() throws {
    try options.perform {
      let root = URL(fileURLWithPath: options.cwd)
      let configured = FileManager.default.fileExists(
        atPath: root.appendingPathComponent("hugsy.json").path)
      let config = configured ? try Installer().configuration(cwd: options.cwd) : nil
      let plan = configured ? try Installer().plan(cwd: options.cwd, names: []) : nil
      struct Result: Encodable {
        let configured: Bool
        let platform = "ios"
        let minimumVersion = "17.0"
        let swift = "6.0"
        let distribution: Distribution?
        let instructions: [String]
        let conflicts: [String]
        let targetLinkage =
          "Not inspected. Confirm the library product or source target membership in Xcode."
      }
      let instructions =
        config.map { config in
          config.distribution == .package
            ? [
              "Add Local Package: \(config.directory). Attach HugsyComponents to the app target. Use import HugsyComponents."
            ]
            : [
              "Confirm copied files in \(config.directory) belong to the app target. No extra module import."
            ]
        } ?? ["Run hugsy init, then hugsy add <name>."]
      let result = Result(
        configured: configured, distribution: config?.distribution, instructions: instructions,
        conflicts: plan?.files.filter { $0.status == .conflict }.map(\.name) ?? [])
      try options.write(
        result,
        text:
          "\(configured ? "Configuration valid" : "Run hugsy init first")\nRequires iOS 17+, Swift 6.\n\(instructions.joined(separator: "\n"))\n\(result.targetLinkage)\nLocal conflicts: \(result.conflicts.isEmpty ? "none" : result.conflicts.joined(separator: ", "))"
      )
    }
  }
}

private struct MCPCommand: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "mcp", abstract: "Serve read-only MCP tools, resources, and prompts over stdio.")
  func run() async throws { try await HugsyMCP.serve() }
}

private struct MCPConfig: ParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "mcp-config", abstract: "Print portable MCP host configuration.")
  func run() {
    FileHandle.standardOutput.write(
      Data("{\"mcpServers\":{\"hugsy\":{\"command\":\"hugsy\",\"args\":[\"mcp\"]}}}\n".utf8))
  }
}
