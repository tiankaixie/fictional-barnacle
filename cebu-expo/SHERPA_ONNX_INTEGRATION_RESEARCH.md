# Sherpa-ONNX Native Integration Research for React Native/Expo
## On-Device Chinese ASR with SenseVoice-Small

**Date:** 2026-01-15
**Purpose:** Complete integration guide for sherpa-onnx native libraries in React Native/Expo apps

---

## Table of Contents
1. [Download Links](#download-links)
2. [SenseVoice-Small Model](#sensevoice-small-model)
3. [API Documentation](#api-documentation)
4. [React Native Examples](#react-native-examples)
5. [Integration Steps](#integration-steps)
6. [Code Examples](#code-examples)
7. [Warnings and Known Issues](#warnings-and-known-issues)

---

## Download Links

### Latest Version: v1.12.23 (January 15, 2026)

#### Android Libraries

**Official AAR Release (Recommended):**
- **Direct Download:** `sherpa-onnx-1.12.23.aar` (36.9 MB)
  ```bash
  wget https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.23/sherpa-onnx-1.12.23.aar
  ```

**Maven/Gradle Dependency (Alternative):**
```gradle
implementation 'com.bihe0832.android:lib-sherpa-onnx:6.25.12'
```
- Maven Central: https://central.sonatype.com/artifact/com.bihe0832.android/lib-sherpa-onnx

**RockChip NPU Variant:**
- `sherpa-onnx-1.12.23-rknn.aar` (20.4 MB)

#### iOS Libraries

**Important:** iOS requires building from source - no pre-built frameworks available.

**Build Instructions:**
```bash
# Clone repository
git clone https://github.com/k2-fsa/sherpa-onnx
cd sherpa-onnx

# Build for iOS (generates build-ios/ directory)
./build-ios.sh
```

**Requirements:**
- macOS (required)
- Xcode 14.2 or later
- CMake 3.25.1+
- iOS deployment target: iOS 13.0+

**Generated Files:**
- `build-ios/install/lib/libsherpa-onnx-c-api.dylib`
- `build-ios/sherpa-onnx.xcframework`
- `build-ios/ios-onnxruntime` (ONNX Runtime framework)

---

## SenseVoice-Small Model

### Recommended Model: sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17-int8

**Languages Supported:** Chinese (Mandarin), Cantonese, English, Japanese, Korean

**Download:**
```bash
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17-int8.tar.bz2
tar xvf sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17-int8.tar.bz2
```

**Model Files:**
- `model.int8.onnx` (228 MB) - int8 quantized model
- `tokens.txt` - Token vocabulary
- `test_wavs/` - Sample audio files

**Alternative (Float32):**
```bash
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17.tar.bz2
```
- `model.onnx` (894 MB) - float32 model (higher accuracy, slower)

### Alternative: Improved Cantonese Model (2025-09-09)

**Download:**
```bash
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2
```
- Fine-tuned with 21.8k hours of Cantonese data
- 226 MB
- **Note:** Does not support punctuation (unlike 2024-07-17 model)

### Other Chinese ASR Models

**Paraformer (Offline):**
```bash
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-paraformer-zh-int8-2025-10-07.tar.bz2
```

**Zipformer (Streaming):**
```bash
wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-multi-zh-hans-2023-12-12.tar.bz2
```

---

## API Documentation

### C API Reference

**Official Documentation:** https://k2-fsa.github.io/sherpa/onnx/c-api/index.html

**Header File:** https://github.com/k2-fsa/sherpa-onnx/blob/master/sherpa-onnx/c-api/c-api.h

**SenseVoice C API:** https://k2-fsa.github.io/sherpa/onnx/sense-voice/c-api.html

### Key C API Functions

#### Offline (Batch) Recognizer

**Creation & Destruction:**
- `SherpaOnnxCreateOfflineRecognizer(config)` - Initialize recognizer
- `SherpaOnnxDestroyOfflineRecognizer(recognizer)` - Release resources

**Stream Management:**
- `SherpaOnnxCreateOfflineStream(recognizer)` - Create audio stream
- `SherpaOnnxDestroyOfflineStream(stream)` - Cleanup stream

**Audio Processing:**
- `SherpaOnnxAcceptWaveformOffline(stream, sample_rate, samples, num_samples)` - Feed audio
- `SherpaOnnxDecodeOfflineStream(recognizer, stream)` - Process audio

**Results:**
- `SherpaOnnxGetOfflineStreamResult(stream)` - Get recognition result
- `SherpaOnnxDestroyOfflineRecognizerResult(result)` - Cleanup result

#### Online (Streaming) Recognizer

**Creation & Destruction:**
- `SherpaOnnxCreateOnlineRecognizer(config)` - Initialize streaming recognizer
- `SherpaOnnxDestroyOnlineRecognizer(recognizer)` - Release resources

**Stream Operations:**
- `SherpaOnnxCreateOnlineStream(recognizer)` - Create stream
- `SherpaOnnxOnlineStreamAcceptWaveform(stream, sample_rate, samples, num_samples)` - Feed audio
- `SherpaOnnxDecodeOnlineStream(recognizer, stream)` - Process stream
- `SherpaOnnxGetOnlineStreamResult(recognizer, stream)` - Get partial/final results

### Configuration Structures

**OfflineRecognizerConfig:**
- `OfflineModelConfig` - Model paths and settings
- `FeatureConfig` - Audio preprocessing (sample rate, features)
- `decoding_method` - "greedy_search" (default)

**OfflineSenseVoiceModelConfig:**
- `model` - Path to model.onnx
- `language` - "auto", "zh", "en", "ja", "ko", "yue"
- `use_itn` - Enable inverse text normalization (punctuation)

---

## React Native Examples

### Existing React Native Wrapper

**Repository:** https://github.com/kislay99/react-native-sherpa-onnx-offline-tts

**Note:** This is for TTS (Text-to-Speech) only, but demonstrates the native module architecture.

**Architecture:**
- `/ios` (51.5%) - Swift implementation
- `/android` (23.1%) - Kotlin implementation
- `/src` (13.1%) - TypeScript bridge

**Key Files:**
- `ios/*.swift` - iOS native module
- `android/src/main/java/**/*.kt` - Android native module
- `src/index.tsx` - JavaScript API
- `*.podspec` - CocoaPods configuration
- `android/build.gradle` - Gradle configuration

**JavaScript API Pattern:**
```typescript
import TTSManager from 'react-native-sherpa-onnx-offline-tts';

// Initialize with model paths
await TTSManager.initialize(config);

// Use functionality
await TTSManager.generateAndPlay(text);

// Cleanup
await TTSManager.deinitialize();
```

### Official Examples

**Node.js Examples:** https://github.com/k2-fsa/sherpa-onnx/tree/master/nodejs-examples

**iOS Swift Examples:** https://github.com/k2-fsa/sherpa-onnx/tree/master/ios-swift/SherpaOnnx

**Android Kotlin Examples:** https://github.com/k2-fsa/sherpa-onnx/tree/master/android

**Key Android Example Apps:**
- `SherpaOnnx` - Streaming ASR with pre-built APK
- `SherpaOnnxVadAsr` - VAD + Offline ASR
- `SherpaOnnx2Pass` - Streaming + Offline ASR (two-pass)

---

## Integration Steps

### Overview: Expo Native Module Approach

Use Expo Modules API to wrap sherpa-onnx native libraries.

**Official Guides:**
- Create Expo Module: https://docs.expo.dev/modules/native-module-tutorial/
- Wrap Third-Party Libraries: https://docs.expo.dev/modules/third-party-library/

### Step 1: Create Expo Module

```bash
npx create-expo-module@latest expo-sherpa-onnx
cd expo-sherpa-onnx
```

**Project Structure:**
```
expo-sherpa-onnx/
├── android/
│   ├── src/main/java/expo/modules/sherpaonnx/
│   ├── build.gradle
│   └── libs/  # Place sherpa-onnx-1.12.23.aar here
├── ios/
│   ├── ExpoSherpaOnnx.podspec
│   └── ExpoSherpaOnnxModule.swift
├── src/
│   └── index.ts
├── expo-module.config.json
└── package.json
```

### Step 2: iOS Integration (Build from Source)

#### 2.1 Build sherpa-onnx for iOS

```bash
# Clone sherpa-onnx
git clone https://github.com/k2-fsa/sherpa-onnx
cd sherpa-onnx

# Build (generates build-ios/ directory)
./build-ios.sh
```

#### 2.2 Copy Frameworks to Expo Module

```bash
# From sherpa-onnx repository
cp -r build-ios/sherpa-onnx.xcframework /path/to/expo-sherpa-onnx/ios/
cp -r build-ios/ios-onnxruntime /path/to/expo-sherpa-onnx/ios/
```

#### 2.3 Update ExpoSherpaOnnx.podspec

```ruby
Pod::Spec.new do |s|
  s.name           = 'ExpoSherpaOnnx'
  s.version        = '1.0.0'
  s.summary        = 'Sherpa-ONNX integration for Expo'
  s.description    = 'On-device speech recognition using sherpa-onnx'
  s.author         = ''
  s.homepage       = 'https://github.com/your-username/expo-sherpa-onnx'
  s.platforms      = { :ios => '13.0', :tvos => '13.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Sherpa-ONNX frameworks
  s.vendored_frameworks = [
    'sherpa-onnx.xcframework',
    'ios-onnxruntime.xcframework'
  ]

  # Include all .swift files in the ios/ directory
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
```

#### 2.4 Create Bridging Header (ios/ExpoSherpaOnnx-Bridging-Header.h)

```objc
#ifndef ExpoSherpaOnnx_Bridging_Header_h
#define ExpoSherpaOnnx_Bridging_Header_h

#import "sherpa-onnx/c-api/c-api.h"

#endif
```

#### 2.5 Create Swift Module (ios/ExpoSherpaOnnxModule.swift)

```swift
import ExpoModulesCore

public class ExpoSherpaOnnxModule: Module {
  private var recognizer: OpaquePointer?

  public func definition() -> ModuleDefinition {
    Name("ExpoSherpaOnnx")

    Function("initializeRecognizer") { (modelPath: String, tokensPath: String, language: String) -> Bool in
      return self.initializeRecognizer(modelPath: modelPath, tokensPath: tokensPath, language: language)
    }

    Function("recognizeAudio") { (audioSamples: [Float], sampleRate: Int) -> String in
      return self.recognizeAudio(samples: audioSamples, sampleRate: sampleRate)
    }

    Function("release") {
      self.releaseRecognizer()
    }
  }

  private func initializeRecognizer(modelPath: String, tokensPath: String, language: String) -> Bool {
    // See full implementation in Code Examples section below
    return true
  }

  private func recognizeAudio(samples: [Float], sampleRate: Int) -> String {
    // See full implementation in Code Examples section below
    return ""
  }

  private func releaseRecognizer() {
    if recognizer != nil {
      SherpaOnnxDestroyOfflineRecognizer(recognizer)
      recognizer = nil
    }
  }
}
```

### Step 3: Android Integration

#### 3.1 Add AAR Library

**Option 1: Direct AAR (Recommended)**

Place `sherpa-onnx-1.12.23.aar` in `android/libs/`

**Option 2: Gradle Dependency**

Edit `android/build.gradle`:
```gradle
repositories {
  mavenCentral()
}

dependencies {
  implementation 'com.bihe0832.android:lib-sherpa-onnx:6.25.12'
}
```

#### 3.2 Update android/build.gradle

```gradle
apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'
apply plugin: 'maven-publish'

group = 'expo.modules.sherpaonnx'
version = '1.0.0'

buildscript {
  repositories {
    mavenCentral()
  }
}

repositories {
  mavenCentral()
}

dependencies {
  implementation project(':expo-modules-core')
  implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk7:${getKotlinVersion()}"

  // Sherpa-ONNX
  implementation files('libs/sherpa-onnx-1.12.23.aar')
  // OR
  // implementation 'com.bihe0832.android:lib-sherpa-onnx:6.25.12'
}

android {
  compileSdkVersion 34

  defaultConfig {
    minSdkVersion 21
    targetSdkVersion 34
  }

  packagingOptions {
    pickFirst 'lib/arm64-v8a/libsherpa-onnx-jni.so'
    pickFirst 'lib/armeabi-v7a/libsherpa-onnx-jni.so'
    pickFirst 'lib/x86_64/libsherpa-onnx-jni.so'
  }
}
```

#### 3.3 Create Kotlin Module

**File:** `android/src/main/java/expo/modules/sherpaonnx/ExpoSherpaOnnxModule.kt`

```kotlin
package expo.modules.sherpaonnx

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.k2fsa.sherpa.onnx.*
import android.content.res.AssetManager

class ExpoSherpaOnnxModule : Module() {
  private var recognizer: OfflineRecognizer? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoSherpaOnnx")

    Function("initializeRecognizer") { modelPath: String, tokensPath: String, language: String ->
      initializeRecognizer(modelPath, tokensPath, language)
    }

    Function("recognizeAudio") { audioSamples: FloatArray, sampleRate: Int ->
      recognizeAudio(audioSamples, sampleRate)
    }

    Function("release") {
      releaseRecognizer()
    }
  }

  private fun initializeRecognizer(modelPath: String, tokensPath: String, language: String): Boolean {
    // See full implementation in Code Examples section below
    return true
  }

  private fun recognizeAudio(audioSamples: FloatArray, sampleRate: Int): String {
    // See full implementation in Code Examples section below
    return ""
  }

  private fun releaseRecognizer() {
    recognizer?.release()
    recognizer = null
  }
}
```

### Step 4: TypeScript Bridge

**File:** `src/index.ts`

```typescript
import { NativeModulesProxy } from 'expo-modules-core';

const ExpoSherpaOnnx = NativeModulesProxy.ExpoSherpaOnnx;

export interface RecognizerConfig {
  modelPath: string;
  tokensPath: string;
  language?: 'auto' | 'zh' | 'en' | 'ja' | 'ko' | 'yue';
}

export interface RecognitionResult {
  text: string;
  tokens?: string[];
  timestamps?: number[];
}

export async function initializeRecognizer(config: RecognizerConfig): Promise<boolean> {
  return await ExpoSherpaOnnx.initializeRecognizer(
    config.modelPath,
    config.tokensPath,
    config.language || 'auto'
  );
}

export async function recognizeAudio(
  audioSamples: Float32Array,
  sampleRate: number = 16000
): Promise<string> {
  // Convert Float32Array to regular array for native bridge
  const samples = Array.from(audioSamples);
  return await ExpoSherpaOnnx.recognizeAudio(samples, sampleRate);
}

export async function release(): Promise<void> {
  await ExpoSherpaOnnx.release();
}
```

### Step 5: Configure expo-module.config.json

```json
{
  "platforms": ["ios", "android"],
  "ios": {
    "modules": ["ExpoSherpaOnnxModule"]
  },
  "android": {
    "modules": ["expo.modules.sherpaonnx.ExpoSherpaOnnxModule"]
  }
}
```

### Step 6: Bundle Model Files

#### Option A: Bundle in App Assets

**iOS (via Xcode):**
1. Open your app in Xcode
2. Add model files to project: `Add Files to "YourApp"`
3. Ensure "Copy items if needed" is checked
4. Add to target

**Android (assets folder):**
```
android/app/src/main/assets/
├── model.int8.onnx
└── tokens.txt
```

#### Option B: Download on First Launch

```typescript
import * as FileSystem from 'expo-file-system';

async function downloadModel() {
  const modelUrl = 'https://your-cdn.com/model.int8.onnx';
  const modelPath = `${FileSystem.documentDirectory}model.int8.onnx`;

  await FileSystem.downloadAsync(modelUrl, modelPath);
  return modelPath;
}
```

---

## Code Examples

### Complete iOS Swift Implementation

**File:** `ios/ExpoSherpaOnnxModule.swift`

```swift
import ExpoModulesCore

public class ExpoSherpaOnnxModule: Module {
  private var recognizer: OpaquePointer?

  public func definition() -> ModuleDefinition {
    Name("ExpoSherpaOnnx")

    Function("initializeRecognizer") { (modelPath: String, tokensPath: String, language: String) -> Bool in
      return self.initializeRecognizer(modelPath: modelPath, tokensPath: tokensPath, language: language)
    }

    Function("recognizeAudio") { (audioSamples: [Float], sampleRate: Int) -> String in
      return self.recognizeAudio(samples: audioSamples, sampleRate: sampleRate)
    }

    Function("release") {
      self.releaseRecognizer()
    }
  }

  private func initializeRecognizer(modelPath: String, tokensPath: String, language: String) -> Bool {
    // Create SenseVoice model config
    var senseVoiceConfig = SherpaOnnxOfflineSenseVoiceModelConfig()
    senseVoiceConfig.model = (modelPath as NSString).utf8String
    senseVoiceConfig.language = (language as NSString).utf8String
    senseVoiceConfig.use_itn = 1  // Enable punctuation

    // Create offline model config
    var offlineModelConfig = SherpaOnnxOfflineModelConfig()
    offlineModelConfig.debug = 0
    offlineModelConfig.num_threads = 2
    offlineModelConfig.provider = ("cpu" as NSString).utf8String
    offlineModelConfig.tokens = (tokensPath as NSString).utf8String
    offlineModelConfig.sense_voice = senseVoiceConfig

    // Create recognizer config
    var recognizerConfig = SherpaOnnxOfflineRecognizerConfig()
    recognizerConfig.decoding_method = ("greedy_search" as NSString).utf8String
    recognizerConfig.model_config = offlineModelConfig

    // Initialize recognizer
    recognizer = SherpaOnnxCreateOfflineRecognizer(&recognizerConfig)

    return recognizer != nil
  }

  private func recognizeAudio(samples: [Float], sampleRate: Int) -> String {
    guard let recognizer = recognizer else {
      return ""
    }

    // Create stream
    let stream = SherpaOnnxCreateOfflineStream(recognizer)

    // Accept waveform
    samples.withUnsafeBufferPointer { bufferPointer in
      if let baseAddress = bufferPointer.baseAddress {
        SherpaOnnxAcceptWaveformOffline(stream, Int32(sampleRate), baseAddress, Int32(samples.count))
      }
    }

    // Decode
    SherpaOnnxDecodeOfflineStream(recognizer, stream)

    // Get result
    let result = SherpaOnnxGetOfflineStreamResult(stream)
    let text = String(cString: result!.pointee.text)

    // Cleanup
    SherpaOnnxDestroyOfflineRecognizerResult(result)
    SherpaOnnxDestroyOfflineStream(stream)

    return text
  }

  private func releaseRecognizer() {
    if let recognizer = recognizer {
      SherpaOnnxDestroyOfflineRecognizer(recognizer)
      self.recognizer = nil
    }
  }
}
```

### Complete Android Kotlin Implementation

**File:** `android/src/main/java/expo/modules/sherpaonnx/ExpoSherpaOnnxModule.kt`

```kotlin
package expo.modules.sherpaonnx

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.k2fsa.sherpa.onnx.*

class ExpoSherpaOnnxModule : Module() {
  private var recognizer: OfflineRecognizer? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoSherpaOnnx")

    Function("initializeRecognizer") { modelPath: String, tokensPath: String, language: String ->
      initializeRecognizer(modelPath, tokensPath, language)
    }

    Function("recognizeAudio") { audioSamples: List<Double>, sampleRate: Int ->
      // Convert List<Double> to FloatArray
      val floatSamples = FloatArray(audioSamples.size) { audioSamples[it].toFloat() }
      recognizeAudio(floatSamples, sampleRate)
    }

    Function("release") {
      releaseRecognizer()
    }
  }

  private fun initializeRecognizer(modelPath: String, tokensPath: String, language: String): Boolean {
    try {
      // Create SenseVoice model config
      val senseVoiceConfig = OfflineSenseVoiceModelConfig(
        model = modelPath,
        language = language,
        useInverseTextNormalization = true  // Enable punctuation
      )

      // Create offline model config
      val modelConfig = OfflineModelConfig(
        tokens = tokensPath,
        numThreads = 2,
        debug = false,
        provider = "cpu",
        senseVoice = senseVoiceConfig
      )

      // Create recognizer config
      val config = OfflineRecognizerConfig(
        modelConfig = modelConfig,
        decodingMethod = "greedy_search"
      )

      // Initialize recognizer
      recognizer = OfflineRecognizer(config = config)

      return true
    } catch (e: Exception) {
      e.printStackTrace()
      return false
    }
  }

  private fun recognizeAudio(audioSamples: FloatArray, sampleRate: Int): String {
    val recognizer = this.recognizer ?: return ""

    try {
      // Create stream
      val stream = recognizer.createStream()

      // Accept waveform
      stream.acceptWaveform(audioSamples, sampleRate)

      // Decode
      recognizer.decode(stream)

      // Get result
      val result = recognizer.getResult(stream)

      // Release stream
      stream.release()

      return result.text
    } catch (e: Exception) {
      e.printStackTrace()
      return ""
    }
  }

  private fun releaseRecognizer() {
    recognizer?.release()
    recognizer = null
  }
}
```

### C API Example (Reference)

**Based on:** https://github.com/k2-fsa/sherpa-onnx/blob/master/c-api-examples/sense-voice-c-api.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "sherpa-onnx/c-api/c-api.h"

int32_t main() {
  const char *wav_filename = "./test.wav";
  const char *model_filename = "./model.int8.onnx";
  const char *tokens_filename = "./tokens.txt";
  const char *language = "auto";
  const char *provider = "cpu";
  int32_t use_inverse_text_normalization = 1;

  // Read audio file
  const SherpaOnnxWave *wave = SherpaOnnxReadWave(wav_filename);
  if (wave == NULL) {
    fprintf(stderr, "Failed to read %s\n", wav_filename);
    return -1;
  }

  // Configure SenseVoice
  SherpaOnnxOfflineSenseVoiceModelConfig sense_voice_config;
  memset(&sense_voice_config, 0, sizeof(sense_voice_config));
  sense_voice_config.model = model_filename;
  sense_voice_config.language = language;
  sense_voice_config.use_itn = use_inverse_text_normalization;

  // Configure offline model
  SherpaOnnxOfflineModelConfig offline_model_config;
  memset(&offline_model_config, 0, sizeof(offline_model_config));
  offline_model_config.debug = 1;
  offline_model_config.num_threads = 1;
  offline_model_config.provider = provider;
  offline_model_config.tokens = tokens_filename;
  offline_model_config.sense_voice = sense_voice_config;

  // Configure recognizer
  SherpaOnnxOfflineRecognizerConfig recognizer_config;
  memset(&recognizer_config, 0, sizeof(recognizer_config));
  recognizer_config.decoding_method = "greedy_search";
  recognizer_config.model_config = offline_model_config;

  // Create recognizer
  const SherpaOnnxOfflineRecognizer *recognizer =
    SherpaOnnxCreateOfflineRecognizer(&recognizer_config);

  if (recognizer == NULL) {
    fprintf(stderr, "Failed to create recognizer\n");
    SherpaOnnxFreeWave(wave);
    return -1;
  }

  // Create stream
  const SherpaOnnxOfflineStream *stream =
    SherpaOnnxCreateOfflineStream(recognizer);

  // Process audio
  SherpaOnnxAcceptWaveformOffline(stream, wave->sample_rate, wave->samples,
    wave->num_samples);
  SherpaOnnxDecodeOfflineStream(recognizer, stream);

  // Get result
  const SherpaOnnxOfflineRecognizerResult *result =
    SherpaOnnxGetOfflineStreamResult(stream);

  fprintf(stderr, "Decoded text: %s\n", result->text);

  // Cleanup
  SherpaOnnxDestroyOfflineRecognizerResult(result);
  SherpaOnnxDestroyOfflineStream(stream);
  SherpaOnnxDestroyOfflineRecognizer(recognizer);
  SherpaOnnxFreeWave(wave);

  return 0;
}
```

### Usage in React Native/Expo App

```typescript
import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import * as ExpoSherpaOnnx from 'expo-sherpa-onnx';
import { Audio } from 'expo-av';

export function useSherpaOnnx() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // Model paths (adjust based on your setup)
        const modelPath = `${FileSystem.documentDirectory}model.int8.onnx`;
        const tokensPath = `${FileSystem.documentDirectory}tokens.txt`;

        // Initialize recognizer
        const success = await ExpoSherpaOnnx.initializeRecognizer({
          modelPath,
          tokensPath,
          language: 'zh'  // or 'auto' for auto-detection
        });

        setInitialized(success);
      } catch (error) {
        console.error('Failed to initialize recognizer:', error);
      }
    }

    init();

    return () => {
      ExpoSherpaOnnx.release();
    };
  }, []);

  async function transcribe(audioUri: string): Promise<string> {
    if (!initialized) {
      throw new Error('Recognizer not initialized');
    }

    // Load audio file
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    const status = await sound.getStatusAsync();

    // Get audio samples (you'll need to implement this based on your audio format)
    // This is a simplified example - you'll need proper audio decoding
    const audioSamples = await loadAudioSamples(audioUri);

    // Transcribe
    const text = await ExpoSherpaOnnx.recognizeAudio(audioSamples, 16000);

    return text;
  }

  return { initialized, transcribe };
}

// Helper function (needs proper implementation)
async function loadAudioSamples(uri: string): Promise<Float32Array> {
  // TODO: Implement audio file reading and conversion to Float32Array
  // You may need a native module for this or use expo-av APIs
  return new Float32Array();
}
```

---

## Warnings and Known Issues

### General Warnings

1. **iOS Build Requirement**
   - No pre-built iOS frameworks available
   - Must build from source on macOS with Xcode
   - Build time: 10-30 minutes depending on machine
   - Build output: ~500MB

2. **Model Size Considerations**
   - SenseVoice-Small int8: 228 MB
   - SenseVoice-Small float32: 894 MB
   - Consider on-demand download vs. bundling in app
   - Apple App Store: 200MB download limit over cellular

3. **Memory Requirements**
   - Model loading: ~250-350 MB RAM
   - Processing overhead: ~100-200 MB
   - Recommendation: Test on lower-end devices (e.g., iPhone 8, Android 6GB RAM)

4. **Audio Format Requirements**
   - Sample rate: 16kHz (required by most models)
   - Format: Float32 PCM samples (-1.0 to 1.0 range)
   - Mono audio only (convert stereo to mono if needed)

### iOS-Specific Issues

1. **Bridging Header Setup**
   - Required for Swift to call C API
   - Path issues: ensure relative paths in podspec are correct
   - Multiple header errors: check for duplicate imports

2. **Framework Linking**
   - Use `s.vendored_frameworks` in podspec
   - Cannot traverse parent directories (..)
   - Must be relative to podspec file location

3. **CocoaPods Cache**
   - Clean pod cache if frameworks not linking: `pod cache clean --all`
   - Deintegrate and reinstall: `pod deintegrate && pod install`

4. **Simulator vs Device**
   - Some builds may be device-only (arm64)
   - Ensure xcframework includes x86_64 for simulator support

### Android-Specific Issues

1. **AAR Integration with Expo Modules**
   - Known issues: #27985, #37284 on expo/expo GitHub
   - Workaround: Use direct implementation dependency in build.gradle
   - Alternative: Use Maven Central dependency instead of local AAR

2. **ABI Conflicts**
   - Multiple ABIs in AAR: arm64-v8a, armeabi-v7a, x86_64, x86
   - Use `packagingOptions { pickFirst }` to resolve conflicts
   - Test on physical devices (arm64-v8a most common)

3. **ProGuard/R8**
   - Add keep rules for sherpa-onnx JNI classes:
   ```
   -keep class com.k2fsa.sherpa.onnx.** { *; }
   ```

4. **Native Library Loading**
   - JNI library: `libsherpa-onnx-jni.so`
   - Ensure System.loadLibrary("sherpa-onnx-jni") is called
   - Check logcat for "UnsatisfiedLinkError" errors

### Expo-Specific Considerations

1. **Expo Go Incompatibility**
   - Native modules NOT supported in Expo Go
   - Must use Development Build: `npx expo run:ios` / `npx expo run:android`

2. **Config Plugin**
   - May need custom config plugin for auto-linking
   - See: https://docs.expo.dev/config-plugins/introduction/

3. **EAS Build**
   - Ensure iOS build has macOS builder (for framework building)
   - Android: AAR should work without special configuration
   - May need to increase build timeout for iOS (framework build is slow)

### Performance Considerations

1. **First Inference Slowness**
   - First transcription takes 2-3x longer (model loading/optimization)
   - Solution: Warm up model on app start with dummy audio

2. **Battery Drain**
   - ASR is CPU-intensive
   - Recommendation: Warn users, optimize for short recordings
   - Consider VAD (Voice Activity Detection) to reduce processing time

3. **Threading**
   - SenseVoice blocks during inference
   - Run on background thread to avoid UI freezing
   - iOS: Use DispatchQueue.global()
   - Android: Use Kotlin coroutines

### Language Support Issues

1. **Chinese Language Variants**
   - "zh" may default to Mandarin
   - Cantonese: Use language="yue" or 2025-09-09 model
   - Test with your specific dialect/accent

2. **Punctuation**
   - Only with `use_itn=1` (inverse text normalization)
   - Not supported in 2025-09-09 Cantonese model
   - Quality varies by language

3. **Code-Switching**
   - Models support mixed languages (e.g., zh+en)
   - Use language="auto" for best results
   - May have lower accuracy than single-language mode

### Known Bugs

1. **Expo AAR Wrapping** (GitHub #27985, #37284)
   - Issue: .aar files in expo modules may not auto-link properly
   - Status: Open as of 2026-01-15
   - Workaround: Use Maven Central dependency or manual configuration

2. **iOS Xcode 15+ Build Warnings**
   - May see warnings about "Duplicate framework" with onnxruntime
   - Usually non-fatal, but verify final .app works on device

3. **Model Download Reliability**
   - GitHub releases may be slow or timeout
   - Consider hosting models on your own CDN
   - Implement retry logic with exponential backoff

### Testing Checklist

Before deploying:

- [ ] Test on real iOS device (not just simulator)
- [ ] Test on real Android device (arm64-v8a)
- [ ] Test with low-end devices (2GB RAM Android, iPhone 8)
- [ ] Test with long audio files (>30 seconds)
- [ ] Test with multiple languages (if using "auto")
- [ ] Test offline functionality (airplane mode)
- [ ] Test model download/initialization flow
- [ ] Test memory usage under repeated transcriptions
- [ ] Test app backgrounding/foregrounding behavior
- [ ] Test with noisy audio
- [ ] Measure battery drain during extended use

---

## Additional Resources

### Official Documentation
- **Sherpa-ONNX Docs:** https://k2-fsa.github.io/sherpa/onnx/index.html
- **GitHub Repository:** https://github.com/k2-fsa/sherpa-onnx
- **Pre-trained Models:** https://k2-fsa.github.io/sherpa/onnx/pretrained_models/index.html
- **C API Reference:** https://k2-fsa.github.io/sherpa/onnx/c-api/index.html
- **SenseVoice Documentation:** https://k2-fsa.github.io/sherpa/onnx/sense-voice/index.html

### Expo Resources
- **Native Module Tutorial:** https://docs.expo.dev/modules/native-module-tutorial/
- **Wrap Third-Party Libraries:** https://docs.expo.dev/modules/third-party-library/
- **Config Plugins:** https://docs.expo.dev/config-plugins/introduction/

### Community Examples
- **React Native TTS Wrapper:** https://github.com/kislay99/react-native-sherpa-onnx-offline-tts
- **iOS Swift Examples:** https://github.com/k2-fsa/sherpa-onnx/tree/master/ios-swift
- **Android Kotlin Examples:** https://github.com/k2-fsa/sherpa-onnx/tree/master/android

### Related Projects
- **SenseVoice Model:** https://github.com/FunAudioLLM/SenseVoice
- **SenseVoice on HuggingFace:** https://huggingface.co/FunAudioLLM/SenseVoiceSmall

---

## Quick Start Summary

**For iOS:**
1. Build sherpa-onnx: `./build-ios.sh`
2. Copy frameworks to Expo module
3. Update podspec with `vendored_frameworks`
4. Create Swift module with C API calls

**For Android:**
1. Download AAR: `sherpa-onnx-1.12.23.aar`
2. Place in `android/libs/` or use Gradle dependency
3. Update build.gradle
4. Create Kotlin module using `OfflineRecognizer` class

**For Model:**
1. Download SenseVoice-Small int8: 228 MB
2. Extract `model.int8.onnx` and `tokens.txt`
3. Bundle in assets or implement on-demand download

**Test:**
```typescript
await ExpoSherpaOnnx.initializeRecognizer({
  modelPath: '/path/to/model.int8.onnx',
  tokensPath: '/path/to/tokens.txt',
  language: 'zh'
});

const text = await ExpoSherpaOnnx.recognizeAudio(samples, 16000);
console.log('Transcription:', text);
```

---

**End of Research Document**

For questions or issues, refer to:
- Sherpa-ONNX Issues: https://github.com/k2-fsa/sherpa-onnx/issues
- Expo Forums: https://forums.expo.dev/
