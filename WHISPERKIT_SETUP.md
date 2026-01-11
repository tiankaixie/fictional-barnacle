# WhisperKit Setup Guide

This guide explains how WhisperKit is integrated in the iOS native project.

## Setup

WhisperKit is automatically configured via xcodegen in `CebuNative/project.yml`:

```bash
cd CebuNative
xcodegen generate
open Cebu.xcodeproj
```

The Swift Package dependency is defined in `project.yml`:
```yaml
packages:
  WhisperKit:
    url: https://github.com/argmaxinc/WhisperKit
    from: 0.7.0
```

## First Run

The first time you run the app, it will automatically download the Whisper model:
- **Default model**: `small` (~500MB)
- **Download location**: User's cache directory
- **Auto-retry**: 3 attempts with cache cleanup on failure

The app shows a loading overlay during download with the current attempt number.

## Available Models

- `tiny` - ~40MB, fastest, lowest accuracy
- `tiny.en` - English-only tiny model
- `base` - ~140MB, good balance (default)
- `base.en` - English-only base model
- `small` - ~480MB, better accuracy
- `small.en` - English-only small model
- `medium` - ~1.5GB, high accuracy
- `medium.en` - English-only medium model
- `large-v3` - ~3GB, highest accuracy

## Changing Model

To use a different model, modify the initialization in `RecordingViewModel.swift`:

```swift
// In initialize() method
try await whisperService.initialize(modelName: "medium") // Change from "small"
```

## Implementation Details

The WhisperKit integration is in `Cebu/Core/Services/WhisperKitService.swift`:
- **Audio format**: 16kHz mono, PCM Float32
- **Transcription**: Single batch processing after recording stops
- **Language**: Forced to Chinese ("zh") via DecodingOptions
- **Progress**: Indeterminate during download/transcription

## Troubleshooting

### Build Errors

If you get build errors:
1. Regenerate Xcode project:
   ```bash
   cd CebuNative
   xcodegen generate
   ```
2. Clean build folder: Product > Clean Build Folder (⌘⇧K)
3. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
4. Rebuild the project

### Model Download Failures

The app includes automatic retry logic:
- Retries up to 3 times
- Clears cache between retries
- Shows attempt number in UI

If all retries fail:
- Check internet connection
- Manually clear cache:
  ```bash
  rm -rf ~/Library/Caches/huggingface
  rm -rf ~/Library/Caches/whisperkit
  ```
- Restart the app

### Performance Issues

- Current model (`small`, 500MB) works well on most devices
- For older devices, consider `tiny` or `base`
- `medium` and `large` models require iPhone 12 or newer
- Real-time transcription is disabled to improve performance
