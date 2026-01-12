/**
 * Input: BiometricAuthService
 * Output: 安全设置 UI
 * Pos: 设置中的安全选项
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct SecuritySettingsView: View {
    @Environment(\.themeColors) var colors
    @EnvironmentObject var biometricService: BiometricAuthService

    var body: some View {
        Form {
            Section {
                if biometricService.biometricType != .none {
                    // Biometric toggle
                    Toggle(isOn: Binding(
                        get: { biometricService.isEnabled },
                        set: { newValue in
                            // Haptic feedback
                            let generator = UIImpactFeedbackGenerator(style: .medium)
                            generator.impactOccurred()

                            biometricService.setEnabled(newValue)
                        }
                    )) {
                        HStack(spacing: 12) {
                            Image(systemName: biometricIcon)
                                .font(.system(size: 20))
                                .foregroundColor(colors.primary)
                                .frame(width: 28)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("应用锁")
                                    .font(.body)
                                    .foregroundColor(colors.text)

                                Text(biometricTypeName)
                                    .font(.caption)
                                    .foregroundColor(colors.textSecondary)
                            }
                        }
                    }
                    .tint(colors.primary)

                    // Description
                    Text(biometricDescription)
                        .font(.caption)
                        .foregroundColor(colors.textSecondary)
                } else {
                    // Not available message
                    HStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundColor(.orange)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("生物识别不可用")
                                .font(.body)
                                .foregroundColor(colors.text)

                            Text("此设备不支持 Face ID 或 Touch ID")
                                .font(.caption)
                                .foregroundColor(colors.textSecondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
            } header: {
                Text("生物识别")
            } footer: {
                if biometricService.biometricType != .none && biometricService.isEnabled {
                    Text("应用进入后台时会自动锁定，需要 \(biometricTypeName) 解锁")
                        .font(.caption)
                        .foregroundColor(colors.textSecondary)
                }
            }

            // Privacy information
            Section {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 12) {
                        Image(systemName: "lock.shield.fill")
                            .foregroundColor(colors.primary)
                            .font(.system(size: 20))

                        Text("您的隐私很重要")
                            .font(.headline)
                            .foregroundColor(colors.text)
                    }

                    Text("Cebu 使用设备生物识别保护您的日记。所有数据都存储在您的设备上，我们无法访问您的日记内容。")
                        .font(.caption)
                        .foregroundColor(colors.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.vertical, 8)
            }
        }
        .navigationTitle("隐私与安全")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var biometricIcon: String {
        switch biometricService.biometricType {
        case .faceID:
            return "faceid"
        case .touchID:
            return "touchid"
        default:
            return "lock"
        }
    }

    private var biometricTypeName: String {
        switch biometricService.biometricType {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        default:
            return "生物识别"
        }
    }

    private var biometricDescription: String {
        switch biometricService.biometricType {
        case .faceID:
            return "使用 Face ID 保护您的日记隐私"
        case .touchID:
            return "使用 Touch ID 保护您的日记隐私"
        default:
            return "使用生物识别保护您的日记隐私"
        }
    }
}

// MARK: - Preview

#Preview {
    @StateObject var service = BiometricAuthService()

    return NavigationView {
        SecuritySettingsView()
            .environmentObject(service)
            .environment(\.themeColors, .light)
    }
}
