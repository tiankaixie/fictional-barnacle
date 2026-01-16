# Architecture: SenseVoice Models Plugin

Visual overview of how the plugin works.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       DEVELOPER MACHINE                          │
│                                                                   │
│  ┌──────────────┐      ┌─────────────────┐                      │
│  │ assets/      │      │ package.json    │                      │
│  │  models/     │      │  - scripts      │                      │
│  │   ├─ *.onnx  │      │  - deps         │                      │
│  │   ├─ *.txt   │      └─────────────────┘                      │
│  │   └─ *.json  │                                                │
│  └──────────────┘      ┌─────────────────┐                      │
│         │              │ app.json        │                      │
│         │              │  plugins: [     │                      │
│         │              │   "./plugins/   │                      │
│         │              │    withSense... │                      │
│         │              │  ]              │                      │
│         │              └─────────────────┘                      │
│         │                       │                                │
│         ▼                       ▼                                │
│  ┌──────────────────────────────────────┐                       │
│  │      npx expo prebuild               │                       │
│  │                                       │                       │
│  │  Runs plugins:                        │                       │
│  │  ┌─────────────────────────────────┐ │                       │
│  │  │ withSenseVoiceModels            │ │                       │
│  │  │  ├─ withIOSModels               │ │                       │
│  │  │  ├─ withIOSXcodeProject         │ │                       │
│  │  │  └─ withAndroidModels           │ │                       │
│  │  └─────────────────────────────────┘ │                       │
│  └──────────────────────────────────────┘                       │
│                │                                                  │
│                ├─────────────────┬──────────────────┐            │
│                ▼                 ▼                  ▼            │
│         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│         │ ios/         │  │ android/     │  │ Xcode        │   │
│         │  Resources/  │  │  app/src/    │  │  project     │   │
│         │   models/    │  │   main/      │  │  updated     │   │
│         │    ├─ *.onnx │  │   assets/    │  └──────────────┘   │
│         │    ├─ *.txt  │  │    models/   │                      │
│         │    └─ *.json │  │     ├─ *.onnx│                      │
│         └──────────────┘  │     ├─ *.txt │                      │
│                           │     └─ *.json│                      │
│                           └──────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │   xcodebuild / gradle    │
                    │   (Native Build)         │
                    └───────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │      APP BUNDLE           │
                    │   ┌───────────────────┐   │
                    │   │ App Binary        │   │
                    │   ├───────────────────┤   │
                    │   │ Resources/        │   │
                    │   │  models/          │   │
                    │   │   ├─ model.onnx  │   │
                    │   │   ├─ tokens.txt  │   │
                    │   │   └─ config.json │   │
                    │   └───────────────────┘   │
                    │   Size: +150 MB          │
                    └───────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │      DEVICE               │
                    │                           │
                    │  App runs:                │
                    │  ├─ Bundle.main.path()   │
                    │  │  (iOS)                │
                    │  └─ AssetManager.open()  │
                    │     (Android)            │
                    │                           │
                    │  Models ready immediately │
                    │  (no download needed)    │
                    └───────────────────────────┘
