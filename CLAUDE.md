# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cebu is a voice-first daily journal app built with pure iOS native (Swift + SwiftUI) and WhisperKit for on-device speech recognition. The app features offline transcription, daily auto-organization, and a Liquid Glass UI design system. It's optimized for Chinese language speech recognition.

## Build and Run

```bash
# Generate Xcode project from project.yml (required after any project.yml changes)
cd CebuNative
xcodegen generate

# Open project
open Cebu.xcodeproj

# Build and run on real iOS device (iOS 16.0+)
# Note: Requires physical device due to WhisperKit requirements
```

**Important:** This project uses `xcodegen` to generate the Xcode project from `project.yml`. Always regenerate the project after modifying `project.yml`.

## Core Architecture

### MVVM Architecture with SwiftUI
- **Models**: Core Data entities (User, JournalEntry, TranscriptionBlock)
- **ViewModels**: Handle business logic and state (JournalListViewModel, RecordingViewModel)
- **Views**: SwiftUI views that observe ViewModels
- **Services**: Singleton services injected via `@EnvironmentObject`

### Dependency Injection Pattern
The app uses SwiftUI's environment system for dependency injection. Key services are initialized in `CebuApp.swift` and injected as `@EnvironmentObject`:

- `LocalAuthService` - Local device-based authentication
- `ThemeManager` - App-wide theme control (3-mode: light/dark/system)
- `ModelManager` - WhisperKit model selection
- `BiometricAuthService` - Face ID/Touch ID app lock
- `CloudSyncService` - iCloud synchronization (disabled in development)
- `WhisperKitService` - Speech-to-text transcription

### Data Layer

**Core Data Stack:**
- Models defined in `Cebu.xcdatamodeld`
- `PersistenceController.shared` provides the main `NSPersistentCloudKitContainer`
- Repository pattern: `JournalRepository`, `UserRepository` abstract Core Data operations
- CloudKit sync is **disabled by default** (requires paid Apple Developer account)

**Entity Hierarchy:**
```
User (1) → (*) JournalEntry (1) → (*) TranscriptionBlock
```

**Key entities:**
- `User`: Local user (no Apple Sign In required)
- `JournalEntry`: Daily entry (auto-created for each day)
- `TranscriptionBlock`: Individual voice note transcription with position ordering

### WhisperKit Integration

**Model Selection:**
- Default model: `openai_whisper-large-v3_turbo` (1.6GB, optimized for speed)
- Model download happens on first launch with retry logic (3 attempts)
- Models stored in device cache directory
- Language forced to Chinese (`zh`) in transcription

**Workflow:**
1. App initialization downloads/loads selected model
2. User taps record button → starts audio capture
3. Audio buffered as float32 PCM at 16kHz sample rate
4. User stops recording → full audio buffer sent to WhisperKit for transcription
5. Final transcription saved to Core Data as TranscriptionBlock

**Implementation details:**
- No real-time transcription (transcription happens once after recording stops)
- Audio engine runs on background thread, converted to WhisperKit format
- Service is `@MainActor` to ensure UI updates on main thread

### Theme System

**Three-mode theme system:**
- Light mode
- Dark mode
- System (follows device settings)

**Liquid Glass Design System:**
- Glassmorphism effects via `LiquidGlassStyle.swift`
- View modifiers: `.liquidGlassCard()`, `.liquidGlassBackground()`, `.pulsingGlow()`
- Custom environment key: `\.themeColors` for theme-aware colors
- Material-based backgrounds (`.ultraThinMaterial`, `.thinMaterial`, `.regularMaterial`)

### Authentication & Security

**Local Authentication:**
- `LocalAuthService` handles device-based authentication (no Apple Sign In)
- Auto-creates local user on first launch
- Biometric lock via `BiometricAuthService` (Face ID/Touch ID)
- Lock triggers on app backgrounding, unlocks on foreground

**Keychain Integration:**
- `KeychainService` for secure credential storage
- Used for biometric authentication state persistence

## Code Conventions

### File Header Comments
Every Swift file contains a 3-line header comment documenting:
```swift
/**
 * Input: Dependencies/imports
 * Output: Exports/public API
 * Pos: Role within the system
 * If this file is updated, you must update this header and the parent folder's README.md.
 */
```

### README.md Files
Every directory contains a `README.md` with:
- Header: "Once the contents of this folder change, update this document."
- Architecture overview (≤3 lines)
- File registry table (Name | Status | Core Function)

## Common Modifications

### Adding a New WhisperKit Model
1. Update `WhisperModel.swift` enum with new model name
2. Update `ModelManager.swift` if changing default
3. Ensure model name matches WhisperKit's expected format (e.g., `openai_whisper-*`)

### Modifying Core Data Schema
1. Update `Cebu.xcdatamodeld/Cebu.xcdatamodel/contents`
2. Update corresponding Swift model file (e.g., `JournalEntry.swift`)
3. Create migration if needed for production data
4. Update repository methods if entity structure changes

### Adding New Services
1. Create service in `Core/Services/`
2. Initialize as `@StateObject` in `CebuApp.swift`
3. Inject via `.environmentObject()` in `CebuApp.body`
4. Access in views via `@EnvironmentObject`

### Working with Liquid Glass UI
1. Use `.liquidGlassCard()` for card-style components
2. Use `.liquidGlassBackground()` for screen backgrounds
3. Access theme colors via `@Environment(\.themeColors) var colors`
4. Test both light and dark modes using SwiftUI previews

## CloudKit Setup (Optional)

CloudKit sync is **disabled** in development builds. To enable:

1. Uncomment CloudKit configuration in `PersistenceController.swift`
2. Add entitlements file (`Cebu.entitlements`) with iCloud capabilities
3. Enable CloudKit in project settings
4. Requires paid Apple Developer account ($99/year)

## Project Structure Notes

- `project.yml` is the source of truth for Xcode project configuration
- Uses WhisperKit package dependency (v0.7.0+)
- Minimum deployment target: iOS 16.0
- iPhone only (no iPad or Mac Catalyst support)
- Development language: English (but UI strings support Chinese)

## Microphone Permissions

The app requires microphone and speech recognition permissions:
- `NSMicrophoneUsageDescription`: "Cebu needs access to your microphone to record voice notes."
- `NSSpeechRecognitionUsageDescription`: "Cebu uses on-device speech recognition to transcribe your voice notes."
- `NSFaceIDUsageDescription`: "Cebu 使用 Face ID 保护您的日记隐私"

These are defined in `project.yml` under `info.properties`.
