/**
 * Input: BiometricAuthService
 * Output: 锁屏覆盖层
 * Pos: 应用锁定时的全屏视图
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct AppLockView: View {
    @Environment(\.themeColors) var colors
    @ObservedObject var biometricService: BiometricAuthService

    var body: some View {
        ZStack {
            // Blurred background
            colors.background
                .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                // Lock icon
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    colors.primary.opacity(0.2),
                                    colors.primary.opacity(0.1)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 120, height: 120)

                    Image(systemName: "lock.shield.fill")
                        .font(.system(size: 50))
                        .foregroundColor(colors.primary)
                }

                // Title
                Text("Cebu 已锁定")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundColor(colors.text)

                // Subtitle
                Text(biometricTypeText)
                    .font(.body)
                    .foregroundColor(colors.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)

                Spacer()

                // Error message
                if let error = biometricService.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.red.opacity(0.1))
                        )
                        .padding(.horizontal, 32)
                }

                // Unlock button
                Button {
                    Task {
                        try? await biometricService.authenticate()
                    }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: biometricIcon)
                            .font(.system(size: 20))
                        Text("解锁")
                            .font(.headline)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        colors.primary,
                                        colors.primary.opacity(0.8)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .shadow(color: colors.primary.opacity(0.3), radius: 12, x: 0, y: 6)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 50)
            }
        }
        .onAppear {
            // Automatically trigger authentication when view appears
            Task {
                try? await biometricService.authenticate()
            }
        }
    }

    private var biometricTypeText: String {
        switch biometricService.biometricType {
        case .faceID:
            return "使用 Face ID 解锁以查看您的日记"
        case .touchID:
            return "使用 Touch ID 解锁以查看您的日记"
        default:
            return "使用设备密码解锁以查看您的日记"
        }
    }

    private var biometricIcon: String {
        switch biometricService.biometricType {
        case .faceID:
            return "faceid"
        case .touchID:
            return "touchid"
        default:
            return "lock.open"
        }
    }
}

// MARK: - Preview

#Preview("Face ID") {
    @StateObject var service = BiometricAuthService()

    return AppLockView(biometricService: service)
        .environment(\.themeColors, .light)
        .onAppear {
            service.isLocked = true
            service.isEnabled = true
        }
}

#Preview("Dark Mode") {
    @StateObject var service = BiometricAuthService()

    return AppLockView(biometricService: service)
        .environment(\.themeColors, .dark)
        .preferredColorScheme(.dark)
        .onAppear {
            service.isLocked = true
            service.isEnabled = true
        }
}