```

## Plugin Execution Flow

```
START: npx expo prebuild
  │
  ├─▶ Read app.json
  │    └─▶ Find plugins array
  │         └─▶ Load ./plugins/withSenseVoiceModels
  │
  ├─▶ Execute Plugin
  │    │
  │    ├─▶ [iOS] withIOSModels
  │    │    │
  │    │    ├─▶ Find source files: assets/models/*.{onnx,txt,json}
  │    │    │
  │    │    ├─▶ Create destination: ios/[ProjectName]/Resources/models/
  │    │    │
  │    │    ├─▶ For each file:
  │    │    │    ├─▶ Check if exists
  │    │    │    ├─▶ Check if same size (skip if identical)
  │    │    │    └─▶ Copy file
  │    │    │
  │    │    └─▶ Validate all required files copied
  │    │
  │    ├─▶ [iOS] withIOSXcodeProject
  │    │    │
  │    │    ├─▶ Load Xcode project
  │    │    │
  │    │    ├─▶ Create "Resources/models" group
  │    │    │
  │    │    ├─▶ Add file references
  │    │    │
  │    │    └─▶ Add to "Copy Bundle Resources" build phase
  │    │
  │    └─▶ [Android] withAndroidModels
  │         │
  │         ├─▶ Find source files: assets/models/*.{onnx,txt,json}
  │         │
  │         ├─▶ Create destination: android/app/src/main/assets/models/
  │         │
  │         ├─▶ For each file:
  │         │    ├─▶ Check if exists
  │         │    ├─▶ Check if same size (skip if identical)
  │         │    └─▶ Copy file
  │         │
  │         └─▶ Validate all required files copied
  │
  └─▶ Continue with standard Expo prebuild
       └─▶ Generate remaining native code
            └─▶ Install CocoaPods (iOS)
                 └─▶ Sync Gradle (Android)

END: Native projects ready with bundled models
```

## Metro Bundler Flow

```
START: Metro Bundler starts
  │
  ├─▶ Load metro.config.js
  │    │
  │    ├─▶ Register .onnx as asset extension
  │    │
  │    ├─▶ Exclude .onnx from source extensions
  │    │
  │    └─▶ Configure asset registry
  │
  ├─▶ Scan project files
  │    │
  │    ├─▶ Find .js, .ts, .tsx files → Bundle as JavaScript
  │    │
  │    └─▶ Find .onnx, .bin, .tflite → Treat as static assets
  │         │
  │         └─▶ Skip JS transformation
  │              └─▶ Register in asset registry only
  │
  └─▶ Serve bundles
       │
       ├─▶ JavaScript bundle (app code)
       │
       └─▶ Asset references (not bundled, remain in native projects)

NOTE: ONNX files NEVER go through Metro
      They stay in native projects as static resources
```

## Runtime Access Pattern

### iOS
```
App Launch
  │
  ├─▶ User triggers ML feature
  │
  ├─▶ Native module: ModelLoader.getModelPath("model.onnx")
  │    │
  │    ├─▶ Bundle.main.path(
  │    │     forResource: "model",
  │    │     ofType: "onnx",
  │    │     inDirectory: "models"
  │    │   )
  │    │
  │    └─▶ Return: /var/.../App.app/Resources/models/model.onnx
  │
  ├─▶ Load model with ONNX Runtime
  │    └─▶ InferenceSession.create(modelPath)
  │
  └─▶ Run inference
       └─▶ session.run(inputs)
```

### Android
```
App Launch
  │
  ├─▶ User triggers ML feature
  │
  ├─▶ Native module: ModelLoader.getModelPath("model.onnx")
  │    │
  │    ├─▶ context.assets.open("models/model.onnx")
  │    │
  │    ├─▶ Copy to cache:
  │    │    File(context.cacheDir, "models/model.onnx")
  │    │
  │    └─▶ Return: /data/.../cache/models/model.onnx
  │
  ├─▶ Load model with ONNX Runtime
  │    └─▶ InferenceSession.create(modelPath)
  │
  └─▶ Run inference
       └─▶ session.run(inputs)
```

## File Validation Flow

```
Plugin Validates Files:

For each file in MODEL_FILES:
  │
  ├─▶ Check: Does source file exist?
  │    ├─ YES ─▶ Continue
  │    └─ NO ──▶ Is file required?
  │              ├─ YES ─▶ ERROR: "Missing required file"
  │              └─ NO ──▶ WARN: "Optional file missing"
  │
  ├─▶ Check: Does destination file exist?
  │    ├─ YES ─▶ Compare sizes
  │    │         ├─ Same ─▶ SKIP: "Already exists"
  │    │         └─ Different ─▶ COPY: Overwrite
  │    └─ NO ──▶ COPY: Create new
  │
  └─▶ Copy file
       ├─ Success ─▶ LOG: "Copied X.onnx (150 MB)"
       └─ Failure ─▶ ERROR: "Failed to copy: [reason]"
```

## Verification Flow

```
npm run verify
  │
  ├─▶ Check 1: Plugin file exists?
  │    └─▶ plugins/withSenseVoiceModels.ts
  │
  ├─▶ Check 2: Metro config exists?
  │    └─▶ metro.config.js
  │
  ├─▶ Check 3: Plugin registered?
  │    └─▶ grep "withSenseVoice" app.json
  │
  ├─▶ Check 4: Dependencies installed?
  │    └─▶ node_modules/@expo/config-plugins/
  │
  ├─▶ Check 5: Model files exist?
  │    ├─▶ assets/models/model.onnx
  │    ├─▶ assets/models/tokens.txt
  │    └─▶ assets/models/config.json
  │
  └─▶ Check 6: Models bundled?
       ├─▶ ios/*/Resources/models/*.{onnx,txt,json}
       └─▶ android/app/src/main/assets/models/*.{onnx,txt,json}

EXIT CODE:
  0 = All checks passed
  1 = Errors found
```

## Data Flow Diagram

```
┌──────────────┐
│  Developer   │
│   Provides   │
│    Models    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ assets/models/   │  ◀─── Source of Truth
│  ├─ model.onnx  │       (committed to repo)
│  ├─ tokens.txt  │
│  └─ config.json │
└──────┬───────────┘
       │
       │ npx expo prebuild
       │ (Plugin runs)
       │
       ├─────────────────┬──────────────────┐
       ▼                 ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ iOS         │   │ Android     │   │ Xcode       │
│ Resources/  │   │ assets/     │   │ Project     │
│  models/    │   │  models/    │   │ Updated     │
└─────┬───────┘   └─────┬───────┘   └─────────────┘
      │                 │
      │ Build           │ Build
      ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ iOS App     │   │ Android APK │
│ Bundle      │   │ / AAB       │
│ (.app)      │   │             │
│             │   │             │
│ +150 MB     │   │ +150 MB     │
└─────┬───────┘   └─────┬───────┘
      │                 │
      │ Install         │ Install
      ▼                 ▼
┌─────────────────────────────────┐
│          DEVICE                 │
│                                 │
│  Models ready at runtime        │
│  No download required           │
│  Instant access                 │
└─────────────────────────────────┘
```

## Key Design Decisions

### Why Config Plugin?
- ✅ Runs automatically during prebuild
- ✅ Modifies native projects safely
- ✅ Integrates with Expo workflow
- ✅ No manual Xcode/Android Studio work

### Why Bundle in App?
- ✅ Models ready immediately (no download)
- ✅ Works offline
- ✅ No CDN/server required
- ✅ Guaranteed availability
- ❌ Increases app size (+150 MB)

### Why Metro Config?
- ✅ Prevents Metro from bundling ONNX as JS
- ✅ Treats as static assets
- ✅ Improves build performance
- ✅ Supports multiple ML formats

### Why Separate Scripts?
- ✅ Test without real models
- ✅ Validate setup automatically
- ✅ CI/CD integration
- ✅ Developer convenience

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Plugin execution | 5-10 sec | Copying 150 MB |
| Metro startup | +0 sec | ONNX files ignored |
| iOS build | +0 sec | Files already in bundle |
| Android build | +0 sec | Files already in assets |
| App install | +150 MB | One-time cost |
| First launch | +0 sec | No download |
| Model loading | ~1 sec | Device-dependent |

## Security Considerations

- ✅ Models bundled in app (tamper-evident)
- ✅ No network transmission
- ✅ Offline operation
- ✅ Apple/Google review process applies
- ⚠️ Models visible in app bundle (not encrypted)
- ⚠️ Large app size may deter downloads

## Scalability

| Scenario | Impact | Solution |
|----------|--------|----------|
| More models | +Size per model | Model selection, lazy load |
| Larger models | +Build/install time | Quantization, compression |
| Frequent updates | +Review cycles | OTA updates, CDN download |
| Multiple variants | +Complexity | Dynamic model loading |

---

This architecture prioritizes:
1. **Developer Experience**: Automatic, no manual steps
2. **Reliability**: Bundled models, always available
3. **Performance**: Native access, no download
4. **Maintainability**: Clear separation of concerns
