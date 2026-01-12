/**
 * Input: AudioStorageService environment object
 * Output: Audio settings UI with quality and storage management
 * Pos: Settings screen for audio recording preferences
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct AudioSettingsView: View {
    @Environment(\.themeColors) var colors
    @EnvironmentObject var audioStorageService: AudioStorageService

    @State private var showCleanupConfirmation = false
    @State private var cleanupOption: CleanupOption = .thirtyDays
    @State private var isCalculatingStorage = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // 音频保存开关
                VStack(alignment: .leading, spacing: 12) {
                    Text("录音保存")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(colors.textSecondary)
                        .padding(.horizontal, 20)

                    Toggle(isOn: $audioStorageService.saveAudioEnabled) {
                        HStack(spacing: 16) {
                            Image(systemName: "waveform.circle.fill")
                                .font(.system(size: 22))
                                .foregroundColor(colors.primary)
                                .frame(width: 28)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("保存原始录音")
                                    .font(.system(size: 17))
                                    .foregroundColor(colors.text)

                                Text(audioStorageService.saveAudioEnabled ? "录音将被保存" : "仅保存转录文字")
                                    .font(.caption)
                                    .foregroundColor(colors.textTertiary)
                            }
                        }
                    }
                    .tint(colors.primary)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .liquidGlassCard(padding: 0)
                }

                // 音质选择（仅在启用保存时显示）
                if audioStorageService.saveAudioEnabled {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("音质")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(colors.textSecondary)
                            .padding(.horizontal, 20)

                        VStack(spacing: 0) {
                            ForEach(AudioQuality.allCases) { quality in
                                AudioQualityRow(
                                    quality: quality,
                                    isSelected: audioStorageService.audioQuality == quality,
                                    onSelect: {
                                        withAnimation(.easeInOut(duration: 0.3)) {
                                            audioStorageService.audioQuality = quality
                                        }

                                        // 触觉反馈
                                        let generator = UIImpactFeedbackGenerator(style: .light)
                                        generator.impactOccurred()
                                    }
                                )

                                if quality != AudioQuality.allCases.last {
                                    Divider().padding(.leading, 60)
                                }
                            }
                        }
                        .liquidGlassCard(padding: 0)
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }

                // 存储管理
                VStack(alignment: .leading, spacing: 12) {
                    Text("存储管理")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(colors.textSecondary)
                        .padding(.horizontal, 20)

                    VStack(spacing: 16) {
                        // 存储使用量
                        HStack(spacing: 16) {
                            Image(systemName: "externaldrive.fill")
                                .font(.system(size: 22))
                                .foregroundColor(colors.primary)
                                .frame(width: 28)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("已使用空间")
                                    .font(.system(size: 17))
                                    .foregroundColor(colors.text)

                                if isCalculatingStorage {
                                    HStack(spacing: 6) {
                                        ProgressView()
                                            .scaleEffect(0.7)
                                        Text("计算中...")
                                            .font(.caption)
                                            .foregroundColor(colors.textTertiary)
                                    }
                                } else {
                                    Text(formatStorageSize(audioStorageService.totalStorage))
                                        .font(.caption)
                                        .foregroundColor(colors.textTertiary)
                                }
                            }

                            Spacer()

                            Button(action: refreshStorage) {
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(colors.primary)
                            }
                            .disabled(isCalculatingStorage)
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 16)

                        Divider()

                        // 清理选项
                        VStack(spacing: 0) {
                            CleanupButton(
                                title: "清理 30 天前的录音",
                                icon: "trash",
                                destructive: false,
                                action: { showCleanup(.thirtyDays) }
                            )

                            Divider().padding(.leading, 60)

                            CleanupButton(
                                title: "清理 90 天前的录音",
                                icon: "trash",
                                destructive: false,
                                action: { showCleanup(.ninetyDays) }
                            )

                            Divider().padding(.leading, 60)

                            CleanupButton(
                                title: "清理全部录音",
                                icon: "trash.fill",
                                destructive: true,
                                action: { showCleanup(.all) }
                            )
                        }
                    }
                    .liquidGlassCard(padding: 0)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
        }
        .background(colors.background.ignoresSafeArea())
        .navigationTitle("音频设置")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            refreshStorage()
        }
        .confirmationDialog(
            "确认清理",
            isPresented: $showCleanupConfirmation,
            titleVisibility: .visible
        ) {
            Button(cleanupOption.confirmButtonTitle, role: .destructive) {
                performCleanup()
            }
            Button("取消", role: .cancel) {}
        } message: {
            Text(cleanupOption.message)
        }
    }

    // MARK: - Helper Methods

    private func refreshStorage() {
        isCalculatingStorage = true
        Task {
            let size = await audioStorageService.calculateStorageUsage()
            await MainActor.run {
                audioStorageService.totalStorage = size
                isCalculatingStorage = false
            }
        }
    }

    private func showCleanup(_ option: CleanupOption) {
        cleanupOption = option
        showCleanupConfirmation = true
    }

    private func performCleanup() {
        Task {
            do {
                switch cleanupOption {
                case .thirtyDays:
                    try await audioStorageService.cleanupOldFiles(olderThan: 30)
                case .ninetyDays:
                    try await audioStorageService.cleanupOldFiles(olderThan: 90)
                case .all:
                    try await audioStorageService.cleanupOldFiles(olderThan: 0)
                }

                // 触觉反馈
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(.success)

                // 刷新存储使用量
                refreshStorage()
            } catch {
                print("[AudioSettings] Cleanup failed: \(error)")

                // 错误反馈
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(.error)
            }
        }
    }

    private func formatStorageSize(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}

// MARK: - Supporting Views

struct AudioQualityRow: View {
    @Environment(\.themeColors) var colors
    let quality: AudioQuality
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 16) {
                // Quality icon
                ZStack {
                    Circle()
                        .fill(isSelected ? colors.primary.opacity(0.1) : colors.textTertiary.opacity(0.1))
                        .frame(width: 36, height: 36)

                    Image(systemName: quality.iconName)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(isSelected ? colors.primary : colors.textSecondary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(quality.displayName)
                        .font(.system(size: 17, weight: isSelected ? .semibold : .regular))
                        .foregroundColor(colors.text)

                    HStack(spacing: 8) {
                        Text("\(quality.bitrate) kbps")
                            .font(.caption)
                            .foregroundColor(colors.textTertiary)

                        Text("•")
                            .font(.caption)
                            .foregroundColor(colors.textTertiary)

                        Text(quality.estimatedSize)
                            .font(.caption)
                            .foregroundColor(colors.textSecondary)
                    }
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(colors.primary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct CleanupButton: View {
    @Environment(\.themeColors) var colors
    let title: String
    let icon: String
    let destructive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(destructive ? colors.destructive : colors.textSecondary)
                    .frame(width: 28)

                Text(title)
                    .font(.system(size: 17))
                    .foregroundColor(destructive ? colors.destructive : colors.text)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(colors.textTertiary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Supporting Types

enum CleanupOption {
    case thirtyDays
    case ninetyDays
    case all

    var confirmButtonTitle: String {
        switch self {
        case .thirtyDays: return "清理 30 天前"
        case .ninetyDays: return "清理 90 天前"
        case .all: return "清理全部"
        }
    }

    var message: String {
        switch self {
        case .thirtyDays:
            return "将删除 30 天前的录音文件。转录文字将被保留。此操作无法撤销。"
        case .ninetyDays:
            return "将删除 90 天前的录音文件。转录文字将被保留。此操作无法撤销。"
        case .all:
            return "将删除所有录音文件。转录文字将被保留。此操作无法撤销。"
        }
    }
}

// MARK: - AudioQuality Extensions

extension AudioQuality {
    var iconName: String {
        switch self {
        case .low: return "gauge.low"
        case .standard: return "gauge.medium"
        case .high: return "gauge.high"
        }
    }

    var displayName: String {
        switch self {
        case .low: return "低"
        case .standard: return "标准"
        case .high: return "高"
        }
    }

    var estimatedSize: String {
        switch self {
        case .low: return "约 240 KB/分钟"
        case .standard: return "约 480 KB/分钟"
        case .high: return "约 960 KB/分钟"
        }
    }
}

// MARK: - Previews

#Preview("Audio Settings - Light") {
    NavigationView {
        AudioSettingsView()
            .environmentObject(AudioStorageService())
            .environment(\.themeColors, .light)
    }
}

#Preview("Audio Settings - Dark") {
    NavigationView {
        AudioSettingsView()
            .environmentObject(AudioStorageService())
            .environment(\.themeColors, .dark)
            .preferredColorScheme(.dark)
    }
}
