#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
SDKROOT=$(xcrun --sdk iphonesimulator --show-sdk-path)
export SDKROOT
mkdir -p .build/ios/HugsyGallery.app
cp examples/Info.plist .build/ios/HugsyGallery.app/Info.plist
xcrun --sdk iphonesimulator swiftc -parse-as-library -swift-version 6 -warnings-as-errors \
  -target "$(uname -m)-apple-ios17.0-simulator" -sdk "$SDKROOT" \
  registry/swift/*.swift examples/Gallery.swift -o .build/ios/HugsyGallery.app/HugsyGallery
codesign --force --sign - .build/ios/HugsyGallery.app
