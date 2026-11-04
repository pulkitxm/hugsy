# Security

Report vulnerabilities privately through [GitHub security advisories](https://github.com/pulkitxm/hugsy/security/advisories/new). Do not include credentials or private project content in public issues.

## Trust model

The registry is bundled with the CLI. Adding a component does not fetch or execute remote scripts. Source checksums detect corruption, not a malicious publisher. Review copied source before adoption, and install packages only from the official repository or Pages domain.

The installer validates project-relative destinations, rejects traversal, symlinks, and hard-linked files, locks cooperative installations, preflights the entire batch, and rolls back written files after a handled write failure. Customized files require explicit `--force`. It never edits Xcode project files.

The installer assumes a trusted local project directory. It is not a sandbox against another process maliciously replacing directory ancestors during installation. Process termination or disk failure can interrupt a multi-file batch. Review the project after an interrupted install and remove a stale `.hugsy-install.lock` only after confirming no installer is running.

MCP is local and read-only. It does not accept remote registry URLs, launch shell commands, inspect project files, or perform installation. Standard output contains protocol messages only.

The website is static and has no authentication, database, telemetry, or runtime secrets. Do not commit secrets to this repository or put them into documentation examples.

## Supported versions

Only the latest release is supported. Components target iOS 17+ and Swift 6. The native CLI requires macOS 14+ and Swift 6 to build. The TypeScript website has separate development tooling and does not add runtime requirements to your app. GitHub Pages cannot set arbitrary HTTP security headers; do not treat this static site as an application security boundary.
