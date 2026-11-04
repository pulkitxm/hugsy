import Darwin
import Foundation
import RegistryModels

public enum Distribution: String, Codable, Sendable { case package, source }

public struct ProjectConfig: Codable, Equatable, Sendable {
  public let version: Int
  public let directory: String
  public let distribution: Distribution

  public init(directory: String, distribution: Distribution = .package) throws {
    guard directory.count <= 240,
      directory.range(of: "^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*$", options: .regularExpression) != nil
    else {
      throw HugsyError("Use a project-relative directory without spaces, traversal, or symlinks.")
    }
    version = 2
    self.directory = directory
    self.distribution = distribution
  }

  private struct Key: CodingKey {
    let stringValue: String
    let intValue: Int? = nil
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { return nil }
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: Key.self)
    guard Set(container.allKeys.map(\.stringValue)) == ["version", "directory", "distribution"],
      let versionKey = Key(stringValue: "version"),
      let directoryKey = Key(stringValue: "directory"),
      let distributionKey = Key(stringValue: "distribution"),
      try container.decode(Int.self, forKey: versionKey) == 2
    else {
      throw HugsyError(
        "Expected version 2 configuration with directory and distribution. Review existing files before replacing hugsy.json."
      )
    }
    try self.init(
      directory: container.decode(String.self, forKey: directoryKey),
      distribution: container.decode(Distribution.self, forKey: distributionKey))
  }
}

public struct FilePlan: Codable, Equatable, Sendable {
  public enum Status: String, Codable, Sendable { case create, unchanged, update, conflict }
  public let name: String
  public let path: String
  public let data: Data
  public let previous: Data?
  public let status: Status
  public let sha256: String
}

public struct InstallPlan: Codable, Equatable, Sendable {
  public let root: String
  public let directory: String
  public let distribution: Distribution
  public let components: [String]
  public let frameworks: [String]
  public let instructions: [String]
  public let files: [FilePlan]
}

public struct Installer {
  private let replaceFile: (URL, URL) throws -> Void
  private let registry: HugsyRegistry?

  public init(
    registry: HugsyRegistry? = nil,
    replaceFile: @escaping (URL, URL) throws -> Void = Installer.renameFile
  ) {
    self.registry = registry
    self.replaceFile = replaceFile
  }

  public func initialize(
    cwd: String, directory: String, distribution: Distribution = .package, dryRun: Bool = false
  ) throws
    -> ProjectConfig
  {
    let root = try projectRoot(cwd)
    let config = try ProjectConfig(directory: directory, distribution: distribution)
    _ = try safeDirectory(root: root, directory: directory)
    let path = root.appendingPathComponent("hugsy.json")
    try assertRegular(path)
    guard try fileStat(path) == nil else {
      throw HugsyError("hugsy.json already exists. Edit its directory to change the destination.")
    }
    if !dryRun {
      try Data((jsonString(config) + "\n").utf8).write(to: path, options: .withoutOverwriting)
    }
    return config
  }

  public func configuration(cwd: String) throws -> ProjectConfig {
    let root = try projectRoot(cwd)
    let path = root.appendingPathComponent("hugsy.json")
    try assertRegular(path)
    guard try fileStat(path) != nil else { throw HugsyError("Run hugsy init first.") }
    return try JSONDecoder().decode(ProjectConfig.self, from: Data(contentsOf: path))
  }

  public func plan(cwd: String, names: [String]) throws -> InstallPlan {
    let root = try projectRoot(cwd)
    let config = try configuration(cwd: cwd)
    let directory = try safeDirectory(root: root, directory: config.directory)
    let registry = try registry ?? HugsyRegistry()
    let stateURL = directory.appendingPathComponent("hugsy.lock.json")
    try assertRegular(stateURL)
    let state =
      try fileStat(stateURL) == nil
      ? nil : JSONDecoder().decode(InstallState.self, from: Data(contentsOf: stateURL))
    guard state == nil || (state?.version == 1 && state?.distribution == config.distribution) else {
      throw HugsyError("Installed state does not match distribution. Use a new destination.")
    }
    let selected = Array(Set((state?.components ?? []) + names)).sorted()
    if selected.isEmpty {
      return InstallPlan(
        root: root.path, directory: config.directory, distribution: config.distribution,
        components: [], frameworks: [], instructions: PackageLayout.instructions(config), files: [])
    }
    let components = try registry.resolved(selected)
    let payloads = try PackageLayout.files(
      components: components, distribution: config.distribution)
    guard Set(state?.files.keys.map { $0 } ?? []).isSubset(of: Set(payloads.keys)) else {
      throw HugsyError(
        "Upstream files were removed. Reconcile installed files in a new destination; no files written."
      )
    }
    func filePlan(_ path: String, data: Data, stateFile: Bool = false) throws -> FilePlan {
      guard ComponentFile.isSafePath(path) else {
        throw HugsyError("Unsafe installation path: \(path)")
      }
      if let slash = path.lastIndex(of: "/") {
        _ = try safeDirectory(root: directory, directory: String(path[..<slash]))
      }
      let destination = directory.appendingPathComponent(path)
      try assertRegular(destination)
      var previous: Data?
      if try fileStat(destination) != nil {
        previous = try Data(contentsOf: destination)
      }
      let status: FilePlan.Status =
        previous.map {
          $0 == data
            ? .unchanged
            : (stateFile || state?.files[path] == HugsyRegistry.digest($0) ? .update : .conflict)
        } ?? .create
      return FilePlan(
        name: path, path: destination.path, data: data, previous: previous,
        status: status, sha256: HugsyRegistry.digest(data))
    }
    var files = try payloads.sorted { $0.key < $1.key }.map { try filePlan($0.key, data: $0.value) }
    let nextState = InstallState(
      distribution: config.distribution, components: selected,
      files: payloads.mapValues(HugsyRegistry.digest))
    files.append(
      try filePlan(
        "hugsy.lock.json", data: Data((jsonString(nextState) + "\n").utf8), stateFile: true))
    return InstallPlan(
      root: root.path, directory: config.directory, distribution: config.distribution,
      components: components.map(\.name),
      frameworks: Array(Set(components.flatMap(\.frameworks))).sorted(),
      instructions: PackageLayout.instructions(config), files: files)
  }

