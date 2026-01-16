/**
 * Input: WhisperKitService, JournalListViewModel
 * Output: Recording state, transcription management
 * Pos: ViewModel managing voice recording and transcription
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import AVFoundation
import Combine

@MainActor
class RecordingViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var isRecording = false
    @Published var liveTranscript = ""
    @Published var error: String?
    @Published var permissionGranted = false
    @Published var isInitialized = false
    @Published var downloadProgress: Double = 0.0
    @Published var isDownloading = false
    @Published var isProcessing = false
    @Published var initializationAttempt = 1

    // MARK: - Private Properties
    private let whisperService: OpenAIWhisperService
    private let journalViewModel: JournalListViewModel
    private let audioStorageService: AudioStorageService
    private let costTrackingService: CostTrackingService
    private var cancellables = Set<AnyCancellable>()
    private var recordingStartTime: Date?

    // MARK: - Initialization

    init(whisperService: OpenAIWhisperService, journalViewModel: JournalListViewModel, audioStorageService: AudioStorageService, costTrackingService: CostTrackingService) {
        self.whisperService = whisperService
        self.journalViewModel = journalViewModel
        self.audioStorageService = audioStorageService
        self.costTrackingService = costTrackingService

        setupBindings()
    }

    // MARK: - Setup

    private func setupBindings() {
        // Bind WhisperKit state to this ViewModel
        whisperService.$isRecording
            .assign(to: &$isRecording)

        whisperService.$liveTranscript
            .assign(to: &$liveTranscript)

        whisperService.$error
            .compactMap { $0 }
            .assign(to: &$error)

        whisperService.$isInitialized
            .assign(to: &$isInitialized)

        whisperService.$isProcessing
            .assign(to: &$isProcessing)
    }

    // MARK: - Public Methods

    /// Initialize OpenAI Whisper service
    func initialize() async {
        do {
            try await whisperService.initialize()
            print("[RecordingVM] Initialized OpenAI Whisper service")
        } catch {
            self.error = "Failed to initialize: \(error.localizedDescription)"
            print("[RecordingVM] Init error: \(error)")
        }
    }

    /// Check microphone permission
    func checkPermission() async -> Bool {
        let status = AVAudioSession.sharedInstance().recordPermission

        switch status {
        case .granted:
            permissionGranted = true
            return true

        case .denied:
            permissionGranted = false
            error = "Microphone access denied. Please enable in Settings."
            return false

        case .undetermined:
            permissionGranted = await withCheckedContinuation { continuation in
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    continuation.resume(returning: granted)
                }
            }
            if !permissionGranted {
                error = "Microphone access is required for recording."
            }
            return permissionGranted

        @unknown default:
            permissionGranted = false
            return false
        }
    }

    /// Start recording
    func startRecording() async {
        // Check permission first
        guard await checkPermission() else {
            return
        }

        // Initialize if needed
        if !isInitialized {
            await initialize()
        }

        guard isInitialized else {
            error = "WhisperKit not initialized"
            return
        }

        do {
            recordingStartTime = Date()
            try await whisperService.startRecording()
            print("[RecordingVM] Started recording")
        } catch {
            self.error = "Failed to start recording: \(error.localizedDescription)"
            print("[RecordingVM] Start error: \(error)")
        }
    }

    /// Stop recording and save transcription
    func stopRecording() async {
        // Note: isRecording will be set to false immediately when overlay dismisses
        // but isProcessing will be true during transcription
        let result = await whisperService.stopRecording()

        // Calculate duration
        let duration: Int
        if let startTime = recordingStartTime {
            duration = Int(Date().timeIntervalSince(startTime) * 1000)
        } else {
            duration = Int(result.duration)
        }

        // Save transcription if not empty
        if !result.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let block = await journalViewModel.addTranscription(
                result.text,
                audioDuration: duration
            )

            print("[RecordingVM] Saved transcription: \(result.text.prefix(50))...")

            // Save audio file if enabled and samples exist
            if audioStorageService.saveAudioEnabled, !result.samples.isEmpty {
                do {
                    print("[RecordingVM] Saving audio file (\(result.samples.count) samples)...")
                    let audioInfo = try await audioStorageService.saveAudio(
                        result.samples,
                        for: block,
                        sampleRate: 16000.0
                    )

                    // Update block with audio metadata
                    await journalViewModel.updateBlockAudioMetadata(
                        block,
                        path: audioInfo.path,
                        size: audioInfo.size,
                        format: audioInfo.format
                    )

                    print("[RecordingVM] ✅ Audio saved: \(audioInfo.path) (\(audioInfo.size) bytes)")
                } catch {
                    print("[RecordingVM] ⚠️ Audio save failed: \(error.localizedDescription)")
                    self.error = "音频保存失败: \(error.localizedDescription)"
                    // Continue - text is already saved
                }
            } else {
                print("[RecordingVM] Audio saving disabled or no samples")
            }

            // Record transcription cost
            let durationInSeconds = Double(duration) / 1000.0
            do {
                try await costTrackingService.recordTranscription(
                    duration: durationInSeconds,
                    provider: "openai-whisper"
                )
                print("[RecordingVM] ✅ Cost recorded: \(durationInSeconds)s")
            } catch {
                print("[RecordingVM] ⚠️ Cost tracking failed: \(error.localizedDescription)")
                // Don't show error to user - cost tracking failure shouldn't block transcription
            }
        } else {
            print("[RecordingVM] Empty transcription, not saving")
        }

        // Reset state
        recordingStartTime = nil
        liveTranscript = ""
    }

    /// Cancel recording without saving
    func cancelRecording() async {
        _ = await whisperService.stopRecording()

        // Reset state
        recordingStartTime = nil
        liveTranscript = ""

        print("[RecordingVM] Cancelled recording")
    }

    /// Get available models
    func getAvailableModels() -> [String] {
        whisperService.getAvailableModels()
    }

    /// Change model
    func changeModel(to modelName: String) async {
        do {
            try await whisperService.downloadModel(modelName: modelName)
            print("[RecordingVM] Changed to model: \(modelName)")
        } catch {
            self.error = "Failed to change model: \(error.localizedDescription)"
            print("[RecordingVM] Model change error: \(error)")
        }
    }
}
