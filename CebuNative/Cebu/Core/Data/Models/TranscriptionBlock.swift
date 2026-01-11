/**
 * Input: Core Data managed object context
 * Output: TranscriptionBlock entity
 * Pos: Core Data model representing a transcription block within an entry
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import CoreData

@objc(TranscriptionBlock)
public class TranscriptionBlock: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var content: String
    @NSManaged public var manualEdits: Data?
    @NSManaged public var audioDurationMs: Int32
    @NSManaged public var position: Int32
    @NSManaged public var createdAt: Date?
    @NSManaged public var updatedAt: Date?
    @NSManaged public var deletedFlag: Bool
    @NSManaged public var cloudKitRecordID: String?
    @NSManaged public var cloudKitChangeTag: String?
    @NSManaged public var entry: JournalEntry?
}

extension TranscriptionBlock: Identifiable {
}

extension TranscriptionBlock {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TranscriptionBlock> {
        return NSFetchRequest<TranscriptionBlock>(entityName: "TranscriptionBlock")
    }
}
