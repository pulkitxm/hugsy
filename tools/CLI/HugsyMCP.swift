import Foundation
import HugsyCore
import MCP
import RegistryModels

enum HugsyMCP {
  static func serve() async throws {
    let registry = try HugsyRegistry()
    let server = Server(
      name: "hugsy", version: "0.3.0",
      instructions:
        "Discover iOS components and services across Apple frameworks and plan local package or source installation. Every tool is read-only and offline. Use the native hugsy CLI for writes with user permission. Requires iOS 17+ and Swift 6. Preserve customized source and Reduce Motion behavior.",
      capabilities: .init(prompts: .init(), resources: .init(), tools: .init()),
      configuration: .strict)
    await server.withMethodHandler(ListTools.self) { _ in
      let hints = Tool.Annotations(
        readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false)
      return .init(tools: [
        Tool(
          name: "search_components",
          description: "Search iOS component names, categories, techniques, and system frameworks.",
          inputSchema: schema(properties: ["query": .object(["type": "string", "maxLength": 200])]),
          annotations: hints),
        Tool(
          name: "get_component",
          description:
            "Read all source files, binary resources, dependencies, framework requirements, usage, and checksums.",
          inputSchema: schema(
            properties: ["name": .object(["type": "string", "maxLength": 80])], required: ["name"]),
          annotations: hints),
        Tool(
          name: "plan_install",
          description:
            "Get source files and safe CLI commands. Does not inspect or write project files.",
          inputSchema: schema(
            properties: [
              "names": .object([
                "type": "array", "minItems": 1, "maxItems": 6, "items": .object(["type": "string"]),
              ])
            ], required: ["names"]), annotations: hints),
      ])
    }
    await server.withMethodHandler(CallTool.self) { parameters in
      do {
        switch parameters.name {
        case "search_components":
          let arguments = parameters.arguments ?? [:]
          guard Set(arguments.keys).isSubset(of: ["query"]),
            arguments["query"] == nil || arguments["query"]?.stringValue != nil
          else { throw HugsyError("Expected an optional string query only.") }
          let query = arguments["query"]?.stringValue ?? ""
          guard query.count <= 200 else { throw HugsyError("Query exceeds 200 characters.") }
          struct Output: Codable { let components: [ComponentSummary] }
          return try result(Output(components: registry.search(query).map(ComponentSummary.init)))
        case "get_component":
          guard let arguments = parameters.arguments, Set(arguments.keys) == ["name"],
            let name = arguments["name"]?.stringValue
          else { throw HugsyError("Expected a component name.") }
          return try result(registry.component(name))
        case "plan_install":
          guard let arguments = parameters.arguments, Set(arguments.keys) == ["names"],
            let values = arguments["names"]?.arrayValue,
            !values.isEmpty, values.count <= 6
          else { throw HugsyError("Expected between one and six component names.") }
          let names = values.compactMap(\.stringValue)
          guard names.count == values.count else {
            throw HugsyError("Every component name must be a string.")
          }
          struct Output: Codable {
            let files: [Component]
            let commands: [String]
            let warning: String
          }
          let files = try registry.resolved(names)
          return try result(
            Output(
              files: files,
              commands: [
                "hugsy init", "hugsy add \(names.joined(separator: " ")) --dry-run --json",
                "hugsy add \(names.joined(separator: " "))",
              ],
              warning:
                "Default installation creates a local Swift package. Add it in Xcode, attach HugsyComponents to the app target, and import HugsyComponents. Source mode requires target membership instead. Never replace customized files without permission."
            ))
        default: throw HugsyError("Unknown tool: \(parameters.name)")
        }
      } catch {
        return .init(
          content: [.text(text: String(describing: error), annotations: nil, _meta: nil)],
          isError: true)
      }
    }
    await server.withMethodHandler(ListResources.self) { _ in
      .init(
        resources: [
          Resource(
            name: "registry", uri: "hugsy://registry", description: "Complete offline iOS registry",
            mimeType: "application/json")
        ]
          + registry.document.components.map {
            Resource(
              name: $0.name, uri: "hugsy://components/\($0.name)", description: $0.description,
              mimeType: "application/json")
          })
    }
    await server.withMethodHandler(ReadResource.self) { parameters in
      if parameters.uri == "hugsy://registry" {
        return .init(contents: [
          .text(
            try jsonString(registry.document), uri: parameters.uri, mimeType: "application/json")
        ])
      }
      let prefix = "hugsy://components/"
      guard parameters.uri.hasPrefix(prefix) else {
        throw MCPError.invalidParams("Unknown resource")
      }
      let item = try registry.component(String(parameters.uri.dropFirst(prefix.count)))
      return .init(contents: [
        .text(try jsonString(item), uri: parameters.uri, mimeType: "application/json")
      ])
    }
    await server.withMethodHandler(ListPrompts.self) { _ in
      .init(prompts: [
        Prompt(
          name: "integrate_component", description: "Source-aware iOS integration checklist",
          arguments: [.init(name: "name", description: "Component slug", required: true)])
      ])
    }
    await server.withMethodHandler(GetPrompt.self) { parameters in
      guard parameters.name == "integrate_component", let name = parameters.arguments?["name"]
      else { throw MCPError.invalidParams("Expected component name") }
      let item = try registry.component(name)
      return .init(messages: [
        .user(
          .text(
            text:
              "Integrate \(name) into my iOS app. Check the app target and deployment target first. Preserve source edits and Reduce Motion. Plan before writing.\n\n\(try jsonString(item))"
          ))
      ])
    }
    try await server.start(transport: StdioTransport())
    await server.waitUntilCompleted()
    await server.stop()
  }

  private static func schema(properties: [String: Value], required: [String] = []) -> Value {
    .object([
      "type": "object", "properties": .object(properties),
      "required": .array(required.map(Value.string)), "additionalProperties": false,
    ])
  }

  private static func result<Output: Codable>(_ output: Output) throws -> CallTool.Result {
    try .init(
      content: [.text(text: jsonString(output), annotations: nil, _meta: nil)],
      structuredContent: output, isError: false)
  }
}
