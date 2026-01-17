/**
 * Input: Expo Modules API, sherpa-onnx iOS
 * Output: iOS implementation of SenseVoice ASR
 * Pos: Native iOS bridge for SenseVoice recognition
 */

import ExpoModulesCore
import sherpa_onnx

public class ExpoSenseVoiceASRModule: Module {
  private var recognizer: SherpaOnnxOfflineRecognizer?
  private var isInitialized = false
  private var modelPath: String?

  public func definition() -> ModuleDefinition {
    Name("ExpoSenseVoiceASR")

    /**
     * Initialize the SenseVoice recognizer
     */
    AsyncFunction("initialize") { (config: [String: Any], promise: Promise) in
      guard let modelPathStr = config["modelPath"] as? String else {
        promise.reject("INIT_ERROR", "modelPath is required")
        return
      }

      let numThreads = config["numThreads"] as? Int ?? 2
      let debug = config["debug"] as? Bool ?? false

      do {
        // Create SenseVoice config
        var senseVoiceConfig = sherpaOnnxOfflineSenseVoiceModelConfig()
        senseVoiceConfig.model = (modelPathStr as NSString).utf8String
        senseVoiceConfig.use_itn = 1
        senseVoiceConfig.language = ("zh" as NSString).utf8String

        // Create model config
        var modelConfig = sherpaOnnxOfflineModelConfig()
        modelConfig.sense_voice = senseVoiceConfig
        modelConfig.tokens = ("\(modelPathStr)/tokens.txt" as NSString).utf8String
        modelConfig.num_threads = Int32(numThreads)
        modelConfig.debug = debug ? 1 : 0
        modelConfig.provider = ("cpu" as NSString).utf8String
        modelConfig.model_type = ("sense-voice" as NSString).utf8String

        // Create feature config
        var featConfig = sherpaOnnxFeatureConfig()
        featConfig.sample_rate = 16000
        featConfig.feature_dim = 80

        // Create recognizer config
        var recognizerConfig = sherpaOnnxOfflineRecognizerConfig()
        recognizerConfig.model_config = modelConfig
        recognizerConfig.feat_config = featConfig

        // Create recognizer
        recognizer = SherpaOnnxOfflineRecognizer(config: &recognizerConfig)

        guard recognizer != nil else {
          promise.reject("INIT_ERROR", "Failed to create recognizer")
          return
        }

        isInitialized = true
        self.modelPath = modelPathStr

        print("[ExpoSenseVoiceASR] Initialized with model: \(modelPathStr)")
        promise.resolve(nil)
      } catch {
        promise.reject("INIT_ERROR", "Failed to initialize: \(error.localizedDescription)")
      }
    }

    /**
     * Recognize audio samples
     */
    AsyncFunction("recognize") { (samples: [Float], promise: Promise) in
      guard isInitialized, let recognizer = recognizer else {
        promise.reject("NOT_INITIALIZED", "Recognizer not initialized")
        return
      }

      do {
        let stream = recognizer.createStream()
        stream.acceptWaveform(sampleRate: 16000, samples: samples)
        recognizer.decode(stream: stream)

        let result = recognizer.getResult(stream: stream)

        // Parse JSON for language, emotion, event
        var language = ""
        var emotion = ""
        var event = ""

        if let json = result.json {
          // Simple parsing - production should use JSONDecoder
          if let languageRange = json.range(of: "\"language\":\""), let endRange = json[languageRange.upperBound...].range(of: "\"") {
            language = String(json[languageRange.upperBound..<endRange.lowerBound])
          }
          if let emotionRange = json.range(of: "\"emotion\":\""), let endRange = json[emotionRange.upperBound...].range(of: "\"") {
            emotion = String(json[emotionRange.upperBound..<endRange.lowerBound])
          }
          if let eventRange = json.range(of: "\"event\":\""), let endRange = json[eventRange.upperBound...].range(of: "\"") {
            event = String(json[eventRange.upperBound..<endRange.lowerBound])
          }
        }

        let resultDict: [String: Any] = [
          "text": result.text,
          "language": language,
          "emotion": emotion,
          "event": event,
          "confidence": 1.0
        ]

        print("[ExpoSenseVoiceASR] Recognition result: \(result.text)")
        promise.resolve(resultDict)
      } catch {
        promise.reject("RECOGNITION_ERROR", "Recognition failed: \(error.localizedDescription)")
      }
    }

    /**
     * Get module status
     */
    AsyncFunction("getStatus") { (promise: Promise) in
      let status: [String: Any?] = [
        "isInitialized": isInitialized,
        "modelPath": modelPath
      ]
      promise.resolve(status)
    }

    /**
     * Release resources
     */
    AsyncFunction("release") { (promise: Promise) in
      recognizer = nil
      isInitialized = false
      modelPath = nil

      print("[ExpoSenseVoiceASR] Recognizer released")
      promise.resolve(nil)
    }
  }
}
