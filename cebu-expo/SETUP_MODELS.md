# SenseVoice Models Setup Guide

This guide explains how to set up ONNX model files for the Cebu Expo app.

## Quick Start

### 1. Install Dependencies

```bash
# Install required dev dependencies
npm install

# This will install @expo/config-plugins needed for the plugin
```

### 2. Download Model Files

Place your SenseVoice-Small ONNX model files in `assets/models/`:

```bash
# Create models directory
mkdir -p assets/models

# Download or copy your model files here:
# - model.onnx (~150 MB)
# - tokens.txt (~50 KB)
# - config.json (~2 KB)
```

**Expected structure:**
```
cebu-expo/
├── assets/
│   └── models/
│       ├── model.onnx      # Main ONNX model
│       ├── tokens.txt      # Tokenizer vocabulary
│       └── config.json     # Model configuration
├── plugins/
│   └── withSenseVoiceModels.ts
└── app.json
```

### 3. Verify Files

```bash
# Check files exist and sizes are correct
ls -lh assets/models/

# Should output something like:
# -rw-r--r--  1 user  staff   150M Jan 15 12:00 model.onnx
# -rw-r--r--  1 user  staff    50K Jan 15 12:00 tokens.txt
# -rw-r--r--  1 user  staff   2.0K Jan 15 12:00 config.json
```

### 4. Generate Native Projects

```bash
# Generate iOS and Android projects with bundled models
npx expo prebuild

# You should see output like:
# 🎙️  SenseVoice Models Plugin
# ================================
# 📱 Configuring iOS model files...
#   ↳ Copied model.onnx (150.00 MB)
#   ↳ Copied tokens.txt (0.05 MB)
#   ↳ Copied config.json (0.00 MB)
# ✓ Copied 3 file(s) to ios
#
# 🤖 Configuring Android model files...
#   ↳ Copied model.onnx (150.00 MB)
#   ↳ Copied tokens.txt (0.05 MB)
#   ↳ Copied config.json (0.00 MB)
# ✓ Copied 3 file(s) to android
#
# ✅ SenseVoice models plugin configured successfully
```

### 5. Verify Models in Native Projects

**iOS:**
```bash
# Check iOS bundle contains models
ls -la ios/*/Resources/models/

# Or open in Xcode and check Resources/models folder
open ios/*.xcodeproj
```

**Android:**
```bash
# Check Android assets contains models
ls -la android/app/src/main/assets/models/
```

### 6. Build and Run

```bash
# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Troubleshooting

### Problem: "Missing model file" error during prebuild

**Cause:** Model files not found in `assets/models/`

**Solution:**
```bash
# Check files exist
ls -la assets/models/

# Ensure you have all required files:
# - model.onnx (required)
# - tokens.txt (required)
# - config.json (required)
```

### Problem: Plugin not running

**Cause:** `@expo/config-plugins` not installed or plugin not registered

**Solution:**
```bash
# Install dependencies
npm install

# Verify plugin is in app.json
cat app.json | jq '.expo.plugins'
# Should include: "./plugins/withSenseVoiceModels"

# Clean and regenerate
npx expo prebuild --clean
```

### Problem: Models not found at runtime

**Cause:** Models not properly bundled in native project

**Solution:**

**For iOS:**
```bash
# Regenerate Xcode project
rm -rf ios
npx expo prebuild

