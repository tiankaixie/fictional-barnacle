# Example Usage: Accessing Bundled Models

## Native Module Example (Recommended)

Create a native module to access bundled model files from React Native:

### iOS (Swift)

```swift
// ios/Cebu/Modules/ModelLoader.swift

import Foundation
import ExpoModulesCore

public class ModelLoaderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ModelLoader")

    // Get model file path
    Function("getModelPath") { (filename: String) -> String? in
      let components = filename.components(separatedBy: ".")
      guard components.count == 2 else { return nil }

      let name = components[0]
      let ext = components[1]

      return Bundle.main.path(
        forResource: name,
        ofType: ext,
        inDirectory: "models"
      )
    }

    // Read model file
    AsyncFunction("readModelFile") { (filename: String) -> Data? in
      let components = filename.components(separatedBy: ".")
      guard components.count == 2 else { return nil }

      let name = components[0]
      let ext = components[1]

      guard let path = Bundle.main.path(
        forResource: name,
        ofType: ext,
        inDirectory: "models"
      ) else { return nil }

      return try? Data(contentsOf: URL(fileURLWithPath: path))
    }

    // Get all model files info
    Function("getModelInfo") -> [String: Any] in
      var info: [String: Any] = [:]

      let modelFiles = ["model.onnx", "tokens.txt", "config.json"]

      for file in modelFiles {
        let components = file.components(separatedBy: ".")
        guard components.count == 2 else { continue }

        let name = components[0]
        let ext = components[1]

        if let path = Bundle.main.path(
          forResource: name,
          ofType: ext,
          inDirectory: "models"
        ) {
          do {
            let attributes = try FileManager.default.attributesOfItem(atPath: path)
            let size = attributes[.size] as? Int64 ?? 0
            info[file] = [
              "path": path,
              "size": size,
              "exists": true
            ]
          } catch {
            info[file] = ["exists": false, "error": error.localizedDescription]
          }
        } else {
          info[file] = ["exists": false]
        }
      }

      return info
    }
  }
}
```

### Android (Kotlin)

```kotlin
// android/app/src/main/java/com/cebu/modules/ModelLoaderModule.kt

package com.cebu.modules

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.IOException

class ModelLoaderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ModelLoader")

    // Copy model from assets to cache and return path
    AsyncFunction("getModelPath") { filename: String ->
      val context = appContext.reactContext ?: return@AsyncFunction null

      try {
        // Copy from assets to cache
        val cacheFile = File(context.cacheDir, "models/$filename")
        cacheFile.parentFile?.mkdirs()

        if (!cacheFile.exists()) {
          context.assets.open("models/$filename").use { input ->
            cacheFile.outputStream().use { output ->
              input.copyTo(output)
            }
          }
        }

        cacheFile.absolutePath
      } catch (e: IOException) {
        null
      }
    }

    // Read model file from assets
    AsyncFunction("readModelFile") { filename: String ->
      val context = appContext.reactContext ?: return@AsyncFunction null

      try {
        context.assets.open("models/$filename").use { input ->
          input.readBytes()
        }
      } catch (e: IOException) {
        null
      }
    }

    // Get model info
    Function("getModelInfo") {
      val context = appContext.reactContext ?: return@Function emptyMap<String, Any>()
      val info = mutableMapOf<String, Any>()

      val modelFiles = arrayOf("model.onnx", "tokens.txt", "config.json")

      for (file in modelFiles) {
        try {
          val descriptor = context.assets.openFd("models/$file")
          info[file] = mapOf(
            "path" to "assets://models/$file",
            "size" to descriptor.length,
            "exists" to true
          )
          descriptor.close()
        } catch (e: IOException) {
          info[file] = mapOf("exists" to false)
        }
      }

      info
    }
  }
}
```

### TypeScript Interface

```typescript
// src/modules/ModelLoader.ts

import { requireNativeModule } from 'expo-modules-core';

interface ModelInfo {
  [filename: string]: {
    path?: string;
    size?: number;
    exists: boolean;
    error?: string;
  };
}

interface ModelLoaderModule {
  /**
   * Get the file system path to a model file
   * iOS: Returns path in app bundle
   * Android: Copies from assets to cache and returns cache path
   */
  getModelPath(filename: string): Promise<string | null>;

  /**
   * Read model file as binary data
   */
  readModelFile(filename: string): Promise<Uint8Array | null>;

  /**
   * Get information about all bundled models
   */
  getModelInfo(): ModelInfo;
}

const ModelLoader: ModelLoaderModule = requireNativeModule('ModelLoader');

export default ModelLoader;
```

