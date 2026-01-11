/**
 * Input: Core Data context
 * Output: Local user authentication (no Apple Sign In)
 * Pos: Simplified authentication for testing without paid developer account
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import CoreData
import SwiftUI

@MainActor
class LocalAuthService: ObservableObject {
    // MARK: - Published Properties
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var error: String?
    @Published var isLoading = false

    // MARK: - Private Properties
    private let userRepository: UserRepository

    // MARK: - Initialization

    init(userRepository: UserRepository) {
        self.userRepository = userRepository
    }

    // MARK: - Public Methods

    /// Check if user is already authenticated (local user)
    func checkAuthenticationState() async {
        isLoading = true

        do {
            if let user = try await userRepository.getCurrentUser() {
                currentUser = user
                isAuthenticated = true
                print("[LocalAuth] User authenticated: \(user.displayName ?? "Unknown")")
            } else {
                // Create local user automatically
                await createLocalUser()
            }
        } catch {
            self.error = "Failed to check authentication: \(error.localizedDescription)"
            print("[LocalAuth] Error: \(error.localizedDescription)")
        }

        isLoading = false
    }

    /// Create local user for testing
    private func createLocalUser() async {
        do {
            // Get device name
            let deviceName = UIDevice.current.name

            let user = try await userRepository.findOrCreateUser(
                appleID: "local-user-\(UIDevice.current.identifierForVendor?.uuidString ?? "unknown")",
                email: nil,
                displayName: deviceName
            )

            currentUser = user
            isAuthenticated = true
            print("[LocalAuth] Created local user: \(deviceName)")
        } catch {
            self.error = "Failed to create user: \(error.localizedDescription)"
            print("[LocalAuth] Error creating user: \(error.localizedDescription)")
        }
    }

    /// Sign out (reset to new local user)
    func signOut() {
        currentUser = nil
        isAuthenticated = false
        print("[LocalAuth] User signed out")
    }
}
