# WhisperKit Setup Guide

This guide explains how to add WhisperKit to the iOS project for real speech recognition.

## Automatic Setup (Recommended)

The project includes an Expo config plugin that should automatically add WhisperKit when you rebuild:

```bash
# Clean and rebuild iOS project
npx expo prebuild --clean
npx expo run:ios
```

## Manual Setup (If Automatic Fails)

If the automatic setup doesn't work, follow these steps:

### 1. Open Xcode Project

```bash
open ios/Cebu.xcworkspace
```

### 2. Add WhisperKit Swift Package

1. In Xcode, select the **Cebu** project in the navigator
2. Select the **Cebu** target
3. Go to the **Package Dependencies** tab
4. Click the **+** button
5. Enter the WhisperKit repository URL:
   ```
   https://github.com/argmaxinc/WhisperKit.git
   ```
6. Select **Up to Next Major Version** and enter `0.7.0`
7. Click **Add Package**
8. Select **WhisperKit** in the list and click **Add Package**

### 3. Verify Installation

1. Build the project in Xcode (⌘B)
2. Check for any errors
3. If successful, the WhisperKit module will be available

### 4. Download Whisper Model

The first time you run the app, it will download the Whisper model (~100MB for `base` model).
This happens automatically when initializing WhisperKit.

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

To use a different model, modify the initialization in `useWhisperKit.ts`:

```typescript
const { isInitialized } = useWhisperKit('small.en'); // Use small.en instead of base
```

## Troubleshooting

### Build Errors

If you get build errors:
1. Clean build folder: Product > Clean Build Folder (⌘⇧K)
2. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
3. Rebuild the project

### Model Download Failures

If model download fails:
- Check internet connection
- Try a smaller model first (tiny or base)
- The model will be cached after first successful download

### Performance Issues

- Use smaller models on older devices
- `tiny` and `base` models run well on most devices
- `medium` and `large` models require iPhone 12 or newer
