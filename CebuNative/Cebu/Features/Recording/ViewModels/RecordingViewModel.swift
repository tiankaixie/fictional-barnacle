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
    private let whisperService: WhisperKitService
    private let journalViewModel: JournalListViewModel
    private var cancellables = Set<AnyCancellable>()
    private var recordingStartTime: Date?

    // MARK: - Initialization

    init(whisperService: WhisperKitService, journalViewModel: JournalListViewModel) {
        self.whisperService = whisperService
        self.journalViewModel = journalViewModel

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

        whisperService.$downloadProgress
            .assign(to: &$downloadProgress)

        whisperService.$isDownloading
            .assign(to: &$isDownloading)

        whisperService.$isProcessing
            .assign(to: &$isProcessing)

        whisperService.$currentAttempt
            .assign(to: &$initializationAttempt)
    }

    // MARK: - Public Methods

    /// Initialize WhisperKit with specified model
    func initialize(modelName: String = "openai_whisper-large-v3_turbo") async {
        do {
            try await whisperService.initialize(modelName: modelName)
            print("[RecordingVM] Initialized WhisperKit with '\(modelName)' model")
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
            await journalViewModel.addTranscription(
                result.text,
                audioDuration: duration
            )

            print("[RecordingVM] Saved transcription: \(result.text.prefix(50))...")
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
