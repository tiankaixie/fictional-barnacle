/**
 * Input: Audio file path from TranscriptionBlock
 * Output: Playback controls, progress updates via @Published properties
 * Pos: Service managing audio playback with AVPlayer
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import AVFoundation
import Combine

@MainActor
class AudioPlaybackService: ObservableObject {
    // MARK: - Published Properties
    @Published var isPlaying = false
    @Published var currentTime: Double = 0.0
    @Published var duration: Double = 0.0
    @Published var currentBlockId: UUID?
    @Published var error: String?

    // MARK: - Private Properties
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var statusObserver: AnyCancellable?
    private var endObserver: NSObjectProtocol?

    // MARK: - Initialization

    init() {
        setupAudioSession()
    }

    deinit {
        // Cleanup synchronously in deinit (cannot use await)
        if let timeObserver = timeObserver {
            player?.removeTimeObserver(timeObserver)
        }
        if let endObserver = endObserver {
            NotificationCenter.default.removeObserver(endObserver)
        }
        statusObserver?.cancel()
        player = nil
    }

    // MARK: - Public Methods

    /// Play audio for a specific transcription block
    func play(block: TranscriptionBlock) async throws {
        guard let audioPath = block.audioFilePath else {
            throw PlaybackError.noAudioFile
        }

        // Get base directory
        guard let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw PlaybackError.invalidPath
        }

        let fileURL = documentsURL.appendingPathComponent(audioPath)

        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            throw PlaybackError.fileNotFound
        }

        // Stop current playback if any
        await stop()

        // Create new player
        currentBlockId = block.id
        let playerItem = AVPlayerItem(url: fileURL)
        player = AVPlayer(playerItem: playerItem)

        // Wait for item to be ready
        try await waitForPlayerReady(playerItem)

        // Get duration
        if let itemDuration = playerItem.asset.duration.seconds, itemDuration.isFinite {
            duration = itemDuration
        } else {
            duration = 0
        }

        // Add observers
        addTimeObserver()
        addStatusObserver()
        addEndObserver()

        // Start playback
        player?.play()
        isPlaying = true

        print("[AudioPlayback] Started playing: \(audioPath)")
    }

    /// Pause playback
    func pause() {
        player?.pause()
        isPlaying = false
        print("[AudioPlayback] Paused")
    }

    /// Resume playback
    func resume() {
        player?.play()
        isPlaying = true
        print("[AudioPlayback] Resumed")
    }

    /// Stop playback completely
    func stop() async {
        player?.pause()
        player = nil
        isPlaying = false
        currentTime = 0.0
        duration = 0.0
        currentBlockId = nil
        removeObservers()
        print("[AudioPlayback] Stopped")
    }

    /// Seek to specific time
    func seek(to time: Double) {
        guard let player = player, time >= 0, time <= duration else { return }

        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player.seek(to: cmTime) { [weak self] finished in
            if finished {
                Task { @MainActor in
                    self?.currentTime = time
                }
            }
        }
        print("[AudioPlayback] Seeked to: \(time)s")
    }

    /// Toggle play/pause
    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            resume()
        }
    }

    // MARK: - Private Methods

    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default)
            try session.setActive(true)
            print("[AudioPlayback] Audio session configured")
        } catch {
            print("[AudioPlayback] Failed to configure audio session: \(error)")
            self.error = "音频会话配置失败: \(error.localizedDescription)"
        }
    }

    private func waitForPlayerReady(_ item: AVPlayerItem) async throws {
        // Wait for status to be ready
        let status = item.status

        switch status {
        case .readyToPlay:
            return
        case .failed:
            throw PlaybackError.playerFailed
        case .unknown:
            // Wait a bit for status to update
            try await Task.sleep(nanoseconds: 100_000_000) // 100ms
            if item.status != .readyToPlay {
                throw PlaybackError.playerFailed
            }
        @unknown default:
            throw PlaybackError.playerFailed
        }
    }

    private func addTimeObserver() {
        guard let player = player else { return }

        let interval = CMTime(seconds: 0.1, preferredTimescale: 600)
        timeObserver = player.addPeriodicTimeObserver(
            forInterval: interval,
            queue: .main
        ) { [weak self] time in
            Task { @MainActor in
                guard let self = self else { return }

                let seconds = CMTimeGetSeconds(time)
                if seconds.isFinite {
                    self.currentTime = seconds
                }

                // Auto-stop at end
                if seconds >= self.duration && self.duration > 0 {
                    await self.stop()
                }
            }
        }
    }

    private func addStatusObserver() {
        guard let player = player else { return }

        statusObserver = player.publisher(for: \.status)
            .sink { [weak self] status in
                Task { @MainActor in
                    switch status {
                    case .failed:
                        self?.error = "播放失败"
                        await self?.stop()
                    default:
                        break
                    }
                }
            }
    }

    private func addEndObserver() {
        guard let player = player else { return }

        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: player.currentItem,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                await self?.stop()
            }
        }
    }

    private func removeObservers() {
        if let timeObserver = timeObserver {
            player?.removeTimeObserver(timeObserver)
            self.timeObserver = nil
        }

        statusObserver?.cancel()
        statusObserver = nil

        if let endObserver = endObserver {
            NotificationCenter.default.removeObserver(endObserver)
            self.endObserver = nil
        }
    }

    private func cleanup() {
        removeObservers()
        player = nil
    }
}

// MARK: - Extensions

extension CMTime {
    var seconds: Double? {
        let time = CMTimeGetSeconds(self)
        return time.isFinite ? time : nil
    }
}

// MARK: - Error Types

enum PlaybackError: LocalizedError {
    case noAudioFile
    case fileNotFound
    case invalidPath
    case playerFailed

    var errorDescription: String? {
        switch self {
        case .noAudioFile:
            return "此转录块没有音频文件"
        case .fileNotFound:
            return "音频文件未找到"
        case .invalidPath:
            return "无效的文件路径"
        case .playerFailed:
            return "播放器初始化失败"
        }
    }
}
