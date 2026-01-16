# Cebu Expo - Voice Journal App

Voice-first daily journal app built with React Native (Expo) featuring on-device speech recognition using SenseVoice ONNX models.

## Features

- 🎙️ Voice recording with on-device transcription
- 📱 Native iOS and Android support
- 🧠 SenseVoice-Small ONNX model (~150MB) bundled in app
- 🔒 Offline-first with local data storage
- 🎨 Liquid Glass UI design system
- 🌐 Chinese language optimization

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- iOS: macOS with Xcode 14+
- Android: Android Studio with SDK 33+
- Expo CLI (installed automatically)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create test model files (or add real models to assets/models/)
npm run setup:test-models

# 3. Verify setup
npm run verify

# 4. Generate native projects (bundles models automatically)
npm run prebuild

# 5. Run app
npm run ios     # iOS
npm run android # Android
```

## Model Setup

### Using Test Models (Development)

```bash
# Creates 10MB placeholder files for testing
npm run setup:test-models
```

### Using Real Models (Production)

Download SenseVoice-Small ONNX model files and place in `assets/models/`:

```
assets/models/
├── model.onnx      # ~150 MB - Main ONNX model
├── tokens.txt      # ~50 KB  - Tokenizer vocabulary
└── config.json     # ~2 KB   - Model configuration
```

Then run:
```bash
npm run prebuild
```

## Project Structure

```
cebu-expo/
├── assets/
│   └── models/              # ONNX model files (bundled into app)
├── plugins/
│   ├── withSenseVoiceModels.ts  # Expo config plugin for bundling models
│   ├── example-usage.md         # Native module examples
│   └── README.md                # Plugin documentation
├── scripts/
│   ├── create-test-models.sh    # Create test model files
│   ├── verify-setup.sh          # Validate plugin setup
│   └── README.md                # Scripts documentation
├── src/                     # React Native source code
├── app.json                 # Expo configuration (includes plugin)
├── metro.config.js          # Metro bundler config (handles ONNX files)
└── package.json
```

## Available Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator/device
npm run android        # Run on Android emulator/device

# Build
npm run prebuild       # Generate native projects with bundled models
npm run prebuild:clean # Clean regenerate native projects

# Utilities
npm run verify         # Check plugin setup and model files
npm run setup:test-models  # Create test model files
```

## SenseVoice Models Plugin

This project includes a custom Expo Config Plugin that automatically bundles ONNX model files into iOS and Android apps during the prebuild process.

### How It Works

1. **Source**: Model files in `assets/models/`
2. **iOS**: Copies to `ios/[ProjectName]/Resources/models/` and adds to Xcode project
3. **Android**: Copies to `android/app/src/main/assets/models/`
4. **Access**: Models available via Bundle.main (iOS) or AssetManager (Android)

### Configuration

The plugin is configured in `app.json`:

```json
{
  "expo": {
    "plugins": [
      "./plugins/withSenseVoiceModels"
    ]
  }
}
```

### Metro Bundler

`metro.config.js` is configured to:
- Treat `.onnx` files as static assets (not JavaScript)
- Prevent bundling large model files
- Handle asset registry efficiently

### Documentation

- **Plugin Details**: See [plugins/README.md](./plugins/README.md)
- **Usage Examples**: See [plugins/example-usage.md](./plugins/example-usage.md)
- **Setup Guide**: See [SETUP_MODELS.md](./SETUP_MODELS.md)
- **Scripts**: See [scripts/README.md](./scripts/README.md)

## Verification

Verify your setup at any time:

```bash
npm run verify
```

This checks:
- ✓ Plugin file exists
- ✓ Metro config exists
- ✓ Plugin registered in app.json
- ✓ Dependencies installed
- ✓ Model files present
- ✓ Models bundled in iOS/Android projects

## Model File Sizes

| File | Size | Purpose |
|------|------|---------|
| `model.onnx` | ~150 MB | SenseVoice-Small ONNX model |
| `tokens.txt` | ~50 KB | Tokenizer vocabulary |
| `config.json` | ~2 KB | Model configuration |
| **Total** | **~150 MB** | Added to app bundle |

## Troubleshooting

### Models not found

```bash
# Verify models exist
ls -lh assets/models/

# Regenerate native projects
npm run prebuild:clean

# Verify models bundled
npm run verify
```

### Plugin not running

```bash
# Verify plugin is registered
cat app.json | grep withSenseVoiceModels

# Install dependencies
npm install

# Regenerate
npm run prebuild:clean
```

### Build errors

```bash
# Clean everything and start fresh
rm -rf node_modules ios android
npm install
npm run prebuild
```

### Git LFS for Large Files

If committing large model files to git:

```bash
# Install Git LFS
git lfs install

# Track ONNX files
git lfs track "assets/models/*.onnx"

# Commit
git add .gitattributes
git commit -m "Track ONNX models with Git LFS"
```

Or exclude from git:
```bash
# .gitignore
assets/models/*.onnx
```

## Development

### Adding/Changing Models

1. Update model files in `assets/models/`
2. Run `npm run prebuild:clean` to regenerate native projects
3. Run `npm run verify` to confirm bundling
4. Test in app to ensure models load correctly

### Modifying Plugin

Edit `plugins/withSenseVoiceModels.ts` to:
- Add/remove model files
- Change source/destination directories
- Customize validation logic

After changes:
```bash
npm run prebuild:clean
npm run verify
```

## CI/CD

Example GitHub Actions workflow:

```yaml
name: Build

on: [push]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
        with:
          lfs: true  # Download Git LFS files

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install
        run: npm install

      - name: Setup test models
        run: npm run setup:test-models

      - name: Verify setup
        run: npm run verify

      - name: Build
        run: npm run prebuild
```

## Architecture

### Tech Stack

- **Framework**: Expo SDK 54 / React Native 0.81
- **Language**: TypeScript 5.9
- **State Management**: Zustand
- **Data Layer**: WatermelonDB
- **UI**: React Native, Moti (animations)
- **Audio**: Expo AV
- **ML**: ONNX Runtime (planned)

### MVVM Pattern

- **Models**: WatermelonDB entities
- **ViewModels**: Zustand stores
- **Views**: React Native components
- **Services**: Native modules for ML inference

## Performance

- **Build Time**: Plugin adds ~5-10 seconds to prebuild
- **App Size**: +150 MB (models are compressed in release builds)
- **First Launch**: Models ready immediately (no download)
- **Runtime**: On-device inference (no network required)

## Alternatives to Bundling

If 150 MB app size is too large:

1. **Download on First Launch**: Store models on CDN, download to cache
2. **Over-the-Air Updates**: Use Expo Updates with custom asset loader
3. **Model Quantization**: Reduce ONNX model size by 50-75%
4. **Smaller Model**: Use SenseVoice-Tiny instead

See [plugins/README.md](./plugins/README.md) for details.

## Resources

- [Expo Config Plugins](https://docs.expo.dev/guides/config-plugins/)
- [Metro Bundler](https://docs.expo.dev/guides/customizing-metro/)
- [ONNX Runtime Mobile](https://onnxruntime.ai/docs/tutorials/mobile/)
- [SenseVoice Models](https://github.com/FunAudioLLM/SenseVoice)

## License

[Your License]

## Support

For issues with the models plugin:
1. Run `npm run verify` to check setup
2. Check [plugins/README.md](./plugins/README.md) troubleshooting section
3. Review [SETUP_MODELS.md](./SETUP_MODELS.md) for detailed instructions
