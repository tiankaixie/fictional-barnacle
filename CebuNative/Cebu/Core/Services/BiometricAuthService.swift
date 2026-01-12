/**
 * Input: LocalAuthentication framework
 * Output: 生物识别状态和验证方法
 * Pos: 管理 Face ID/Touch ID 认证流程
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import LocalAuthentication
import Foundation

@MainActor
class BiometricAuthService: ObservableObject {
    // MARK: - Published Properties
    @Published var isLocked: Bool = false
    @Published var isEnabled: Bool = false
    @Published var biometricType: LABiometryType = .none
    @Published var error: String?

    // MARK: - Private Properties
    private let keychainService = KeychainService()
    private let enabledKey = "app.biometric.enabled"

    // MARK: - Initialization
    init() {
        loadSettings()
        checkBiometricAvailability()
    }

    // MARK: - Public Methods

    /// Check if biometric authentication is available
    func checkBiometricAvailability() {
        let context = LAContext()
        var error: NSError?

        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            biometricType = context.biometryType
            print("[BiometricAuth] Available: \(biometricTypeName)")
        } else {
            biometricType = .none
            if let error = error {
                print("[BiometricAuth] Not available: \(error.localizedDescription)")
            }
        }
    }

    /// Authenticate with biometrics
    func authenticate() async throws {
        let context = LAContext()
        context.localizedCancelTitle = "使用密码"

        let reason = "解锁 Cebu 查看您的日记"

        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )

            if success {
                isLocked = false
                error = nil
                print("[BiometricAuth] Authentication succeeded")
            }
        } catch let authError as LAError {
            handleAuthenticationError(authError)
            throw authError
        } catch {
            self.error = "认证失败: \(error.localizedDescription)"
            print("[BiometricAuth] Authentication error: \(error)")
            throw error
        }
    }

    /// Enable or disable biometric authentication
    func setEnabled(_ enabled: Bool) {
        isEnabled = enabled

        // Save to Keychain
        if let data = "\(enabled)".data(using: .utf8) {
            try? keychainService.save(key: enabledKey, value: data)
        }

        // Lock immediately if enabling
        if enabled {
            isLocked = true
        } else {
            isLocked = false
        }

        print("[BiometricAuth] Set enabled: \(enabled)")
    }

    /// Lock the app
    func lock() {
        if isEnabled {
            isLocked = true
            print("[BiometricAuth] App locked")
        }
    }

    /// Unlock the app (without biometric auth)
    func unlock() {
        isLocked = false
        print("[BiometricAuth] App unlocked")
    }

    // MARK: - Private Methods

    private func loadSettings() {
        // Try to load from Keychain
        if let data = try? keychainService.retrieve(key: enabledKey),
           let string = String(data: data, encoding: .utf8),
           let enabled = Bool(string) {
            isEnabled = enabled
            isLocked = enabled  // Start locked if enabled
            print("[BiometricAuth] Loaded settings: enabled=\(enabled)")
        } else {
            isEnabled = false
            isLocked = false
            print("[BiometricAuth] No saved settings, defaults to disabled")
        }
    }

    private func handleAuthenticationError(_ error: LAError) {
        switch error.code {
        case .authenticationFailed:
            self.error = "认证失败，请重试"
        case .userCancel:
            self.error = nil  // User cancelled, don't show error
        case .userFallback:
            self.error = "请使用设备密码"
        case .biometryNotAvailable:
            self.error = "生物识别不可用"
        case .biometryNotEnrolled:
            self.error = "未设置生物识别"
        case .biometryLockout:
            self.error = "生物识别已锁定，请使用密码"
        case .passcodeNotSet:
            self.error = "未设置设备密码"
        default:
            self.error = "认证错误: \(error.localizedDescription)"
        }

        if let errorMsg = self.error {
            print("[BiometricAuth] Error: \(errorMsg)")
        }
    }

    private var biometricTypeName: String {
        switch biometricType {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .none:
            return "None"
        @unknown default:
            return "Unknown"
        }
    }
}
