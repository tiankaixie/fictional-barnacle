/**
 * Input: Core Data managed object context
 * Output: TranscriptionCost entity
 * Pos: Core Data model representing API transcription costs
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import CoreData

@objc(TranscriptionCost)
public class TranscriptionCost: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var date: Date?
    @NSManaged public var duration: Double
    @NSManaged public var cost: Double
    @NSManaged public var provider: String?
    @NSManaged public var entryId: UUID?
}

extension TranscriptionCost {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<TranscriptionCost> {
        return NSFetchRequest<TranscriptionCost>(entityName: "TranscriptionCost")
    }
}