### React Native Usage

```typescript
// Example: Load ONNX model with onnxruntime-react-native

import { useEffect, useState } from 'react';
import { InferenceSession } from 'onnxruntime-react-native';
import ModelLoader from './modules/ModelLoader';

export function useONNXModel() {
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModel();
  }, []);

  async function loadModel() {
    try {
      setLoading(true);

      // Get model path
      const modelPath = await ModelLoader.getModelPath('model.onnx');
      if (!modelPath) {
        throw new Error('Model file not found');
      }

      console.log('Loading model from:', modelPath);

      // Create inference session
      const inferenceSession = await InferenceSession.create(modelPath);
      setSession(inferenceSession);

      console.log('Model loaded successfully');
    } catch (err) {
      console.error('Failed to load model:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { session, loading, error };
}

// Example: Check model files are bundled correctly

export async function checkModels() {
  const info = ModelLoader.getModelInfo();

  console.log('Bundled Models:');
  for (const [filename, details] of Object.entries(info)) {
    if (details.exists) {
      const sizeMB = ((details.size || 0) / 1024 / 1024).toFixed(2);
      console.log(`✓ ${filename}: ${sizeMB} MB`);
      console.log(`  Path: ${details.path}`);
    } else {
      console.warn(`✗ ${filename}: Not found`);
      if (details.error) {
        console.warn(`  Error: ${details.error}`);
      }
    }
  }
}
```

## Direct File System Access (Alternative)

If you don't want to create a native module:

### iOS

Models are in the app bundle and can't be accessed directly via `expo-file-system`. You'll need a native module.

### Android

```typescript
import * as FileSystem from 'expo-file-system';

// Note: This won't work on Android because assets:// protocol
// is not supported by expo-file-system
// You need a native module to copy from assets to cache first

// After copying to cache via native module:
async function readModelFromCache() {
  const cacheDir = FileSystem.cacheDirectory;
  const modelPath = `${cacheDir}models/model.onnx`;

  const info = await FileSystem.getInfoAsync(modelPath);
  if (info.exists) {
    console.log('Model size:', info.size);
    // Use modelPath with inference engine
  }
}
```

## Testing Models are Bundled

Add this to your app's debug screen:

```typescript
import { Button, ScrollView, Text, View } from 'react-native';
import ModelLoader from './modules/ModelLoader';

export function DebugModelsScreen() {
  const [modelInfo, setModelInfo] = useState<any>(null);

  async function testModels() {
    console.log('Testing model files...');

    // Get info about all models
    const info = ModelLoader.getModelInfo();
    setModelInfo(info);

    // Try to get each model path
    for (const filename of ['model.onnx', 'tokens.txt', 'config.json']) {
      const path = await ModelLoader.getModelPath(filename);
      console.log(`${filename} path:`, path);
    }
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Test Models" onPress={testModels} />

      {modelInfo && (
        <ScrollView style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Model Files:</Text>
          {Object.entries(modelInfo).map(([filename, details]: [string, any]) => (
            <View key={filename} style={{ marginTop: 10 }}>
              <Text>{filename}</Text>
              <Text>  Exists: {details.exists ? '✓' : '✗'}</Text>
              {details.size && (
                <Text>  Size: {(details.size / 1024 / 1024).toFixed(2)} MB</Text>
              )}
              {details.path && (
                <Text style={{ fontSize: 10 }}>  Path: {details.path}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
```

## Common Issues

### Models not found at runtime

**iOS**: Check Xcode project
```bash
open ios/*.xcodeproj
# Build Phases > Copy Bundle Resources > Should list models
```

**Android**: Check assets directory
```bash
ls -la android/app/src/main/assets/models/
```

### "File not found" on iOS

Make sure the native module uses the correct bundle API:
```swift
Bundle.main.path(forResource: "model", ofType: "onnx", inDirectory: "models")
// NOT: Bundle.main.path(forResource: "models/model.onnx")
```

### Large app size

Models add ~150 MB to your app. Consider:
- Compressing models (ONNX quantization)
- Downloading models on first launch (not bundling)
- Using smaller models for mobile