  @discardableResult public func install(
    cwd: String, names: [String], dryRun: Bool = false, force: Bool = false
  ) throws -> InstallPlan {
    guard !names.isEmpty else { throw HugsyError("Choose at least one component.") }
    let plan = try plan(cwd: cwd, names: names)
    if dryRun { return plan }
    guard force || !plan.files.contains(where: { $0.status == .conflict }) else {
      throw HugsyError(
        "Local changes found. No files written. Inspect hugsy diff before explicitly using --force."
      )
    }
    let root = URL(fileURLWithPath: plan.root)
    let lock = root.appendingPathComponent(".hugsy-install.lock")
    let descriptor = open(lock.path, O_WRONLY | O_CREAT | O_EXCL, S_IRUSR | S_IWUSR)
    guard descriptor >= 0 else {
      throw HugsyError(
        "Cannot acquire installation lock. Check for another installer or a stale lock.")
    }
    defer {
      close(descriptor)
      unlink(lock.path)
    }
    let staging = root.appendingPathComponent(".hugsy-stage-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: staging, withIntermediateDirectories: false)
    defer { try? FileManager.default.removeItem(at: staging) }
    guard try self.plan(cwd: cwd, names: names) == plan else {
      throw HugsyError("Files changed during installation. Retry.")
    }
    _ = try safeDirectory(root: root, directory: plan.directory, create: true)
    var written: [FilePlan] = []
    do {
      for (index, file) in plan.files.enumerated() where file.status != .unchanged {
        let temporary = staging.appendingPathComponent(String(index))
        try file.data.write(to: temporary, options: .withoutOverwriting)
        let destination = URL(fileURLWithPath: file.path)
        let relativeParent = String(
          destination.deletingLastPathComponent().path.dropFirst(root.path.count + 1))
        _ = try safeDirectory(root: root, directory: relativeParent, create: true)
        try assertRegular(destination)
        try replaceFile(temporary, destination)
        written.append(file)
      }
    } catch {
      for file in written.reversed() {
        let destination = URL(fileURLWithPath: file.path)
        if let previous = file.previous {
          try previous.write(to: destination, options: .atomic)
        } else {
          try FileManager.default.removeItem(at: destination)
        }
      }
      throw error
    }
    return plan
  }

  public static func renameFile(_ source: URL, _ destination: URL) throws {
    guard rename(source.path, destination.path) == 0 else {
      throw HugsyError("Could not write component file: \(destination.lastPathComponent)")
    }
  }

  private func projectRoot(_ path: String) throws -> URL {
    let root = URL(fileURLWithPath: path).standardizedFileURL.resolvingSymlinksInPath()
    guard let info = try fileStat(root), info.st_mode & S_IFMT == S_IFDIR else {
      throw HugsyError("Project directory does not exist.")
    }
    return root
  }

  private func safeDirectory(root: URL, directory: String, create: Bool = false) throws -> URL {
    guard ComponentFile.isSafePath(directory) else {
      throw HugsyError("Unsafe directory: \(directory)")
    }
    var path = root
    for segment in directory.split(separator: "/") {
      path.appendPathComponent(String(segment))
      if try fileStat(path) == nil, create {
        try FileManager.default.createDirectory(at: path, withIntermediateDirectories: false)
      }
      if let info = try fileStat(path), info.st_mode & S_IFMT != S_IFDIR {
        throw HugsyError("Unsafe destination directory: \(path.lastPathComponent)")
      }
    }
    return path
  }

  private func assertRegular(_ path: URL) throws {
    if let info = try fileStat(path), info.st_mode & S_IFMT != S_IFREG || info.st_nlink != 1 {
      throw HugsyError("Refusing non-regular or linked file: \(path.lastPathComponent)")
    }
  }

  private func fileStat(_ url: URL) throws -> stat? {
    var info = stat()
    if lstat(url.path, &info) == 0 { return info }
    if errno == ENOENT { return nil }
    throw HugsyError("Cannot inspect path: \(url.lastPathComponent)")
  }
}
