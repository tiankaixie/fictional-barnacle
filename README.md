# Cebu - Voice Note App

Once the contents of this folder change, update this document.

## Architecture

A voice-first daily journal app built with pure iOS native (Swift + SwiftUI) and WhisperKit for on-device speech recognition. Features offline transcription, daily auto-organization, and Liquid Glass UI design.

## Project Structure

| File/Directory | Status | Core Function |
|----------------|--------|---------------|
| `CebuNative/` | Core | Pure iOS native app (Swift + SwiftUI) |
| `CebuNative/Cebu/` | Core | Main source code directory |
| `CebuNative/Cebu/App/` | Core | App entry point and main views |
| `CebuNative/Cebu/Core/` | Core | Data layer (Core Data, repositories, services) |
| `CebuNative/Cebu/Features/` | Core | Feature modules (Journal, Recording, Auth) |
| `CebuNative/Cebu/UI/` | Core | Reusable UI components and theme |
| `CebuNative/project.yml` | Core | xcodegen project configuration |

## Quick Start

```bash
cd CebuNative
xcodegen generate
open Cebu.xcodeproj
# Build and run on real iOS device (iOS 16.0+)
```

## Key Features

- **Voice Recording**: Tap to record, transcription after recording stops
- **Daily Organization**: Auto-creates daily entries, groups transcriptions by day
- **Edit Mode**: Long-press to edit transcriptions, preserves original text
- **Liquid Glass UI**: Frosted glass aesthetic with dark/light mode support
- **Offline-First**: Core Data local storage, privacy-focused
- **Chinese Language**: Optimized for Chinese speech recognition (small model, 500MB)

## Tech Stack

- **Platform**: iOS 16.0+ (pure native, no Expo/React Native)
- **UI Framework**: SwiftUI with MVVM architecture
- **Speech Recognition**: WhisperKit (on-device, small multilingual model)
- **Data Layer**: Core Data (local storage only)
- **Authentication**: Local authentication (device-based)
- **Project Management**: xcodegen (project.yml)
