import Darwin
import Foundation

public struct ProjectConfig: Codable, Equatable, Sendable {
  public let version: Int
  public let directory: String

  public init(directory: String) throws {
    guard directory.count <= 240,
      directory.range(of: "^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*$", options: .regularExpression) != nil
    else {
      throw HugsyError("Use a project-relative directory without spaces, traversal, or symlinks.")
    }
    version = 1
    self.directory = directory
  }

  private struct Key: CodingKey {
    let stringValue: String
    let intValue: Int? = nil
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { return nil }
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: Key.self)
    guard Set(container.allKeys.map(\.stringValue)) == ["version", "directory"],
      let versionKey = Key(stringValue: "version"),
      let directoryKey = Key(stringValue: "directory"),
      try container.decode(Int.self, forKey: versionKey) == 1
    else {
      throw HugsyError("Unsupported configuration. Expected version and directory only.")
    }
    try self.init(directory: container.decode(String.self, forKey: directoryKey))
  }
}

public struct FilePlan: Codable, Equatable, Sendable {
  public enum Status: String, Codable, Sendable { case create, unchanged, conflict }
  public let name: String
  public let path: String
  public let source: String
  public let previous: String?
  public let status: Status
  public let sha256: String
}

public struct InstallPlan: Codable, Equatable, Sendable {
  public let root: String
  public let directory: String
  public let files: [FilePlan]
}

public struct Installer {
  private let replaceFile: (URL, URL) throws -> Void

  public init(replaceFile: @escaping (URL, URL) throws -> Void = Installer.renameFile) {
    self.replaceFile = replaceFile
  }

  public func initialize(cwd: String, directory: String, dryRun: Bool = false) throws
    -> ProjectConfig
  {
    let root = try projectRoot(cwd)
    let config = try ProjectConfig(directory: directory)
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

  public func plan(cwd: String, names: [String]) throws -> InstallPlan {
    guard !names.isEmpty else { throw HugsyError("Choose at least one component.") }
    let root = try projectRoot(cwd)
    let configURL = root.appendingPathComponent("hugsy.json")
    try assertRegular(configURL)
    guard try fileStat(configURL) != nil else { throw HugsyError("Run hugsy init first.") }
    let config = try JSONDecoder().decode(ProjectConfig.self, from: Data(contentsOf: configURL))
    let directory = try safeDirectory(root: root, directory: config.directory)
    let registry = try HugsyRegistry()
    var seen = Set<String>()
    let files = try names.filter { seen.insert($0).inserted }.map { name in
      let component = try registry.component(name)
      let destination = directory.appendingPathComponent(component.filename)
      try assertRegular(destination)
      var previous: String?
      if try fileStat(destination) != nil {
        previous = try String(contentsOf: destination, encoding: .utf8)
      }
      let status: FilePlan.Status =
        previous.map { $0 == component.source ? .unchanged : .conflict } ?? .create
      return FilePlan(
        name: name, path: destination.path, source: component.source, previous: previous,
        status: status, sha256: component.sha256)
    }
    return InstallPlan(root: root.path, directory: config.directory, files: files)
  }

  @discardableResult public func install(
    cwd: String, names: [String], dryRun: Bool = false, force: Bool = false
  ) throws -> InstallPlan {
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
        try Data(file.source.utf8).write(to: temporary, options: .withoutOverwriting)
        let destination = URL(fileURLWithPath: file.path)
        try assertRegular(destination)
        try replaceFile(temporary, destination)
        written.append(file)
      }
    } catch {
      for file in written.reversed() {
        let destination = URL(fileURLWithPath: file.path)
        if let previous = file.previous {
          try Data(previous.utf8).write(to: destination, options: .atomic)
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
    _ = try ProjectConfig(directory: directory)
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
