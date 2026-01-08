/**
 * Input: Audio stream, WhisperKit framework
 * Output: Real-time transcription events to JavaScript
 * Pos: Native iOS module wrapping WhisperKit for on-device speech recognition
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import ExpoModulesCore
import AVFoundation
// Note: WhisperKit needs to be added via Swift Package Manager
// import WhisperKit

public class WhisperKitModule: Module {
    private var audioEngine: AVAudioEngine?
    private var isRecording = false
    private var transcriptionBuffer: String = ""
    private var recordingStartTime: Date?

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
                // TODO: Initialize WhisperKit
                // let config = WhisperKitConfig(model: modelName ?? "base.en")
                // self.whisperKit = try await WhisperKit(config)
                return true
            } catch {
                self.sendEvent("onError", ["message": error.localizedDescription])
                return false
            }
        }

        // Start real-time transcription
        AsyncFunction("startRecording") { () -> Bool in
            do {
                try await self.setupAudioSession()
                self.isRecording = true
                self.transcriptionBuffer = ""
                self.recordingStartTime = Date()
                self.sendEvent("onRecordingStateChange", ["isRecording": true])

                // Start audio capture
                await self.startAudioCapture()
                return true
            } catch {
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

            let finalTranscription = self.transcriptionBuffer
            self.transcriptionBuffer = ""
            self.recordingStartTime = nil

            return [
                "text": finalTranscription,
                "duration": duration
            ]
        }

        // Get available WhisperKit models
        Function("getAvailableModels") { () -> [String] in
            return ["tiny.en", "base.en", "small.en", "medium.en", "large-v3"]
        }

        // Check if a model is downloaded locally
        AsyncFunction("isModelDownloaded") { (modelName: String) -> Bool in
            // TODO: Check if model files exist in local storage
            return false
        }

        // Download a specific model
        AsyncFunction("downloadModel") { (modelName: String) -> Bool in
            do {
                // TODO: Download model with progress reporting
                // try await WhisperKit.download(variant: modelName) { progress in
                //     self.sendEvent("onModelLoadProgress", [
                //         "progress": progress,
                //         "model": modelName
                //     ])
                // }
                return true
            } catch {
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
        let format = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, time in
            guard let self = self, self.isRecording else { return }

            Task {
                await self.processAudioBuffer(buffer)
            }
        }

        do {
            try audioEngine.start()
        } catch {
            sendEvent("onError", ["message": "Failed to start audio engine: \(error.localizedDescription)"])
        }
    }

    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) async {
        // TODO: Process audio through WhisperKit
        // guard let whisperKit = whisperKit else { return }
        //
        // let audioArray = bufferToFloatArray(buffer)
        // let result = try await whisperKit.transcribe(audioArray: audioArray)
        //
        // if let text = result?.text, !text.isEmpty {
        //     transcriptionBuffer += text
        //     sendEvent("onTranscriptionUpdate", [
        //         "text": text,
        //         "fullText": transcriptionBuffer,
        //         "isFinal": false
        //     ])
        // }

        // For now, emit a placeholder event
        // This will be replaced with actual WhisperKit transcription
    }

    private func bufferToFloatArray(_ buffer: AVAudioPCMBuffer) -> [Float] {
        guard let channelData = buffer.floatChannelData else { return [] }
        let frameLength = Int(buffer.frameLength)
        return Array(UnsafeBufferPointer(start: channelData[0], count: frameLength))
    }
}
