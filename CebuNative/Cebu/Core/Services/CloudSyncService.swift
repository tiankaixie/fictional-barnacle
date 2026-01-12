/**
 * Input: NSPersistentCloudKitContainer, NotificationCenter
 * Output: 同步状态、错误处理、手动同步
 * Pos: 监控 CloudKit 同步状态并提供控制
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import CloudKit
import CoreData
import Foundation

@MainActor
class CloudSyncService: ObservableObject {
    // MARK: - Sync Status
    enum SyncStatus {
        case idle
        case syncing
        case succeeded
        case failed
    }

    // MARK: - Published Properties
    @Published var syncStatus: SyncStatus = .idle
    @Published var lastSyncDate: Date?
    @Published var syncError: Error?
    @Published var isCloudKitAvailable: Bool = false

    // MARK: - Private Properties
    private let container: NSPersistentCloudKitContainer

    // MARK: - Initialization
    init(container: NSPersistentCloudKitContainer) {
        self.container = container

        // Don't block initialization - check availability in background
        Task { @MainActor in
            await checkCloudKitAvailability()
            setupNotifications()
        }
    }

    // MARK: - Public Methods

    /// Check if iCloud is available
    func checkCloudKitAvailability() async {
        // Since CloudKit is disabled in development, mark as unavailable immediately
        isCloudKitAvailable = false
        print("[CloudSync] CloudKit disabled for development build")

        /* Uncomment when CloudKit is enabled with paid Apple Developer account
        let container = CKContainer.default()

        do {
            let status = try await container.accountStatus()
            isCloudKitAvailable = (status == .available)

            if isCloudKitAvailable {
                print("[CloudSync] iCloud is available")
            } else {
                print("[CloudSync] iCloud is not available: status=\(status.rawValue)")
            }
        } catch {
            isCloudKitAvailable = false
            syncError = error
            print("[CloudSync] Failed to check iCloud status: \(error)")
        }
        */
    }

    /// Manually trigger sync
    func manualSync() async throws {
        guard isCloudKitAvailable else {
            throw NSError(
                domain: "CloudSyncService",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "iCloud 不可用"]
            )
        }

        syncStatus = .syncing
        print("[CloudSync] Manual sync triggered")

        // Give CloudKit some time to process
        try await Task.sleep(nanoseconds: 500_000_000)

        // CloudKit automatically handles sync, we just update the status
        // The actual sync status will be updated via notifications
    }

    // MARK: - Private Methods

    private func setupNotifications() {
        // Listen for CloudKit import/export events
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleCloudKitEvent),
            name: NSPersistentCloudKitContainer.eventChangedNotification,
            object: nil
        )

        print("[CloudSync] Notification observers set up")
    }

    @objc private func handleCloudKitEvent(_ notification: Notification) {
        guard let event = notification.userInfo?[
            NSPersistentCloudKitContainer.eventNotificationUserInfoKey
        ] as? NSPersistentCloudKitContainer.Event else {
            return
        }

        Task { @MainActor in
            handleEvent(event)
        }
    }

    private func handleEvent(_ event: NSPersistentCloudKitContainer.Event) {
        print("[CloudSync] Event: \(event.type.rawValue)")

        switch event.type {
        case .setup:
            print("[CloudSync] Setup event")

        case .import:
            if event.succeeded {
                syncStatus = .succeeded
                lastSyncDate = Date()
                syncError = nil
                print("[CloudSync] Import succeeded")
            } else {
                syncStatus = .failed
                syncError = event.error
                print("[CloudSync] Import failed: \(String(describing: event.error))")
            }

        case .export:
            syncStatus = .syncing
            print("[CloudSync] Export started")

            if event.succeeded {
                // Wait for import to complete
                print("[CloudSync] Export succeeded")
            } else {
                syncStatus = .failed
                syncError = event.error
                print("[CloudSync] Export failed: \(String(describing: event.error))")
            }

        @unknown default:
            print("[CloudSync] Unknown event type: \(event.type.rawValue)")
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
