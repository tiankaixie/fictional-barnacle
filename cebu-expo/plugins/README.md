# Expo Config Plugins

Once the contents of this folder change, update this document.

## Architecture
Custom Expo Config Plugins for bundling native assets (ONNX models) into iOS and Android apps during the prebuild process. Uses `@expo/config-plugins` API to modify native projects before compilation.

## File Registry

| Name | Status | Core Function |
|------|--------|---------------|
| `withSenseVoiceModels.ts` | Production-ready | Config plugin that copies ONNX model files to iOS Resources and Android assets directories |
| `README.md` | Current | Plugin documentation and usage guide |

---

## SenseVoice Models Plugin

### Overview

The `withSenseVoiceModels` plugin automatically bundles large ONNX model files into your iOS and Android apps during the `expo prebuild` process. This plugin handles:

- **iOS**: Copies models to `ios/[ProjectName]/Resources/models/` and adds them to Xcode project
- **Android**: Copies models to `android/app/src/main/assets/models/`
- **Error handling**: Validates required files exist and reports missing files
- **Idempotency**: Safe to run multiple times (skips identical files)

### Required Model Files

The plugin expects these files in `assets/models/`:

| File | Size (approx) | Required | Purpose |
|------|---------------|----------|---------|
| `model.onnx` | ~150 MB | ✅ Yes | SenseVoice-Small ONNX model |
| `tokens.txt` | ~50 KB | ✅ Yes | Tokenizer vocabulary |
| `config.json` | ~2 KB | ✅ Yes | Model configuration |

**Total size**: ~150 MB

### Installation

1. **Install dependencies** (if not already installed):
   ```bash
   npm install --save-dev @expo/config-plugins
   ```

2. **Add plugin to app.json**:
   ```json
   {
     "expo": {
       "plugins": [
         "./plugins/withSenseVoiceModels"
       ]
     }
   }
   ```

3. **Place model files** in `assets/models/`:
   ```
   assets/
   └── models/
       ├── model.onnx
       ├── tokens.txt
       └── config.json
   ```

4. **Run prebuild**:
   ```bash
   npx expo prebuild
   ```

### Usage in Native Code

#### iOS (Swift)

```swift
// Get model path from bundle
if let modelPath = Bundle.main.path(forResource: "model", ofType: "onnx", inDirectory: "models") {
    print("Model path: \(modelPath)")
    // Load model with ONNX Runtime or other inference engine
}

// Get tokens file
if let tokensPath = Bundle.main.path(forResource: "tokens", ofType: "txt", inDirectory: "models") {
    let tokens = try String(contentsOfFile: tokensPath)
}
```

#### Android (Kotlin/Java)

```kotlin
// Get model from assets
val assetManager = context.assets
val modelInputStream = assetManager.open("models/model.onnx")

// Copy to cache for inference engine
val modelFile = File(context.cacheDir, "model.onnx")
modelInputStream.use { input ->
    modelFile.outputStream().use { output ->
        input.copyTo(output)
    }
}
```

#### React Native (JavaScript)

```javascript
import * as FileSystem from 'expo-file-system';

// iOS: Access via Bundle.main (requires native module)
// Android: Copy from assets (requires native module)

// Example native module method:
// - iOS: Returns Bundle.main.path(forResource:ofType:inDirectory:)
// - Android: Copies from assets to cache, returns cache path
```

### How It Works

1. **Plugin Execution**: Runs during `expo prebuild` (before native compilation)

2. **iOS Process**:
   - Creates `Resources/models/` directory in Xcode project
   - Copies model files from `assets/models/`
   - Adds files to Xcode project's resource build phase
   - Files are included in app bundle

3. **Android Process**:
   - Creates `app/src/main/assets/models/` directory
   - Copies model files from `assets/models/`
   - Files are automatically included in APK/AAB

4. **Validation**:
   - Checks if source files exist
   - Throws error if required files are missing
   - Skips copying if destination file exists with same size

### Metro Bundler Configuration

