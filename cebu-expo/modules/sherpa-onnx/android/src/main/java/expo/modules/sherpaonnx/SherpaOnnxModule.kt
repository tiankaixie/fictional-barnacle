package expo.modules.sherpaonnx

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.util.Log

// This module requires the sherpa-onnx Android library (AAR) to be integrated
// We'll need to download and link it separately

class SherpaOnnxModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describe the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api/ for more details about available components.

  private var recognizer: Long = 0 // Pointer to native recognizer object

  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module.
    Name("SherpaOnnx")

    // Defines a JavaScript function that always runs on the UI thread.
    Function("initialize") { config: Map<String, Any?> ->
      val modelPath = config["modelPath"] as? String ?: ""
      val tokensPath = config["tokensPath"] as? String ?: ""
      val numThreads = config["numThreads"] as? Int ?: 4
      val sampleRate = config["sampleRate"] as? Int ?: 16000
      val featureDim = config["featureDim"] as? Int ?: 80
      val debug = config["debug"] as? Boolean ?: false

      // TODO: Initialize sherpa-onnx recognizer
      // This requires integrating the sherpa-onnx Android library
      Log.d(TAG, "Initialize called with model: $modelPath")

      // For now, we'll add a placeholder
      // In the actual implementation, we need to:
      // 1. Load the ONNX model from assets
      // 2. Create the recognizer with SherpaOnnxOfflineRecognizer
      // 3. Store the recognizer reference

      throw UnsupportedOperationException("SherpaOnnx Android implementation pending - requires sherpa-onnx library integration")
    }

    AsyncFunction("decode") { samples: List<Float> ->
      // Convert samples to FloatArray and run recognition
      // TODO: Implement actual recognition
      Log.d(TAG, "Decode called with ${samples.size} samples")

      throw UnsupportedOperationException("SherpaOnnx Android decode pending")
    }

    Function("reset") {
      // Reset the recognizer state
      Log.d(TAG, "Reset called")
    }

    Function("release") {
      // Release recognizer resources
      Log.d(TAG, "Release called")
      if (recognizer != 0L) {
        // TODO: Call native destroy method
        recognizer = 0
      }
    }
  }

  companion object {
    private const val TAG = "SherpaOnnxModule"
  }
}
