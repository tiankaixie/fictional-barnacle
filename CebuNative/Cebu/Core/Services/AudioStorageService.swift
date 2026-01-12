/**
 * Input: Audio samples, storage preferences
 * Output: Saved audio files, storage statistics
 * Pos: Service layer managing audio file storage, retrieval, and cleanup
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import AVFoundation
import CoreData

/// Information about a saved audio file
struct AudioFileInfo {
    let path: String      // Relative path from base directory
    let size: Int64       // File size in bytes
    let format: String    // Audio format (e.g., "m4a")
    let duration: Double  // Duration in seconds
}

/// Audio quality levels with corresponding bitrates
enum AudioQuality: String, CaseIterable, Identifiable {
    case low = "低"
    case standard = "标准"
    case high = "高"

    var id: String { rawValue }

    /// AAC bitrate in kbps
    var bitrate: Int {
        switch self {
        case .low: return 32
        case .standard: return 64
        case .high: return 128
        }
    }

    /// Estimated file size per minute in KB
    var sizePerMinute: Int {
        return bitrate * 60 / 8
    }

    /// Description for UI
    var description: String {
        return "约 \(sizePerMinute) KB/分钟"
    }
}

/// Service responsible for audio file storage management
@MainActor
class AudioStorageService: ObservableObject {
    // MARK: - Published Properties

    @Published var saveAudioEnabled: Bool {
        didSet {
            UserDefaults.standard.set(saveAudioEnabled, forKey: UserDefaultsKeys.saveAudioEnabled)
        }
    }

    @Published var audioQuality: AudioQuality {
        didSet {
            UserDefaults.standard.set(audioQuality.rawValue, forKey: UserDefaultsKeys.audioQuality)
        }
    }

    @Published var totalStorage: Int64 = 0

    // MARK: - Private Properties

    private let fileManager = FileManager.default
    private let baseDirectory: URL

    // Storage quota (1GB default)
    private let maxStorageBytes: Int64 = 1_073_741_824 // 1GB

    // MARK: - UserDefaults Keys

    private enum UserDefaultsKeys {
        static let saveAudioEnabled = "app.audio.saveEnabled"
        static let audioQuality = "app.audio.quality"
    }

    // MARK: - Initialization

    init() {
        // Get Documents directory
        guard let documentsDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            fatalError("Unable to access documents directory")
        }

        self.baseDirectory = documentsDirectory.appendingPathComponent("Audio")

        // Load user preferences
        self.saveAudioEnabled = UserDefaults.standard.bool(forKey: UserDefaultsKeys.saveAudioEnabled)

        if let qualityString = UserDefaults.standard.string(forKey: UserDefaultsKeys.audioQuality),
           let quality = AudioQuality(rawValue: qualityString) {
            self.audioQuality = quality
        } else {
            self.audioQuality = .standard
        }

        // Create base directory if needed
        Task {
            await createBaseDirectoryIfNeeded()
            await updateStorageUsage()
        }
    }

    // MARK: - Directory Management

    /// Get storage directory for a specific journal entry
    func storageDirectory(for entryID: UUID) -> URL {
        return baseDirectory.appendingPathComponent(entryID.uuidString)
    }

    /// Create base audio directory if it doesn't exist
    private func createBaseDirectoryIfNeeded() async {
        guard !fileManager.fileExists(atPath: baseDirectory.path) else { return }

        do {
            try fileManager.createDirectory(at: baseDirectory, withIntermediateDirectories: true)
            print("[AudioStorage] Created base directory: \(baseDirectory.path)")
        } catch {
            print("[AudioStorage] Failed to create base directory: \(error)")
        }
    }

    /// Create entry directory if it doesn't exist
    private func createEntryDirectoryIfNeeded(for entryID: UUID) throws {
        let entryDir = storageDirectory(for: entryID)

        guard !fileManager.fileExists(atPath: entryDir.path) else { return }

        try fileManager.createDirectory(at: entryDir, withIntermediateDirectories: true)
        print("[AudioStorage] Created entry directory: \(entryDir.path)")
    }

    // MARK: - Audio File Operations

    /// Save audio samples to M4A file
    /// - Parameters:
    ///   - samples: Audio samples (PCM Float32)
    ///   - block: TranscriptionBlock to associate with
    ///   - sampleRate: Sample rate (e.g., 16000.0)
    /// - Returns: Information about the saved file
    func saveAudio(_ samples: [Float], for block: TranscriptionBlock, sampleRate: Double) async throws -> AudioFileInfo {
        guard let blockID = block.id,
              let entryID = block.entry?.id else {
            throw AudioStorageError.invalidBlock
        }

        // Create entry directory if needed
        try createEntryDirectoryIfNeeded(for: entryID)

        // Generate file path
        let filename = "\(blockID.uuidString).m4a"
        let fileURL = storageDirectory(for: entryID).appendingPathComponent(filename)
        let relativePath = "Audio/\(entryID.uuidString)/\(filename)"

        // Convert samples to M4A format
        try await convertAndSaveSamples(samples, sampleRate: sampleRate, to: fileURL)

        // Get file size
        let attributes = try fileManager.attributesOfItem(atPath: fileURL.path)
        let fileSize = attributes[.size] as? Int64 ?? 0

        // Calculate duration
        let duration = Double(samples.count) / sampleRate

        // Update total storage
        await updateStorageUsage()

        print("[AudioStorage] Saved audio: \(relativePath) (\(fileSize) bytes, \(String(format: "%.1f", duration))s)")

        return AudioFileInfo(
            path: relativePath,
            size: fileSize,
            format: "m4a",
            duration: duration
        )
    }

    /// Delete audio file at the specified path
    /// - Parameter path: Relative path to the audio file
    func deleteAudio(at path: String) async throws {
        let fileURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(path)

        guard fileManager.fileExists(atPath: fileURL.path) else {
            print("[AudioStorage] File does not exist: \(path)")
            return
        }

        // Get file size before deleting
        let attributes = try? fileManager.attributesOfItem(atPath: fileURL.path)
        let fileSize = attributes?[.size] as? Int64 ?? 0

        try fileManager.removeItem(at: fileURL)
        print("[AudioStorage] Deleted audio: \(path) (\(fileSize) bytes)")

        // Update storage usage
        await updateStorageUsage()
    }

    // MARK: - Storage Management

    /// Calculate and update total storage usage
    func calculateStorageUsage() async -> Int64 {
        var totalSize: Int64 = 0

        guard fileManager.fileExists(atPath: baseDirectory.path) else {
            return 0
        }

        if let enumerator = fileManager.enumerator(at: baseDirectory, includingPropertiesForKeys: [.fileSizeKey]) {
            for case let fileURL as URL in enumerator {
                if let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
                   let fileSize = resourceValues.fileSize {
                    totalSize += Int64(fileSize)
                }
            }
        }

        return totalSize
    }

    /// Update the published totalStorage property
    private func updateStorageUsage() async {
        let usage = await calculateStorageUsage()
        totalStorage = usage
    }

    /// Clean up old audio files older than specified days
    /// - Parameter days: Delete files older than this many days (0 = delete all)
    func cleanupOldFiles(olderThan days: Int) async throws {
        guard fileManager.fileExists(atPath: baseDirectory.path) else { return }

        let now = Date()
        let cutoffDate = Calendar.current.date(byAdding: .day, value: -days, to: now) ?? now

        var deletedCount = 0
        var deletedSize: Int64 = 0

        if let enumerator = fileManager.enumerator(
            at: baseDirectory,
            includingPropertiesForKeys: [.creationDateKey, .fileSizeKey]
        ) {
            for case let fileURL as URL in enumerator {
                // Skip directories
                guard !fileURL.hasDirectoryPath else { continue }

                if days == 0 {
                    // Delete all files
                    let size = try? fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize
                    try fileManager.removeItem(at: fileURL)
                    deletedCount += 1
                    deletedSize += Int64(size ?? 0)
                } else {
                    // Delete files older than cutoff date
                    if let resourceValues = try? fileURL.resourceValues(forKeys: [.creationDateKey, .fileSizeKey]),
                       let creationDate = resourceValues.creationDate,
                       creationDate < cutoffDate {
                        try fileManager.removeItem(at: fileURL)
                        deletedCount += 1
                        deletedSize += Int64(resourceValues.fileSize ?? 0)
                    }
                }
            }
        }

        print("[AudioStorage] Cleanup: Deleted \(deletedCount) files (\(deletedSize) bytes)")

        // Update storage usage
        await updateStorageUsage()
    }

    // MARK: - Audio Format Conversion

    /// Convert PCM Float32 samples to M4A and save to file
    private func convertAndSaveSamples(_ samples: [Float], sampleRate: Double, to fileURL: URL) async throws {
        // Create audio format for PCM Float32
        let sourceFormat = AVAudioFormat(
            commonFormat: .pcmFormatFloat32,
            sampleRate: sampleRate,
            channels: 1,
            interleaved: false
        )!

        // Create audio buffer from samples
        guard let pcmBuffer = AVAudioPCMBuffer(
            pcmFormat: sourceFormat,
            frameCapacity: UInt32(samples.count)
        ) else {
            throw AudioStorageError.bufferCreationFailed
        }

        pcmBuffer.frameLength = UInt32(samples.count)
        if let channelData = pcmBuffer.floatChannelData {
            channelData[0].update(from: samples, count: samples.count)
        }

        // Create AAC output format with quality-based bitrate
        let outputSettings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: sampleRate,
            AVNumberOfChannelsKey: 1,
            AVEncoderBitRateKey: audioQuality.bitrate * 1000 // Convert kbps to bps
        ]

        // Write to file
        guard let audioFile = try? AVAudioFile(
            forWriting: fileURL,
            settings: outputSettings,
            commonFormat: .pcmFormatFloat32,
            interleaved: false
        ) else {
            throw AudioStorageError.fileCreationFailed
        }

        try audioFile.write(from: pcmBuffer)
    }

    // MARK: - Helper Methods

    /// Format storage size for display
    func formatStorageSize(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }

    /// Check if storage quota is exceeded
    func isStorageQuotaExceeded() -> Bool {
        return totalStorage >= maxStorageBytes
    }
}

// MARK: - Errors

enum AudioStorageError: Error {
    case invalidBlock
    case bufferCreationFailed
    case fileCreationFailed
    case diskFull
    case permissionDenied

    var localizedDescription: String {
        switch self {
        case .invalidBlock:
            return "无效的转录块"
        case .bufferCreationFailed:
            return "无法创建音频缓冲区"
        case .fileCreationFailed:
            return "无法创建音频文件"
        case .diskFull:
            return "磁盘空间不足"
        case .permissionDenied:
            return "文件访问权限被拒绝"
        }
    }
}
