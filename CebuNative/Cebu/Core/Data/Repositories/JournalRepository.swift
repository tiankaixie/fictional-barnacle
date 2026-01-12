/**
 * Input: NSManagedObjectContext from Core Data
 * Output: Journal and TranscriptionBlock CRUD operations
 * Pos: Data access layer for journal entries and transcription blocks
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import CoreData
import Foundation

class JournalRepository {
    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // MARK: - Journal Entry Management

    /// Get or create today's entry for a user
    func getOrCreateTodayEntry(for user: User) async throws -> JournalEntry {
        let today = Calendar.current.startOfDay(for: Date())

        // Try to find existing entry
        let request = JournalEntry.fetchRequest()
        request.predicate = NSPredicate(
            format: "user == %@ AND date == %@ AND deletedFlag == NO",
            user, today as NSDate
        )
        request.fetchLimit = 1

        return try await context.perform {
            if let existing = try self.context.fetch(request).first {
                return existing
            }

            // Create new entry
            let entry = JournalEntry(context: self.context)
            entry.id = UUID()
            entry.date = today
            entry.createdAt = Date()
            entry.updatedAt = Date()
            entry.user = user
            entry.syncStatus = "pending"
            entry.deletedFlag = false

            try self.context.save()
            print("[JournalRepository] Created today's entry for \(today)")

            return entry
        }
    }

    /// Get entries with pagination
    func getEntriesPaginated(for user: User, offset: Int = 0, limit: Int = 20) async throws -> [JournalEntryWithBlocks] {
        let request = JournalEntry.fetchRequest()
        request.predicate = NSPredicate(
            format: "user == %@ AND deletedFlag == NO",
            user
        )
        request.sortDescriptors = [NSSortDescriptor(keyPath: \JournalEntry.date, ascending: false)]
        request.fetchOffset = offset
        request.fetchLimit = limit
        request.relationshipKeyPathsForPrefetching = ["blocks"]

        return try await context.perform {
            let entries = try self.context.fetch(request)

            return entries.map { entry in
                let blocks = (entry.blocks as? Set<TranscriptionBlock>)?
                    .filter { block in !block.deletedFlag }
                    .sorted { $0.position < $1.position } ?? []

                return JournalEntryWithBlocks(
                    entry: entry,
                    blocks: blocks
                )
            }
        }
    }

    /// Get single entry by date
    func getEntry(for user: User, date: Date) async throws -> JournalEntry? {
        let dayStart = Calendar.current.startOfDay(for: date)

        let request = JournalEntry.fetchRequest()
        request.predicate = NSPredicate(
            format: "user == %@ AND date == %@ AND deletedFlag == NO",
            user, dayStart as NSDate
        )
        request.fetchLimit = 1

        return try await context.perform {
            try self.context.fetch(request).first
        }
    }

    /// Search entries by keyword in transcription content
    func searchEntries(for user: User, query: String, offset: Int = 0, limit: Int = 20) async throws -> [JournalEntryWithBlocks] {
        let request = JournalEntry.fetchRequest()

        // Search TranscriptionBlock content (case-insensitive)
        let contentPredicate = NSPredicate(
            format: "ANY blocks.content CONTAINS[cd] %@",
            query
        )
        let userPredicate = NSPredicate(
            format: "user == %@ AND deletedFlag == NO",
            user
        )

        request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            userPredicate,
            contentPredicate
        ])

        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \JournalEntry.date, ascending: false)
        ]
        request.fetchOffset = offset
        request.fetchLimit = limit
        request.relationshipKeyPathsForPrefetching = ["blocks"]

        return try await context.perform {
            let entries = try self.context.fetch(request)
            return entries.map { entry in
                let blocks = (entry.blocks as? Set<TranscriptionBlock>)?
                    .filter { !$0.deletedFlag }
                    .sorted { $0.position < $1.position } ?? []
                return JournalEntryWithBlocks(entry: entry, blocks: blocks)
            }
        }
    }

    // MARK: - Transcription Block Management

    /// Add transcription block to an entry
    func addTranscriptionBlock(to entry: JournalEntry, content: String, audioDuration: Int? = nil) async throws -> TranscriptionBlock {
        try await context.perform {
            let block = TranscriptionBlock(context: self.context)
            block.id = UUID()
            block.content = content
            block.audioDurationMs = Int32(audioDuration ?? 0)
            block.createdAt = Date()
            block.updatedAt = Date()
            block.deletedFlag = false
            block.entry = entry

            // Get next position
            let existingBlocks = (entry.blocks as? Set<TranscriptionBlock>)?
                .filter { block in !block.deletedFlag } ?? []
            let maxPosition = existingBlocks.map(\.position).max() ?? -1
            block.position = maxPosition + 1

            // Update entry
            entry.updatedAt = Date()
            entry.syncStatus = "pending"

            try self.context.save()
            print("[JournalRepository] Added transcription block at position \(block.position)")

            return block
        }
    }

    /// Update transcription block content
    func updateTranscriptionBlock(_ block: TranscriptionBlock, newContent: String) async throws {
        try await context.perform {
            let originalContent = block.content

            // Create manual edit record
            let manualEdit = ManualEdit(
                original: originalContent,
                edited: newContent,
                editedAt: Date()
            )

            if let data = try? JSONEncoder().encode(manualEdit) {
                block.manualEdits = data
            }

            block.content = newContent
            block.updatedAt = Date()

            // Update entry
            if let entry = block.entry {
                entry.updatedAt = Date()
                entry.syncStatus = "pending"
            }

            try self.context.save()
            print("[JournalRepository] Updated transcription block")
        }
    }

    /// Delete transcription block (soft delete)
    func deleteTranscriptionBlock(_ block: TranscriptionBlock) async throws {
        try await context.perform {
            block.deletedFlag = true
            block.updatedAt = Date()

            // Update entry
            if let entry = block.entry {
                entry.updatedAt = Date()
                entry.syncStatus = "pending"
            }

            try self.context.save()
            print("[JournalRepository] Deleted transcription block")
        }
    }

    /// Get all blocks for an entry
    func getBlocks(for entry: JournalEntry) async throws -> [TranscriptionBlock] {
        try await context.perform {
            let blocks = (entry.blocks as? Set<TranscriptionBlock>)?
                .filter { block in !block.deletedFlag }
                .sorted { $0.position < $1.position } ?? []

            return blocks
        }
    }

    // MARK: - Statistics

    /// Get total entry count for user
    func getEntryCount(for user: User) async throws -> Int {
        let request = JournalEntry.fetchRequest()
        request.predicate = NSPredicate(
            format: "user == %@ AND deletedFlag == NO",
            user
        )

        return try await context.perform {
            try self.context.count(for: request)
        }
    }

    /// Get total transcription count for user
    func getTranscriptionCount(for user: User) async throws -> Int {
        let request = TranscriptionBlock.fetchRequest()
        request.predicate = NSPredicate(
            format: "entry.user == %@ AND deletedFlag == NO",
            user
        )

        return try await context.perform {
            try self.context.count(for: request)
        }
    }

    /// Delete entry (soft delete)
    func deleteEntry(_ entry: JournalEntry) async throws {
        try await context.perform {
            entry.deletedFlag = true
            entry.updatedAt = Date()
            entry.syncStatus = "pending"

            // Soft delete all blocks
            if let blocks = entry.blocks as? Set<TranscriptionBlock> {
                for block in blocks {
                    block.deletedFlag = true
                    block.updatedAt = Date()
                }
            }

            try self.context.save()
            print("[JournalRepository] Deleted entry")
        }
    }
}

// MARK: - Helper Models

/// Entry with its blocks for easy view display
struct JournalEntryWithBlocks: Identifiable {
    let entry: JournalEntry
    let blocks: [TranscriptionBlock]

    var id: UUID {
        entry.id ?? UUID()
    }

    var date: Date {
        entry.date ?? Date()
    }

    var formattedDate: String {
        let calendar = Calendar.current
        let now = Date()

        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else if calendar.isDate(date, equalTo: now, toGranularity: .weekOfYear) {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE" // Day of week
            return formatter.string(from: date)
        } else {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            return formatter.string(from: date)
        }
    }
}

/// Manual edit structure (matches SQLite JSON)
struct ManualEdit: Codable {
    let original: String
    let edited: String
    let editedAt: Date
}