# Open Xcode and verify
open ios/*.xcodeproj
# Navigate to: Project > Build Phases > Copy Bundle Resources
# Verify models are listed
```

**For Android:**
```bash
# Regenerate Android project
rm -rf android
npx expo prebuild

# Verify files exist in assets
ls -la android/app/src/main/assets/models/
```

### Problem: Build fails with "file too large"

**Cause:** Git or CI system rejecting large files

**Solution:**

**Option 1: Use Git LFS**
```bash
# Install Git LFS
git lfs install

# Track ONNX files
git lfs track "assets/models/*.onnx"

# Commit .gitattributes
git add .gitattributes
git commit -m "Track ONNX models with Git LFS"

# Add models
git add assets/models/
git commit -m "Add ONNX models"
```

**Option 2: Exclude from Git**
```bash
# Add to .gitignore
echo "assets/models/*.onnx" >> .gitignore

# Download models during CI/CD instead
# (add download script to your CI pipeline)
```

**Option 3: Use External Storage**
```bash
# Store models on CDN (S3, Firebase Storage, etc.)
# Download during app build process
# See plugins/README.md for alternative approaches
```

### Problem: App size too large

**Cause:** Models add ~150 MB to app bundle

**Solution:**

**Option 1: Model Quantization**
- Use ONNX quantization to reduce model size
- Can reduce size by 50-75% with minimal accuracy loss
- Requires re-exporting model

**Option 2: Download on First Launch**
- Don't bundle models in app
- Download from CDN on first launch
- See `plugins/README.md` "Alternative Approaches" section

**Option 3: Use Smaller Model**
- Switch to SenseVoice-Tiny or other smaller variants
- Trade accuracy for app size

## Advanced Configuration

### Customizing Model Files

Edit `plugins/withSenseVoiceModels.ts`:

```typescript
// Add or remove model files
const MODEL_FILES: ModelFile[] = [
  { filename: 'model.onnx', required: true },
  { filename: 'model_quantized.onnx', required: false }, // Optional
  { filename: 'tokens.txt', required: true },
  { filename: 'config.json', required: true },
  { filename: 'custom.json', required: false }, // Optional
];
```

### Changing Model Directory

Edit `plugins/withSenseVoiceModels.ts`:

```typescript
// Change source directory
const MODELS_SOURCE_DIR = 'my-custom-path/models';

// Change destination subdirectory (inside Resources/assets)
const MODELS_DEST_SUBPATH = 'my-models';
```

After changes, regenerate:
```bash
npx expo prebuild --clean
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/build.yml

name: Build App

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

      - name: Install dependencies
        run: npm install

      - name: Verify models exist
        run: |
          ls -lh assets/models/
          test -f assets/models/model.onnx
          test -f assets/models/tokens.txt
          test -f assets/models/config.json

      - name: Generate native projects
        run: npx expo prebuild

      - name: Verify models in iOS
        run: ls -la ios/*/Resources/models/

      - name: Verify models in Android
        run: ls -la android/app/src/main/assets/models/

      - name: Build iOS
        run: |
          cd ios
          xcodebuild -workspace *.xcworkspace \
                     -scheme YourScheme \
                     -configuration Release
```

### Without Git LFS (Download During CI)

```yaml
# .github/workflows/build.yml

    steps:
      # ... other steps ...

      - name: Download models
        run: |
          mkdir -p assets/models
          # Download from your CDN
          curl -o assets/models/model.onnx https://your-cdn.com/model.onnx
          curl -o assets/models/tokens.txt https://your-cdn.com/tokens.txt
          curl -o assets/models/config.json https://your-cdn.com/config.json

      - name: Verify downloads
        run: |
          ls -lh assets/models/
          # Verify file sizes
          test $(stat -f%z assets/models/model.onnx) -gt 100000000

      - name: Generate native projects
        run: npx expo prebuild
```

## Testing

### Verify Plugin Works

```bash
# Clean build
rm -rf ios android

# Run prebuild with verbose output
npx expo prebuild --clean

# Check for plugin output
# Should see: "🎙️ SenseVoice Models Plugin"
# And: "✓ Copied X file(s) to ios"
# And: "✓ Copied X file(s) to android"
```

### Test in App

Add a debug screen to your app (see `plugins/example-usage.md` for full code):

```typescript
import ModelLoader from './modules/ModelLoader';

// In your debug screen
async function testModels() {
  const info = ModelLoader.getModelInfo();
  console.log('Models:', info);
}
```

## Performance Notes

- **Prebuild time**: Adds ~5-10 seconds (copying 150 MB)
- **App size**: Adds ~150 MB to final app bundle
- **First launch**: Models ready immediately (no download)
- **Updates**: Requires new app version to update models

## Next Steps

1. ✅ Complete this setup guide
2. 📱 Create native module to access models (see `plugins/example-usage.md`)
3. 🧠 Integrate ONNX Runtime for inference
4. 🎤 Connect to audio input
5. 📝 Display transcription results

## References

- [Plugin Documentation](./plugins/README.md)
- [Usage Examples](./plugins/example-usage.md)
- [Expo Config Plugins](https://docs.expo.dev/guides/config-plugins/)
- [ONNX Runtime Mobile](https://onnxruntime.ai/docs/tutorials/mobile/)
