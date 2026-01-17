/**
 * Input: Expo Modules API, sherpa-onnx Android
 * Output: Android implementation of SenseVoice ASR
 * Pos: Native Android bridge for SenseVoice recognition
 */

package expo.modules.sensevoiceasr

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.k2fsa.sherpa.onnx.*
import android.util.Log

class ExpoSenseVoiceASRModule : Module() {
  private var recognizer: OfflineRecognizer? = null
  private var isInitialized = false
  private var modelPath: String? = null

  companion object {
    private const val TAG = "ExpoSenseVoiceASR"
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoSenseVoiceASR")

    /**
     * Initialize the SenseVoice recognizer
     */
    AsyncFunction("initialize") { config: Map<String, Any?>, promise: Promise ->
      try {
        val modelPathStr = config["modelPath"] as? String
          ?: throw IllegalArgumentException("modelPath is required")

        val numThreads = (config["numThreads"] as? Number)?.toInt() ?: 2
        val debug = config["debug"] as? Boolean ?: false

        // Create recognizer config for SenseVoice
        val recognizerConfig = OfflineRecognizerConfig(
          featConfig = FeatureConfig(
            sampleRate = 16000,
            featureDim = 80
          ),
          modelConfig = OfflineModelConfig(
            senseVoice = OfflineSenseVoiceModelConfig(
              model = modelPathStr,
              useInverseTextNormalization = true,
              language = "zh" // Chinese
            ),
            tokens = "$modelPathStr/tokens.txt",
            numThreads = numThreads,
            debug = debug,
            provider = "cpu",
            modelType = "sense-voice"
          )
        )

        // Create recognizer
        recognizer = OfflineRecognizer(recognizerConfig)
        isInitialized = true
        modelPath = modelPathStr

        Log.i(TAG, "SenseVoice recognizer initialized with model: $modelPathStr")
        promise.resolve(null)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to initialize recognizer", e)
        promise.reject("INIT_ERROR", "Failed to initialize: ${e.message}", e)
      }
    }

    /**
     * Recognize audio samples
     */
    AsyncFunction("recognize") { samples: FloatArray, promise: Promise ->
      try {
        if (!isInitialized || recognizer == null) {
          throw IllegalStateException("Recognizer not initialized")
        }

        val stream = recognizer!!.createStream()
        stream.acceptWaveform(samples, sampleRate = 16000)

        // Decode
        recognizer!!.decode(stream)

        val result = recognizer!!.getResult(stream)
        stream.release()

        val resultMap = mapOf(
          "text" to result.text,
          "language" to (result.json ?: "").substringAfter("\"language\":\"").substringBefore("\""),
          "emotion" to (result.json ?: "").substringAfter("\"emotion\":\"").substringBefore("\""),
          "event" to (result.json ?: "").substringAfter("\"event\":\"").substringBefore("\""),
          "confidence" to 1.0 // sherpa-onnx doesn't provide confidence
        )

        Log.d(TAG, "Recognition result: ${result.text}")
        promise.resolve(resultMap)
      } catch (e: Exception) {
        Log.e(TAG, "Recognition failed", e)
        promise.reject("RECOGNITION_ERROR", "Recognition failed: ${e.message}", e)
      }
    }

    /**
     * Get module status
     */
    AsyncFunction("getStatus") { promise: Promise ->
      val status = mapOf(
        "isInitialized" to isInitialized,
        "modelPath" to modelPath
      )
      promise.resolve(status)
    }

    /**
     * Release resources
     */
    AsyncFunction("release") { promise: Promise ->
      try {
        recognizer?.release()
        recognizer = null
        isInitialized = false
        modelPath = null

        Log.i(TAG, "Recognizer released")
        promise.resolve(null)
      } catch (e: Exception) {
        Log.e(TAG, "Failed to release recognizer", e)
        promise.reject("RELEASE_ERROR", "Failed to release: ${e.message}", e)
      }
    }
  }
}
