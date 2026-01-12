/**
 * Input: CloudSyncService
 * Output: 同步状态 UI、手动同步、故障排除
 * Pos: 设置中的 iCloud 同步管理
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct CloudSyncSettingsView: View {
    @Environment(\.themeColors) var colors
    @EnvironmentObject var cloudSyncService: CloudSyncService

    @State private var isSyncing = false
    @State private var showError = false

    var body: some View {
        Form {
            // iCloud Status Section
            Section {
                // iCloud availability
                HStack {
                    Image(systemName: "icloud")
                        .foregroundColor(cloudSyncService.isCloudKitAvailable ? .green : .red)
                    Text("iCloud 状态")
                    Spacer()
                    if cloudSyncService.isCloudKitAvailable {
                        Label("已连接", systemImage: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                    } else {
                        Label("不可用", systemImage: "xmark.circle.fill")
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }

                // Last sync time
                if let lastSync = cloudSyncService.lastSyncDate {
                    HStack {
                        Image(systemName: "clock")
                            .foregroundColor(colors.textSecondary)
                        Text("上次同步")
                        Spacer()
                        Text(lastSync, style: .relative)
                            .foregroundColor(colors.textSecondary)
                            .font(.caption)
                    }
                }

                // Sync status
                HStack {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .foregroundColor(colors.textSecondary)
                    Text("同步状态")
                    Spacer()
                    syncStatusView
                }
            } header: {
                Text("同步状态")
            }

            // Manual Sync Section
            if cloudSyncService.isCloudKitAvailable {
                Section {
                    Button {
                        handleManualSync()
                    } label: {
                        HStack {
                            if isSyncing {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "arrow.triangle.2.circlepath")
                            }
                            Text("立即同步")
                        }
                        .foregroundColor(isSyncing ? colors.textSecondary : colors.primary)
                    }
                    .disabled(isSyncing || cloudSyncService.syncStatus == .syncing)
                }
            }

            // Information Section
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 12) {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(colors.primary)
                        Text("关于 iCloud 同步")
                            .font(.headline)
                    }

                    Text("您的日记会自动同步到 iCloud，可在所有登录了相同 Apple ID 的设备上访问。数据使用端到端加密，确保隐私安全。")
                        .font(.caption)
                        .foregroundColor(colors.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.vertical, 8)
            }

            // Error Section
            if let error = cloudSyncService.syncError, showError {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                            Text("同步错误")
                                .font(.headline)
                                .foregroundColor(.red)
                        }

                        Text(error.localizedDescription)
                            .font(.caption)
                            .foregroundColor(colors.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)

                        Button("关闭") {
                            showError = false
                        }
                        .font(.caption)
                        .foregroundColor(colors.primary)
                    }
                    .padding(.vertical, 8)
                }
            }
        }
        .navigationTitle("iCloud 同步")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            showError = cloudSyncService.syncError != nil
        }
    }

    @ViewBuilder
    private var syncStatusView: some View {
        switch cloudSyncService.syncStatus {
        case .idle:
            Text("最新")
                .foregroundColor(colors.textSecondary)
                .font(.caption)
        case .syncing:
            HStack(spacing: 6) {
                ProgressView()
                    .scaleEffect(0.7)
                Text("同步中")
            }
            .font(.caption)
        case .succeeded:
            Label("成功", systemImage: "checkmark")
                .foregroundColor(.green)
                .font(.caption)
        case .failed:
            Label("失败", systemImage: "exclamationmark.triangle")
                .foregroundColor(.red)
                .font(.caption)
        }
    }

    private func handleManualSync() {
        isSyncing = true

        Task {
            do {
                try await cloudSyncService.manualSync()
                // Wait a bit for UI feedback
                try await Task.sleep(nanoseconds: 1_000_000_000)
            } catch {
                print("[CloudSyncSettings] Manual sync error: \(error)")
            }
            isSyncing = false
        }
    }
}

// MARK: - Preview

#Preview {
    @StateObject var service = CloudSyncService(
        container: PersistenceController.preview.container
    )

    return NavigationView {
        CloudSyncSettingsView()
            .environmentObject(service)
            .environment(\.themeColors, .light)
    }
    .onAppear {
        service.isCloudKitAvailable = true
    }
}
