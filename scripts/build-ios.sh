#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
host_sdk=$(xcrun --sdk macosx --show-sdk-path)
SDKROOT=$(xcrun --sdk iphonesimulator --show-sdk-path)
export SDKROOT
mkdir -p .build/ios/HugsyGallery.app .build/preview
xcrun --sdk macosx swiftc -parse-as-library -swift-version 6 -warnings-as-errors \
  -sdk "${host_sdk}" \
  tools/Models/*.swift tools/RegistryCompiler/RegistryCompiler.swift -o .build/preview/RegistryCompiler
.build/preview/RegistryCompiler registry .build/preview/EmbeddedRegistry.swift
cp examples/Info.plist .build/ios/HugsyGallery.app/Info.plist
architecture=$(uname -m)
xcrun --sdk iphonesimulator swiftc -parse-as-library -swift-version 6 -warnings-as-errors \
  -target "${architecture}-apple-ios17.0-simulator" -sdk "${SDKROOT}" \
  registry/swift/*.swift tools/Models/*.swift tools/PreviewKit/*.swift \
  .build/preview/EmbeddedRegistry.swift examples/*.swift examples/PreviewScenes/*.swift \
  -o .build/ios/HugsyGallery.app/HugsyGallery
codesign --force --sign - .build/ios/HugsyGallery.app
