# Quick Reference: SenseVoice Models Plugin

One-page reference for the ONNX models bundling plugin.

## Commands

```bash
# Setup
npm install                    # Install dependencies
npm run setup:test-models      # Create test model files
npm run verify                 # Check setup status

# Build
npm run prebuild               # Generate native projects (bundles models)
npm run prebuild:clean         # Clean regenerate native projects

# Run
npm run ios                    # Run on iOS
npm run android                # Run on Android
```

## File Structure

```
cebu-expo/
├── assets/models/             # Source models (you provide)
│   ├── model.onnx            # ~150 MB
│   ├── tokens.txt            # ~50 KB
│   └── config.json           # ~2 KB
├── plugins/
│   ├── withSenseVoiceModels.ts    # Plugin (auto-runs on prebuild)
│   ├── README.md                   # Full documentation
│   └── example-usage.md            # Native module examples
├── scripts/
│   ├── create-test-models.sh      # Create test files
│   └── verify-setup.sh            # Validate setup
├── app.json                   # Plugin configured here
└── metro.config.js            # Handles .onnx files
```

## Plugin Configuration

### app.json
```json
{
  "expo": {
    "plugins": ["./plugins/withSenseVoiceModels"]
  }
}
```

### Metro (metro.config.js)
Automatically treats `.onnx` files as static assets (not JavaScript).

## Model Files

### Required Files
| File | Size | Description |
|------|------|-------------|
| `model.onnx` | ~150 MB | ONNX model |
| `tokens.txt` | ~50 KB | Vocabulary |
| `config.json` | ~2 KB | Config |

### Where They Go
- **Source**: `assets/models/`
- **iOS**: `ios/[ProjectName]/Resources/models/`
- **Android**: `android/app/src/main/assets/models/`

## Accessing Models

### iOS (Swift)
```swift
if let path = Bundle.main.path(
  forResource: "model",
  ofType: "onnx",
  inDirectory: "models"
) {
  // Use path with inference engine
}
```

### Android (Kotlin)
```kotlin
val stream = context.assets.open("models/model.onnx")
// Copy to cache for inference engine
```

### React Native
Requires native module (see `plugins/example-usage.md`).

## Verification

### Check Setup
```bash
npm run verify
```

**Checks**:
1. ✓ Plugin file exists
2. ✓ Metro config exists
3. ✓ Plugin registered in app.json
4. ✓ Dependencies installed
5. ✓ Model files present
6. ✓ Models bundled in iOS/Android

### Check Models in Native Projects
```bash
# iOS
ls -la ios/*/Resources/models/

# Android
ls -la android/app/src/main/assets/models/
```

## Troubleshooting

### Models not found
```bash
ls -lh assets/models/              # Check source
npm run setup:test-models          # Create test files
npm run prebuild:clean             # Regenerate
npm run verify                     # Confirm
```

### Plugin not running
```bash
cat app.json | grep withSenseVoice # Check registration
npm install                        # Install deps
npm run prebuild:clean             # Regenerate
```

### Build errors
```bash
rm -rf node_modules ios android    # Clean
npm install                        # Reinstall
npm run prebuild                   # Rebuild
```

## Key Concepts

### Plugin Execution
- Runs during `npx expo prebuild` (before native build)
- Copies files from `assets/models/` to native projects
- Adds files to Xcode project (iOS) or assets folder (Android)

### Metro Bundler
- Configured to treat `.onnx` as assets (not JS)
- Prevents Metro from bundling large model files
- No need to `require()` or `import` model files

### Idempotency
- Safe to run prebuild multiple times
- Skips files that already exist with same size
- No duplicate files created

## Common Workflows

### First Time
```bash
npm install
npm run setup:test-models
npm run verify
npm run prebuild
npm run ios
```

### Add Real Models
```bash
# 1. Copy models to assets/models/
cp /path/to/model.onnx assets/models/
cp /path/to/tokens.txt assets/models/
cp /path/to/config.json assets/models/

# 2. Regenerate native projects
npm run prebuild:clean

# 3. Verify bundled
npm run verify

# 4. Test
npm run ios
```

### Update Models
```bash
# 1. Update files in assets/models/
# 2. Regenerate
npm run prebuild:clean

# 3. Verify
npm run verify
```

### Debug Issues
```bash
# 1. Check status
npm run verify

# 2. View prebuild output
npm run prebuild:clean
# Look for: "🎙️ SenseVoice Models Plugin"

# 3. Check native projects
ls -la ios/*/Resources/models/
ls -la android/app/src/main/assets/models/

# 4. Check Xcode (iOS)
open ios/*.xcodeproj
# Build Phases > Copy Bundle Resources
```

## Performance

| Metric | Value |
|--------|-------|
| Prebuild time | +5-10 seconds |
| App size increase | +150 MB |
| First launch | No download needed |
| Model updates | Requires new app version |

## Git LFS (Optional)

For large files in git:

```bash
git lfs install
git lfs track "assets/models/*.onnx"
git add .gitattributes
git commit -m "Track ONNX with LFS"
```

Or exclude:
```bash
# .gitignore
assets/models/*.onnx
```

## Documentation Links

- **Full Plugin Docs**: `plugins/README.md`
- **Usage Examples**: `plugins/example-usage.md`
- **Setup Guide**: `SETUP_MODELS.md`
- **Scripts Docs**: `scripts/README.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`

## Support

**Issue Checklist**:
1. Run `npm run verify` to identify problems
2. Check documentation for your issue
3. Try `npm run prebuild:clean`
4. Check logs for error messages

**Common Fixes**:
- Missing models → `npm run setup:test-models`
- Plugin not running → Check `app.json` plugins array
- Dependencies missing → `npm install`
- Native projects outdated → `npm run prebuild:clean`

---

**TIP**: Run `npm run verify` whenever something seems wrong!
