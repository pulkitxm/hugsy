#!/bin/sh
set -eu
if ! command -v swift >/dev/null 2>&1; then
  printf '%s\n' 'Install Xcode with Swift 6 before installing Hugsy.' >&2
  exit 1
fi
revision=f2cc07582e5a5fa8eaf4ce000927dd871bf28fea
checksum=7dc957a645cbdf5a260be9b9781b20185f55de6f24fd176fa50f72927fbfe498
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
