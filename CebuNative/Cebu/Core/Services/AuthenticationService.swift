/**
 * Input: ASAuthorization callbacks, Core Data context
 * Output: User authentication state, Sign in with Apple integration
 * Pos: Manages user authentication and session state
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import AuthenticationServices
import SwiftUI
import CoreData

@MainActor
class AuthenticationService: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var error: String?
    @Published var isLoading = false

    // MARK: - Private Properties
    private let userRepository: UserRepository
    private var currentNonce: String?

    // MARK: - Initialization

    init(userRepository: UserRepository) {
        self.userRepository = userRepository
        super.init()
    }

    // MARK: - Public Methods

    /// Check if user is already authenticated
    func checkAuthenticationState() async {
        isLoading = true

        do {
            if let user = try await userRepository.getCurrentUser() {
                currentUser = user
                isAuthenticated = true
                print("[Auth] User authenticated: \(user.displayName ?? "Unknown")")
            } else {
                print("[Auth] No authenticated user found")
            }
        } catch {
            self.error = "Failed to check authentication: \(error.localizedDescription)"
            print("[Auth] Error: \(error.localizedDescription)")
        }

        isLoading = false
    }

    /// Sign in with Apple
    func signInWithApple() {
        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.email, .fullName]

        // Generate nonce for security
        let nonce = randomNonceString()
        currentNonce = nonce
        request.nonce = sha256(nonce)

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.performRequests()
    }

    /// Sign out
    func signOut() {
        currentUser = nil
        isAuthenticated = false
        print("[Auth] User signed out")
    }

    /// Delete user account
    func deleteAccount() async throws {
        guard let user = currentUser else {
            throw AuthError.notAuthenticated
        }

        try await userRepository.deleteUser(user)
        signOut()
        print("[Auth] User account deleted")
    }

    // MARK: - Private Methods

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remainingLength = length

        while remainingLength > 0 {
            let randoms: [UInt8] = (0..<16).map { _ in
                var random: UInt8 = 0
                let errorCode = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
                if errorCode != errSecSuccess {
                    fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(errorCode)")
                }
                return random
            }

            randoms.forEach { random in
                if remainingLength == 0 {
                    return
                }

                if random < charset.count {
                    result.append(charset[Int(random)])
                    remainingLength -= 1
                }
            }
        }

        return result
    }

    private func sha256(_ input: String) -> String {
        let inputData = Data(input.utf8)
        let hashedData = SHA256.hash(data: inputData)
        let hashString = hashedData.compactMap {
            String(format: "%02x", $0)
        }.joined()

        return hashString
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension AuthenticationService: ASAuthorizationControllerDelegate {
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        Task { @MainActor in
            isLoading = true

            if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
                let userIdentifier = appleIDCredential.user
                let email = appleIDCredential.email
                let fullName = appleIDCredential.fullName

                let displayName: String?
                if let givenName = fullName?.givenName, let familyName = fullName?.familyName {
                    displayName = "\(givenName) \(familyName)"
                } else {
                    displayName = nil
                }

                do {
                    let user = try await userRepository.findOrCreateUser(
                        appleID: userIdentifier,
                        email: email,
                        displayName: displayName
                    )

                    currentUser = user
                    isAuthenticated = true
                    print("[Auth] Sign in successful: \(displayName ?? "Unknown")")
                } catch {
                    self.error = "Failed to create user: \(error.localizedDescription)"
                    print("[Auth] Error creating user: \(error.localizedDescription)")
                }
            }

            isLoading = false
        }
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        Task { @MainActor in
            // Handle error
            if let authError = error as? ASAuthorizationError {
                switch authError.code {
                case .canceled:
                    print("[Auth] User canceled sign in")
                case .failed:
                    self.error = "Authentication failed"
                case .invalidResponse:
                    self.error = "Invalid response from Apple"
                case .notHandled:
                    self.error = "Authentication not handled"
                case .unknown:
                    self.error = "Unknown authentication error"
                @unknown default:
                    self.error = "Unknown error"
                }
            }

            isLoading = false
            print("[Auth] Error: \(error.localizedDescription)")
        }
    }
}

// MARK: - SHA256 (Simple Implementation)

import CryptoKit

extension SHA256 {
    static func hash(data: Data) -> SHA256Digest {
        return SHA256.hash(data: data)
    }
}

// MARK: - Authentication Errors

enum AuthError: LocalizedError {
    case notAuthenticated
    case invalidCredentials
    case userCreationFailed

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User is not authenticated"
        case .invalidCredentials:
            return "Invalid credentials provided"
        case .userCreationFailed:
            return "Failed to create user account"
        }
    }
}
