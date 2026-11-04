#!/bin/sh
set -eu
if ! command -v swift >/dev/null 2>&1; then
  printf '%s\n' 'Install Xcode with Swift 6 before installing Hugsy.' >&2
  exit 1
fi
revision=aa87a8b5cb19539abcf626942cc35c86d701f8f6
checksum=f37517243c4b08251dc145640d10c3873bf69b99848e73b5ce69b97559d0b84d
temporary=$(mktemp -d)
trap 'rm -rf "${temporary}"' EXIT HUP INT TERM
archive="${temporary}/source.tar.gz"
curl --proto '=https' --tlsv1.2 -fsSL "https://codeload.github.com/pulkitxm/hugsy/tar.gz/${revision}" -o "${archive}"
printf '%s  %s\n' "${checksum}" "${archive}" | shasum -a 256 -c -
mkdir "${temporary}/source"
tar -xzf "${archive}" -C "${temporary}/source" --strip-components=1
swift build --package-path "${temporary}/source" -c release --product hugsy
binary_directory=$(swift build --package-path "${temporary}/source" -c release --show-bin-path)
destination="${HUGSY_INSTALL_DIR:-${HOME}/.local/bin}"
mkdir -p "${destination}"
install -m 755 "${binary_directory}/hugsy" "${destination}/hugsy"
printf '\n%s\n%s\n' "Installed ${destination}/hugsy" 'Add this directory to PATH, then run hugsy --help.'
