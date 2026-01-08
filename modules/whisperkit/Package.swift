// swift-tools-version:5.9

import PackageDescription

let package = Package(
    name: "WhisperKit",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "WhisperKit",
            targets: ["WhisperKitModule"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/expo/expo.git", branch: "main"),
        .package(url: "https://github.com/argmaxinc/WhisperKit.git", from: "0.9.0")
    ],
    targets: [
        .target(
            name: "WhisperKitModule",
            dependencies: [
                .product(name: "ExpoModulesCore", package: "expo"),
                .product(name: "WhisperKit", package: "WhisperKit")
            ],
            path: "ios"
        )
    ]
)
