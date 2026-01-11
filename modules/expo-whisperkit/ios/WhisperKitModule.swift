/**
 * Input: Audio stream, WhisperKit framework
 * Output: Real-time transcription events to JavaScript
 * Pos: Native iOS module wrapping WhisperKit for on-device speech recognition
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import ExpoModulesCore
import AVFoundation
import WhisperKit

public class WhisperKitModule: Module {
    private var whisperKit: WhisperKit?
    private var audioEngine: AVAudioEngine?
    private var isRecording = false
    private var transcriptionBuffer: String = ""
    private var recordingStartTime: Date?
    private var audioSamples: [Float] = []
    private let sampleRate: Double = 16000.0

    public func definition() -> ModuleDefinition {
        Name("WhisperKit")

        Events(
            "onTranscriptionUpdate",
            "onRecordingStateChange",
            "onModelLoadProgress",
            "onError"
        )

        // Initialize WhisperKit with specified model
        AsyncFunction("initialize") { (modelName: String?) -> Bool in
            do {
                let model = modelName ?? "base"

                // Initialize WhisperKit with the specified model
                self.whisperKit = try await WhisperKit(model: model)

                print("[WhisperKit] Initialized with model: \(model)")
                return true
            } catch {
                print("[WhisperKit] Initialization error: \(error.localizedDescription)")
                self.sendEvent("onError", ["message": error.localizedDescription])
                return false
            }
        }

        // Start real-time transcription
        AsyncFunction("startRecording") { () -> Bool in
            do {
                guard self.whisperKit != nil else {
                    throw NSError(domain: "WhisperKit", code: -1, userInfo: [NSLocalizedDescriptionKey: "WhisperKit not initialized"])
                }

                try await self.setupAudioSession()
                self.isRecording = true
                self.transcriptionBuffer = ""
                self.audioSamples = []
                self.recordingStartTime = Date()
                self.sendEvent("onRecordingStateChange", ["isRecording": true])

                // Start audio capture
                await self.startAudioCapture()

                print("[WhisperKit] Started recording")
                return true
            } catch {
                print("[WhisperKit] Start recording error: \(error.localizedDescription)")
                self.sendEvent("onError", ["message": error.localizedDescription])
                return false
            }
        }

        // Stop recording and return final transcription
        AsyncFunction("stopRecording") { () -> [String: Any] in
            self.isRecording = false
            self.audioEngine?.stop()
            self.audioEngine?.inputNode.removeTap(onBus: 0)
            self.sendEvent("onRecordingStateChange", ["isRecording": false])

            let duration: Double
            if let startTime = self.recordingStartTime {
                duration = Date().timeIntervalSince(startTime) * 1000
            } else {
                duration = 0
            }

            // Perform final transcription with all collected audio
            var finalTranscription = self.transcriptionBuffer

            if !self.audioSamples.isEmpty, let whisperKit = self.whisperKit {
                do {
                    let results = try await whisperKit.transcribe(audioArray: self.audioSamples)
                    // Combine all transcription results
                    finalTranscription = results.map { $0.text }.joined(separator: " ")
                } catch {
                    print("[WhisperKit] Final transcription error: \(error.localizedDescription)")
                }
            }

            self.transcriptionBuffer = ""
            self.audioSamples = []
            self.recordingStartTime = nil

            print("[WhisperKit] Stopped recording, final text: \(finalTranscription)")

            return [
                "text": finalTranscription,
                "duration": duration
            ]
        }

        // Get available WhisperKit models
        Function("getAvailableModels") { () -> [String] in
            return ["tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en", "large-v3"]
        }

        // Check if a model is downloaded locally
        AsyncFunction("isModelDownloaded") { (modelName: String) -> Bool in
            guard let whisperKit = self.whisperKit else { return false }

            do {
              let models = try await WhisperKit.fetchAvailableModels()
                return models.contains(modelName)
            } catch {
                return false
            }
        }

        // Download a specific model
        AsyncFunction("downloadModel") { (modelName: String) -> Bool in
            do {
                // Download model from default Hugging Face repository
                // WhisperKit will automatically download from the default model repo
                let whisperKit = try await WhisperKit(model: modelName)
                self.whisperKit = whisperKit

                print("[WhisperKit] Downloaded model: \(modelName)")
                return true
            } catch {
                print("[WhisperKit] Download error: \(error.localizedDescription)")
                self.sendEvent("onError", ["message": error.localizedDescription])
                return false
            }
        }
    }

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
            guard let self = self, self.isRecording else { return }

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
                Task {
                    await self.processAudioBuffer(convertedBuffer)
                }
            }
        }

        do {
            try audioEngine.start()
            print("[WhisperKit] Audio engine started")
        } catch {
            print("[WhisperKit] Failed to start audio engine: \(error.localizedDescription)")
            sendEvent("onError", ["message": "Failed to start audio engine: \(error.localizedDescription)"])
        }
    }

    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) async {
        guard let whisperKit = whisperKit else { return }

        // Convert buffer to float array
        let audioArray = bufferToFloatArray(buffer)
        audioSamples.append(contentsOf: audioArray)

        // Process audio in chunks for real-time feedback
        // Transcribe every ~3 seconds of audio
        let chunkSize = Int(sampleRate * 3.0)

        if audioSamples.count >= chunkSize {
            let chunk = Array(audioSamples.prefix(chunkSize))

            do {
                let results = try await whisperKit.transcribe(audioArray: chunk)

                if !results.isEmpty {
                    let text = results.map { $0.text }.joined(separator: " ")

                    if !text.isEmpty {
                        transcriptionBuffer = text

                        DispatchQueue.main.async {
                            self.sendEvent("onTranscriptionUpdate", [
                                "text": text,
                                "fullText": self.transcriptionBuffer,
                                "isFinal": false
                            ])
                        }

                        print("[WhisperKit] Transcribed: \(text)")
                    }
                }
            } catch {
                print("[WhisperKit] Transcription error: \(error.localizedDescription)")
            }
        }
    }

    private func bufferToFloatArray(_ buffer: AVAudioPCMBuffer) -> [Float] {
        guard let channelData = buffer.floatChannelData else { return [] }
        let frameLength = Int(buffer.frameLength)
        return Array(UnsafeBufferPointer(start: channelData[0], count: frameLength))
    }
}
