/**
 * Input: CoreData, CloudKit frameworks
 * Output: NSPersistentCloudKitContainer instance, managed object context
 * Pos: Central data persistence layer with iCloud sync support
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import CoreData

struct PersistenceController {
    static let shared = PersistenceController()

    let container: NSPersistentCloudKitContainer

    init(inMemory: Bool = false) {
        container = NSPersistentCloudKitContainer(name: "Cebu")

        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }
        // Note: CloudKit sync disabled for local testing without paid developer account
        // To enable, uncomment below and configure iCloud container

        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Core Data failed to load: \(error.localizedDescription)")
            }
        }

        // Automatically merge changes from parent context
        container.viewContext.automaticallyMergesChangesFromParent = true

        // Use object-level merge policy (newer wins)
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

        // Set query generation token for consistency
        do {
            try container.viewContext.setQueryGenerationFrom(.current)
        } catch {
            print("Failed to set query generation: \(error.localizedDescription)")
        }
    }

    /// Preview instance for SwiftUI previews
    static var preview: PersistenceController = {
        let controller = PersistenceController(inMemory: true)
        let viewContext = controller.container.viewContext

        // Create sample data for previews
        let user = User(context: viewContext)
        user.id = UUID()
        user.displayName = "Preview User"
        user.createdAt = Date()
        user.updatedAt = Date()

        let entry = JournalEntry(context: viewContext)
        entry.id = UUID()
        entry.date = Calendar.current.startOfDay(for: Date())
        entry.createdAt = Date()
        entry.updatedAt = Date()
        entry.deletedFlag = false
        entry.syncStatus = "synced"
        entry.user = user

        let block = TranscriptionBlock(context: viewContext)
        block.id = UUID()
        block.content = "This is a sample transcription block for preview."
        block.position = 0
        block.createdAt = Date()
        block.updatedAt = Date()
        block.deletedFlag = false
        block.entry = entry

        do {
            try viewContext.save()
        } catch {
            let nsError = error as NSError
            fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
        }

        return controller
    }()
}
