/**
 * Input: CloudSyncService
 * Output: 同步状态横幅
 * Pos: 日记列表顶部的非侵入式同步反馈
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct SyncStatusBanner: View {
    @Environment(\.themeColors) var colors
    @ObservedObject var cloudSyncService: CloudSyncService

    var body: some View {
        Group {
            if cloudSyncService.syncStatus == .syncing {
                HStack(spacing: 8) {
                    ProgressView()
                        .scaleEffect(0.7)
                        .tint(colors.primary)

                    Text("正在同步...")
                        .font(.caption)
                        .foregroundColor(colors.textSecondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(colors.glassBackground.opacity(0.5))
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: cloudSyncService.syncStatus)
    }
}

// MARK: - Preview

#Preview {
    @StateObject var service = CloudSyncService(
        container: PersistenceController.preview.container
    )

    return VStack {
        SyncStatusBanner(cloudSyncService: service)
        Spacer()
    }
    .environment(\.themeColors, .light)
    .onAppear {
        service.syncStatus = .syncing
    }
}
