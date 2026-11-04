#!/bin/sh
set -eu
if ! command -v swift >/dev/null 2>&1; then
  printf '%s\n' 'Install Xcode with Swift 6 before installing Hugsy.' >&2
  exit 1
fi
revision=34318b23343622b6d47696cba4e31bb047942171
checksum=23af9170b0dca1c3c06362921fdf596c1de3355f601f7bd4cf6be5f97d52c1b8
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
