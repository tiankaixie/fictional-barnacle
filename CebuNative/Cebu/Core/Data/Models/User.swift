/**
 * Input: Core Data managed object context
 * Output: User entity
 * Pos: Core Data model representing a user
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import CoreData

@objc(User)
public class User: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var appleID: String?
    @NSManaged public var email: String?
    @NSManaged public var displayName: String?
    @NSManaged public var createdAt: Date?
    @NSManaged public var updatedAt: Date?
    @NSManaged public var entries: NSSet?
}

extension User {
    @objc(addEntriesObject:)
    @NSManaged public func addToEntries(_ value: JournalEntry)

    @objc(removeEntriesObject:)
    @NSManaged public func removeFromEntries(_ value: JournalEntry)

    @objc(addEntries:)
    @NSManaged public func addToEntries(_ values: NSSet)

    @objc(removeEntries:)
    @NSManaged public func removeFromEntries(_ values: NSSet)
}

extension User: Identifiable {
}

extension User {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<User> {
        return NSFetchRequest<User>(entityName: "User")
    }
}
