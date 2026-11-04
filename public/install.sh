#!/bin/sh
set -eu
if ! command -v swift >/dev/null 2>&1; then
  printf '%s\n' 'Install Xcode with Swift 6 before installing Hugsy.' >&2
  exit 1
fi
revision=cae1ed3aadc27539a4a6740c96be162cf47006b8
checksum=32274aa451a1788d0609eb763a0988aa8aa1276ec9fa80b80bee188415b5f381
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT HUP INT TERM
archive="$temporary/source.tar.gz"
curl --proto '=https' --tlsv1.2 -fsSL "https://codeload.github.com/pulkitxm/hugsy/tar.gz/$revision" -o "$archive"
printf '%s  %s\n' "$checksum" "$archive" | shasum -a 256 -c -
mkdir "$temporary/source"
tar -xzf "$archive" -C "$temporary/source" --strip-components=1
swift build --package-path "$temporary/source" -c release --product hugsy
binary_directory=$(swift build --package-path "$temporary/source" -c release --show-bin-path)
destination="${HUGSY_INSTALL_DIR:-$HOME/.local/bin}"
mkdir -p "$destination"
install -m 755 "$binary_directory/hugsy" "$destination/hugsy"
printf '\n%s\n%s\n' "Installed $destination/hugsy" 'Add this directory to PATH, then run hugsy --help.'
