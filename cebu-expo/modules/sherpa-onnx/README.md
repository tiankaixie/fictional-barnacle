# Sherpa-ONNX Native Module for Expo

This is a custom Expo native module that wraps sherpa-onnx for on-device speech recognition.

## Current Status

✅ **Completed:**
- TypeScript interface and bindings (`src/index.ts`)
- iOS module structure (`ios/SherpaOnnxModule.swift`)
- Android module structure (`android/src/main/java/expo/modules/sherpaonnx/SherpaOnnxModule.kt`)
- Module configuration files

⚠️ **Pending Implementation:**
- Download and integrate sherpa-onnx native libraries
- Implement actual recognition logic in iOS and Android
- Download SenseVoice-Small ONNX model files
- Test on physical devices

## Required Steps to Complete

### 1. Download Sherpa-ONNX Libraries

#### iOS
```bash
# Download sherpa-onnx iOS framework
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.10.x/sherpa-onnx-v1.10.x-ios-static.tar.bz2
tar -xvf sherpa-onnx-v1.10.x-ios-static.tar.bz2
# Copy framework to ios/ directory
```

#### Android
```bash
# Download sherpa-onnx Android AAR
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.10.x/sherpa-onnx-v1.10.x-android.aar
# Copy to android/libs/
```

### 2. Download SenseVoice-Small Model

```bash
# Download ONNX model files
cd ../../assets/models
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17.tar.bz2
tar -xvf sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17.tar.bz2
# Extract model.onnx, tokens.txt, etc.
```

### 3. Implement Native Code

#### iOS (`ios/SherpaOnnxModule.swift`)
- Import sherpa-onnx C API headers
- Implement `initialize()` using `sherpa_onnx_create_offline_recognizer()`
- Implement `decode()` using `sherpa_onnx_offline_recognizer_decode()`
- Handle audio buffer conversion

#### Android (`android/.../SherpaOnnxModule.kt`)
- Import sherpa-onnx Android library
- Create `OfflineRecognizer` instance
- Implement recognition with audio samples
- Handle threading properly

### 4. Link Native Libraries

#### iOS
Update `ios/SherpaOnnxModule.podspec`:
```ruby
Pod::Spec.new do |s|
  s.name           = 'SherpaOnnxModule'
  s.version        = '1.0.0'
  s.summary        = 'Sherpa-ONNX ASR for React Native'
  s.author         = ''
  s.homepage       = ''
  s.platform       = :ios, '13.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Link sherpa-onnx framework
  s.vendored_frameworks = 'sherpa-onnx.xcframework'

  s.source_files = "**/*.{h,m,swift}"
end
```

#### Android
Update `android/build.gradle`:
```gradle
dependencies {
  implementation files('libs/sherpa-onnx-v1.10.x-android.aar')
}
```

## Usage Example

```typescript
import SherpaOnnx from './modules/sherpa-onnx';

// Initialize
await SherpaOnnx.initialize({
  modelPath: 'model.onnx',
  tokensPath: 'tokens.txt',
  numThreads: 4,
  sampleRate: 16000,
});

// Transcribe audio
const samples = new Float32Array([/* audio samples */]);
const result = await SherpaOnnx.decode(samples);
console.log('Transcription:', result.text);

// Cleanup
await SherpaOnnx.release();
```

## Alternative Approach

If native module development is too complex, consider these alternatives:

1. **Use system speech recognition:**
   - `expo-speech-recognition` (uses device APIs)
   - Simpler but may require network

2. **Cloud-based ASR:**
   - Keep OpenAI Whisper API approach
   - Lower development complexity

3. **Hybrid approach:**
   - Use react-native-voice for basic recognition
   - Fall back to cloud for difficult cases

## Next Steps

1. Decide on implementation approach (complete native module vs alternative)
2. If proceeding with native module:
   - Download sherpa-onnx libraries for both platforms
   - Integrate into Xcode and Android Studio projects
   - Implement recognition logic
   - Test with Chinese audio samples
3. Otherwise, pivot to alternative ASR solution
