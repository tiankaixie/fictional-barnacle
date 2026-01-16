/**
 * Input: Audio stream, OpenAI API client
 * Output: Transcription via @Published properties
 * Pos: Service wrapping OpenAI Whisper API for cloud-based speech recognition
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import AVFoundation
import Combine

@MainActor
class OpenAIWhisperService: ObservableObject {
    // MARK: - Published Properties

    @Published var isRecording = false
    @Published var liveTranscript = ""  // Kept for compatibility, won't update during recording
    @Published var error: String?
    @Published var isInitialized = false
    @Published var isProcessing = false
    @Published var hasValidAPIKey = false

    // MARK: - Private Properties

    private var apiClient: OpenAIAPIClient?
    private var audioEngine: AVAudioEngine?
    private var audioSamples: [Float] = []
    private var recordingStartTime: Date?
    private let sampleRate: Double = 16000.0
    private let keychainService = KeychainService()
    private let apiKeyKeychainKey = "app.openai.apikey"

    // MARK: - Initialization

    /// Initialize service and attempt to load API key from Keychain
    func initialize(retryCount: Int = 3) async throws {
        // Try to load API key from Keychain
        do {
            let data = try keychainService.retrieve(key: apiKeyKeychainKey)
            if let apiKey = String(data: data, encoding: .utf8) {
                apiClient = OpenAIAPIClient(apiKey: apiKey)

                // Validate key
                let isValid = await apiClient?.validateAPIKey() ?? false
                if isValid {
                    hasValidAPIKey = true
                    isInitialized = true
                    print("[OpenAIWhisper] Initialized with stored API key")
                    return
                }
            }
        } catch {
            print("[OpenAIWhisper] No API key found in Keychain")
        }

        // No valid API key
        hasValidAPIKey = false
        isInitialized = false
        throw OpenAIError.missingAPIKey
    }

    /// Set and validate API key
    func setAPIKey(_ key: String) async throws {
        guard key.hasPrefix("sk-") else {
            throw OpenAIError.invalidAPIKey
        }

        // Test API key
        let tempClient = OpenAIAPIClient(apiKey: key)
        let isValid = await tempClient.validateAPIKey()

        guard isValid else {
            throw OpenAIError.authenticationFailed
        }

        // Save to Keychain
        let data = key.data(using: .utf8)!
        try keychainService.save(key: apiKeyKeychainKey, value: data)

        // Update state
        apiClient = tempClient
        hasValidAPIKey = true
        isInitialized = true

        print("[OpenAIWhisper] API key saved and validated")
    }

    /// Remove API key from Keychain
    func removeAPIKey() throws {
        try keychainService.delete(key: apiKeyKeychainKey)
        apiClient = nil
        hasValidAPIKey = false
        isInitialized = false
        print("[OpenAIWhisper] API key removed")
    }

    // MARK: - Recording Methods

    /// Start recording audio
    func startRecording() async throws {
        guard apiClient != nil else {
            throw OpenAIError.missingAPIKey
        }

        try await setupAudioSession()
        isRecording = true
        audioSamples = []
        recordingStartTime = Date()
        liveTranscript = ""

        await startAudioCapture()
        print("[OpenAIWhisper] Started recording")
    }

    /// Stop recording and transcribe audio
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

        var finalTranscription = ""

        if !audioSamples.isEmpty, let apiClient = apiClient {
            do {
                print("[OpenAIWhisper] Processing \(audioSamples.count) samples...")
                isProcessing = true

                // Convert samples to M4A
                let tempURL = FileManager.default.temporaryDirectory
                    .appendingPathComponent(UUID().uuidString)
                    .appendingPathExtension("m4a")

                try await convertSamplesToM4A(audioSamples, to: tempURL)

                // Call OpenAI API with retry
                finalTranscription = try await transcribeWithRetry(
                    apiClient: apiClient,
                    fileURL: tempURL
                )

                // Clean up temp file
                try? FileManager.default.removeItem(at: tempURL)

                isProcessing = false
                print("[OpenAIWhisper] ✅ Transcription: \(finalTranscription)")

            } catch {
                isProcessing = false
                print("[OpenAIWhisper] Transcription error: \(error.localizedDescription)")
                self.error = error.localizedDescription
            }
        }

        let samplesForSaving = audioSamples
        audioSamples = []
        recordingStartTime = nil

        return (text: finalTranscription, duration: duration, samples: samplesForSaving)
    }

    // MARK: - Private Methods

    /// Transcribe audio file with retry logic
    private func transcribeWithRetry(apiClient: OpenAIAPIClient, fileURL: URL, maxRetries: Int = 3) async throws -> String {
        var lastError: Error?

        for attempt in 1...maxRetries {
            do {
                return try await apiClient.transcribe(fileURL: fileURL, language: "zh")
            } catch let error as OpenAIError {
                switch error {
                case .rateLimited(let retryAfter):
                    let waitTime = retryAfter ?? 2
                    print("[OpenAIWhisper] Rate limited, waiting \(waitTime)s...")
                    try? await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))

                case .authenticationFailed, .invalidAPIKey, .missingAPIKey:
                    throw error  // Don't retry auth errors

                default:
                    lastError = error
                }
            } catch {
                lastError = error
            }

            if attempt < maxRetries {
                try? await Task.sleep(nanoseconds: 2_000_000_000)
            }
        }

        throw lastError ?? OpenAIError.httpError(statusCode: -1)
    }

    /// Convert audio samples to M4A format
    private func convertSamplesToM4A(_ samples: [Float], to url: URL) async throws {
        let sourceFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: sampleRate,
            channels: 1,
            interleaved: false
        )!

        guard let pcmBuffer = AVAudioPCMBuffer(
            pcmFormat: sourceFormat,
            frameCapacity: UInt32(samples.count)
        ) else {
            throw OpenAIError.audioConversionFailed
        }

        pcmBuffer.frameLength = UInt32(samples.count)
        if let channelData = pcmBuffer.floatChannelData {
            channelData[0].update(from: samples, count: samples.count)
        }

        // Use low bitrate for API upload (32 kbps)
        let outputSettings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: sampleRate,
            AVNumberOfChannelsKey: 1,
            AVEncoderBitRateKey: 32000  // 32 kbps
        ]

        guard let audioFile = try? AVAudioFile(
            forWriting: url,
            settings: outputSettings,
            commonFormat: .pcmFormatFloat32,
            interleaved: false
        ) else {
            throw OpenAIError.audioConversionFailed
        }

        try audioFile.write(from: pcmBuffer)
    }

    // MARK: - Audio Capture (copied from WhisperKitService)

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

        // Convert to 16kHz mono format
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
            print("[OpenAIWhisper] Audio engine started")
        } catch {
            print("[OpenAIWhisper] Failed to start audio engine: \(error.localizedDescription)")
            self.error = "Failed to start audio engine: \(error.localizedDescription)"
        }
    }

    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) async {
        let audioArray = bufferToFloatArray(buffer)
        audioSamples.append(contentsOf: audioArray)
        print("[OpenAIWhisper] Collecting audio... (\(audioSamples.count) samples)")
    }

    private func bufferToFloatArray(_ buffer: AVAudioPCMBuffer) -> [Float] {
        guard let channelData = buffer.floatChannelData else { return [] }
        let frameLength = Int(buffer.frameLength)
        return Array(UnsafeBufferPointer(start: channelData[0], count: frameLength))
    }
}
