/**
 * Input: Core Data managed object context
 * Output: JournalEntry entity
 * Pos: Core Data model representing a daily journal entry
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import CoreData

@objc(JournalEntry)
public class JournalEntry: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var date: Date?
    @NSManaged public var createdAt: Date?
    @NSManaged public var updatedAt: Date?
    @NSManaged public var lastSyncedAt: Date?
    @NSManaged public var syncStatus: String?
    @NSManaged public var deletedFlag: Bool
    @NSManaged public var cloudKitRecordID: String?
    @NSManaged public var cloudKitChangeTag: String?
    @NSManaged public var blocks: NSSet?
    @NSManaged public var user: User?
}

extension JournalEntry {
    @objc(addBlocksObject:)
    @NSManaged public func addToBlocks(_ value: TranscriptionBlock)

    @objc(removeBlocksObject:)
    @NSManaged public func removeFromBlocks(_ value: TranscriptionBlock)

    @objc(addBlocks:)
    @NSManaged public func addToBlocks(_ values: NSSet)

    @objc(removeBlocks:)
    @NSManaged public func removeFromBlocks(_ values: NSSet)
}

extension JournalEntry: Identifiable {
}

extension JournalEntry {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<JournalEntry> {
        return NSFetchRequest<JournalEntry>(entityName: "JournalEntry")
    }
}