The `metro.config.js` is configured to:
- Treat `.onnx` files as static assets (not JavaScript)
- Prevent Metro from bundling large model files
- Cache model files efficiently
- Ignore model directory from file watching

### Troubleshooting

#### Error: "Missing model file"
**Cause**: Required model files not found in `assets/models/`

**Solution**:
```bash
# Ensure files exist
ls -lh assets/models/
# Should show: model.onnx, tokens.txt, config.json

# If missing, download models to assets/models/
```

#### Error: "Failed to copy model files"
**Cause**: Permission issues or insufficient disk space

**Solution**:
```bash
# Check permissions
chmod -R 755 assets/models/

# Check disk space (models are ~150 MB)
df -h

# Clean and retry
rm -rf ios android
npx expo prebuild
```

#### Plugin not running
**Cause**: Plugin not registered in app.json or `@expo/config-plugins` not installed

**Solution**:
```bash
# Install dependency
npm install --save-dev @expo/config-plugins

# Verify app.json has plugin
cat app.json | grep withSenseVoiceModels

# Should output: "./plugins/withSenseVoiceModels"
```

#### Models not found at runtime
**Cause**: Files not included in native build

**Solution**:
```bash
# iOS: Check Xcode project
open ios/*.xcodeproj
# Navigate to Project > Build Phases > Copy Bundle Resources
# Verify models are listed

# Android: Check assets directory
ls -la android/app/src/main/assets/models/

# Rebuild native projects
npx expo prebuild --clean
```

#### Build fails with "file too large"
**Cause**: Git or deployment system rejecting large files

**Solution**:
```bash
# Add to .gitignore if models shouldn't be in repo
echo "assets/models/*.onnx" >> .gitignore

# Use Git LFS for large files
git lfs track "assets/models/*.onnx"

# Or download models during CI/CD
# (not recommended for app submission)
```

### Performance Considerations

- **Build Time**: Plugin adds ~5-10 seconds to prebuild (file copying)
- **App Size**: Adds ~150 MB to app bundle (models are compressed in release builds)
- **First Launch**: Models are ready immediately (no download required)
- **Updates**: Changing models requires new app version (they're bundled)

### Advanced Configuration

To customize the plugin, edit `plugins/withSenseVoiceModels.ts`:

```typescript
// Change model files
const MODEL_FILES: ModelFile[] = [
  { filename: 'model.onnx', required: true },
  { filename: 'custom-model.onnx', required: false }, // Optional file
  { filename: 'tokens.txt', required: true },
  { filename: 'config.json', required: true },
];

// Change source/destination directories
const MODELS_SOURCE_DIR = 'custom/models/path';
const MODELS_DEST_SUBPATH = 'my-models'; // Will be Resources/my-models on iOS
```

### Alternative Approaches

If bundling is not suitable:

1. **Download on First Launch**:
   - Store models on CDN (S3, Firebase Storage)
   - Download to `FileSystem.cacheDirectory` on first launch
   - Pros: Smaller app size, easier updates
   - Cons: Requires network, slower first launch

2. **Over-the-Air Updates**:
   - Use Expo Updates + custom asset loader
   - Update models without app store submission
   - Pros: Fast model updates
   - Cons: Complex setup, still requires initial download

3. **Native Module with Asset Catalog**:
   - Manually add to Xcode/Android Studio
   - Use native APIs to load
   - Pros: Full control
   - Cons: Manual process, not Expo-managed

### References

- [Expo Config Plugins Documentation](https://docs.expo.dev/guides/config-plugins/)
- [Metro Bundler Configuration](https://docs.expo.dev/guides/customizing-metro/)
- [ONNX Runtime Mobile](https://onnxruntime.ai/docs/tutorials/mobile/)
- [Expo File System](https://docs.expo.dev/versions/latest/sdk/filesystem/)

### Support

For issues with this plugin:
1. Check `assets/models/` contains required files
2. Run `npx expo prebuild --clean` to regenerate native projects
3. Verify plugin output during prebuild (logs start with "🎙️ SenseVoice Models Plugin")
4. Check native project directories contain copied files
