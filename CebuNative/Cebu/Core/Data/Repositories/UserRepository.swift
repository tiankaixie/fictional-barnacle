/**
 * Input: NSManagedObjectContext from Core Data
 * Output: User CRUD operations, authentication helpers
 * Pos: Data access layer for User entity
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import CoreData
import Foundation

class UserRepository {
    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // MARK: - User Management

    /// Get currently authenticated user (first user in database for now)
    func getCurrentUser() async throws -> User? {
        let request = User.fetchRequest()
        request.fetchLimit = 1
        request.sortDescriptors = [NSSortDescriptor(keyPath: \User.createdAt, ascending: false)]

        return try await context.perform {
            try self.context.fetch(request).first
        }
    }

    /// Find user by Apple ID, or create new user if not found
    func findOrCreateUser(appleID: String, email: String?, displayName: String?) async throws -> User {
        // First try to find existing user
        if let existingUser = try await findUserByAppleID(appleID) {
            // Update user info if new data is available
            return try await context.perform {
                if let email = email, existingUser.email != email {
                    existingUser.email = email
                }
                if let displayName = displayName, existingUser.displayName != displayName {
                    existingUser.displayName = displayName
                }
                existingUser.updatedAt = Date()

                try self.context.save()
                return existingUser
            }
        }

        // Create new user
        return try await context.perform {
            let user = User(context: self.context)
            user.id = UUID()
            user.appleID = appleID
            user.email = email
            user.displayName = displayName ?? "User"
            user.createdAt = Date()
            user.updatedAt = Date()

            try self.context.save()
            print("[UserRepository] Created new user: \(user.displayName ?? "Unknown")")

            return user
        }
    }

    /// Find user by Apple ID
    func findUserByAppleID(_ appleID: String) async throws -> User? {
        let request = User.fetchRequest()
        request.predicate = NSPredicate(format: "appleID == %@", appleID)
        request.fetchLimit = 1

        return try await context.perform {
            try self.context.fetch(request).first
        }
    }

    /// Find user by ID
    func findUserByID(_ id: UUID) async throws -> User? {
        let request = User.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", id as CVarArg)
        request.fetchLimit = 1

        return try await context.perform {
            try self.context.fetch(request).first
        }
    }

    /// Update user
    func updateUser(_ user: User) async throws {
        try await context.perform {
            user.updatedAt = Date()
            try self.context.save()
            print("[UserRepository] Updated user: \(user.displayName ?? "Unknown")")
        }
    }

    /// Delete user and all associated data
    func deleteUser(_ user: User) async throws {
        try await context.perform {
            self.context.delete(user)
            try self.context.save()
            print("[UserRepository] Deleted user: \(user.displayName ?? "Unknown")")
        }
    }

    /// Get all users (primarily for debugging)
    func getAllUsers() async throws -> [User] {
        let request = User.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \User.createdAt, ascending: false)]

        return try await context.perform {
            try self.context.fetch(request)
        }
    }

    // MARK: - Statistics

    /// Get user's journal entry count
    func getEntryCount(for user: User) async throws -> Int {
        try await context.perform {
            let entries = user.entries as? Set<JournalEntry> ?? []
            return entries.filter { entry in !entry.deletedFlag }.count
        }
    }

    /// Get user's total transcription block count
    func getTranscriptionCount(for user: User) async throws -> Int {
        try await context.perform {
            let entries = user.entries as? Set<JournalEntry> ?? []
            return entries
                .filter { entry in !entry.deletedFlag }
                .flatMap { ($0.blocks as? Set<TranscriptionBlock>) ?? [] }
                .filter { block in !block.deletedFlag }
                .count
        }
    }
}
