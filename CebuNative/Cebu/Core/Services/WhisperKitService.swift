/**
 * Input: Audio stream, WhisperKit framework
 * Output: Real-time transcription via @Published properties
 * Pos: Native service wrapping WhisperKit for on-device speech recognition
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import AVFoundation
import WhisperKit
import Combine

@MainActor
class WhisperKitService: ObservableObject {
    // MARK: - Published Properties
    @Published var isRecording = false
    @Published var liveTranscript = ""
    @Published var error: String?
    @Published var isInitialized = false
    @Published var downloadProgress: Double = 0.0
    @Published var isDownloading = false
    @Published var isProcessing = false
    @Published var currentAttempt = 1

    // MARK: - Private Properties
    private var whisperKit: WhisperKit?
    private var audioEngine: AVAudioEngine?
    private var transcriptionBuffer: String = ""
    private var recordingStartTime: Date?
    private var audioSamples: [Float] = []
    private let sampleRate: Double = 16000.0

    // MARK: - Public Methods

    /// Initialize WhisperKit with specified model (with retry and progress)
    func initialize(modelName: String = "base", retryCount: Int = 3) async throws {
        var lastError: Error?

        isDownloading = true
        downloadProgress = 0.0

        for attempt in 1...retryCount {
            currentAttempt = attempt

            do {
                print("[WhisperKit] Attempting to initialize with model: \(modelName) (attempt \(attempt)/\(retryCount))")

                // If this is a retry attempt, try to clear cache
                if attempt > 1 {
                    print("[WhisperKit] Retry detected, attempting to clear model cache...")
                    await clearModelCache()
                }

                // Initialize WhisperKit (no real progress available from API)
                whisperKit = try await WhisperKit(
                    model: modelName,
                    verbose: true,
                    logLevel: .debug
                )

                isInitialized = true
                isDownloading = false
                downloadProgress = 1.0
                print("[WhisperKit] ✅ Successfully initialized with model: \(modelName)")
                return
            } catch {
                lastError = error
                let errorMsg = error.localizedDescription
                print("[WhisperKit] ⚠️ Initialization error (attempt \(attempt)/\(retryCount)): \(errorMsg)")

                // If tokenizer error, force clean next attempt
                if errorMsg.contains("tokenizer") || errorMsg.contains("configuration") {
                    print("[WhisperKit] Detected tokenizer/config error, will force clean on next retry")
                }

                if attempt < retryCount {
                    // Wait 2 seconds before retrying
                    try? await Task.sleep(nanoseconds: 2_000_000_000)
                    downloadProgress = 0.0
                }
            }
        }

        // All retries failed
        isDownloading = false
        let errorMessage = "模型下载失败，请检查网络连接后重启应用"
        self.error = errorMessage
        print("[WhisperKit] ❌ All retry attempts failed")
        throw lastError ?? NSError(domain: "WhisperKit", code: -1, userInfo: [NSLocalizedDescriptionKey: errorMessage])
    }

    /// Clear model cache directory
    private func clearModelCache() async {
        let fileManager = FileManager.default
        let cacheDir = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first

        if let cacheURL = cacheDir {
            let possiblePaths = [
                cacheURL.appendingPathComponent("huggingface"),
                cacheURL.appendingPathComponent("whisperkit"),
                cacheURL.appendingPathComponent("models")
            ]

            for path in possiblePaths {
                if fileManager.fileExists(atPath: path.path) {
                    do {
                        try fileManager.removeItem(at: path)
                        print("[WhisperKit] Cleared cache at: \(path.path)")
                    } catch {
                        print("[WhisperKit] Failed to clear cache at \(path.path): \(error)")
                    }
                }
            }
        }
    }

    /// Start real-time transcription
    func startRecording() async throws {
        guard whisperKit != nil else {
            let error = NSError(domain: "WhisperKit", code: -1,
                              userInfo: [NSLocalizedDescriptionKey: "WhisperKit not initialized"])
            self.error = error.localizedDescription
            throw error
        }

        try await setupAudioSession()
        isRecording = true
        transcriptionBuffer = ""
        audioSamples = []
        recordingStartTime = Date()
        liveTranscript = ""

        // Start audio capture
        await startAudioCapture()

        print("[WhisperKit] Started recording")
    }

    /// Stop recording and return final transcription
    func stopRecording() async -> (text: String, duration: Double, samples: [Float]) {
        isRecording = false
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)

        let duration: Double
        if let startTime = recordingStartTime {
            duration = Date().timeIntervalSince(startTime) * 1000
        } else {
            duration = 0
        }

        // Perform final transcription with all collected audio
        var finalTranscription = ""

        if !audioSamples.isEmpty, let whisperKit = whisperKit {
            do {
                print("[WhisperKit] Processing \(audioSamples.count) samples...")
                isProcessing = true

                // Force Chinese language detection
                let results = try await whisperKit.transcribe(
                    audioArray: audioSamples,
                    decodeOptions: DecodingOptions(language: "zh")
                )

                isProcessing = false

                // Get the text from the results
                if let firstResult = results.first, !firstResult.text.isEmpty {
                    finalTranscription = firstResult.text
                    print("[WhisperKit] ✅ Final transcription (中文): \(finalTranscription)")
                }
            } catch {
                isProcessing = false
                print("[WhisperKit] Final transcription error: \(error.localizedDescription)")
                self.error = error.localizedDescription
            }
        }

        // Copy samples before clearing for potential audio file saving
        let samplesForSaving = audioSamples

        transcriptionBuffer = ""
        audioSamples = []
        recordingStartTime = nil

        return (text: finalTranscription, duration: duration, samples: samplesForSaving)
    }

    /// Get available WhisperKit models
    func getAvailableModels() -> [String] {
        return [
            "openai_whisper-tiny",
            "openai_whisper-tiny.en",
            "openai_whisper-base",
            "openai_whisper-base.en",
            "openai_whisper-small",
            "openai_whisper-small.en",
            "openai_whisper-medium",
            "openai_whisper-medium.en",
            "openai_whisper-large-v3",
            "openai_whisper-large-v3_turbo"
        ]
    }

    /// Check if a model is downloaded locally
    func isModelDownloaded(modelName: String) async -> Bool {
        guard whisperKit != nil else { return false }

        do {
            let models = try await WhisperKit.fetchAvailableModels()
            return models.contains(modelName)
        } catch {
            return false
        }
    }

    /// Download a specific model
    func downloadModel(modelName: String) async throws {
        do {
            let whisperKit = try await WhisperKit(model: modelName)
            self.whisperKit = whisperKit
            isInitialized = true

            print("[WhisperKit] Downloaded model: \(modelName)")
        } catch {
            print("[WhisperKit] Download error: \(error.localizedDescription)")
            self.error = error.localizedDescription
            throw error
        }
    }

    // MARK: - Private Methods (Core Audio Processing - 90% Reused from WhisperKitModule)

    private func setupAudioSession() async throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setActive(true)
    }

    private func startAudioCapture() async {
        audioEngine = AVAudioEngine()
        guard let audioEngine = audioEngine else { return }

        let inputNode = audioEngine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)

        // Convert to 16kHz mono format for WhisperKit
        let outputFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32,
                                        sampleRate: sampleRate,
                                        channels: 1,
                                        interleaved: false)!

        let converter = AVAudioConverter(from: inputFormat, to: outputFormat)!

        inputNode.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] buffer, time in
            guard let self = self else { return }

            Task { @MainActor in
                guard self.isRecording else { return }

                // Convert buffer to target format
                let capacity = AVAudioFrameCount(Double(buffer.frameLength) * self.sampleRate / inputFormat.sampleRate)
                guard let convertedBuffer = AVAudioPCMBuffer(pcmFormat: outputFormat, frameCapacity: capacity) else {
                    return
                }

                var error: NSError?
                let inputBlock: AVAudioConverterInputBlock = { inNumPackets, outStatus in
                    outStatus.pointee = .haveData
                    return buffer
                }

                converter.convert(to: convertedBuffer, error: &error, withInputFrom: inputBlock)

                if error == nil {
                    await self.processAudioBuffer(convertedBuffer)
                }
            }
        }

        do {
            try audioEngine.start()
            print("[WhisperKit] Audio engine started")
        } catch {
            print("[WhisperKit] Failed to start audio engine: \(error.localizedDescription)")
            self.error = "Failed to start audio engine: \(error.localizedDescription)"
        }
    }

    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) async {
        // Convert buffer to float array and accumulate
        let audioArray = bufferToFloatArray(buffer)
        audioSamples.append(contentsOf: audioArray)

        // No real-time transcription - just collect audio
        // Transcription will happen once when recording stops
        print("[WhisperKit] Collecting audio... (\(audioSamples.count) samples)")
    }

    private func bufferToFloatArray(_ buffer: AVAudioPCMBuffer) -> [Float] {
        guard let channelData = buffer.floatChannelData else { return [] }
        let frameLength = Int(buffer.frameLength)
        return Array(UnsafeBufferPointer(start: channelData[0], count: frameLength))
    }
}
