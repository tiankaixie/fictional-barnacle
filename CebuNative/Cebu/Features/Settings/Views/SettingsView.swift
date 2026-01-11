/**
 * Input: ThemeManager environment object, dismiss action
 * Output: Settings UI with theme mode selection
 * Pos: Settings screen providing theme configuration interface
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct SettingsView: View {
    @Environment(\.themeColors) var colors
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var themeManager: ThemeManager

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // 主题选择区域
                    VStack(alignment: .leading, spacing: 12) {
                        Text("外观")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(colors.textSecondary)
                            .padding(.horizontal, 20)

                        VStack(spacing: 0) {
                            ForEach(ThemeMode.allCases) { mode in
                                ThemeModeRow(
                                    mode: mode,
                                    isSelected: themeManager.themeMode == mode,
                                    onSelect: {
                                        withAnimation(.easeInOut(duration: 0.3)) {
                                            themeManager.themeMode = mode
                                        }

                                        // 触觉反馈
                                        let generator = UIImpactFeedbackGenerator(style: .light)
                                        generator.impactOccurred()
                                    }
                                )

                                if mode != ThemeMode.allCases.last {
                                    Divider().padding(.leading, 60)
                                }
                            }
                        }
                        .liquidGlassCard(padding: 0)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle("设置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("完成") { dismiss() }
                        .foregroundColor(colors.primary)
                }
            }
        }
    }
}

struct ThemeModeRow: View {
    @Environment(\.themeColors) var colors
    let mode: ThemeMode
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 16) {
                Image(systemName: mode.iconName)
                    .font(.system(size: 22))
                    .foregroundColor(isSelected ? colors.primary : colors.textSecondary)
                    .frame(width: 28)

                Text(mode.displayName)
                    .font(.system(size: 17))
                    .foregroundColor(colors.text)

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(colors.primary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Previews

#Preview("Settings - Light") {
    SettingsView()
        .environmentObject(ThemeManager())
        .environment(\.themeColors, .light)
}

#Preview("Settings - Dark") {
    SettingsView()
        .environmentObject(ThemeManager())
        .environment(\.themeColors, .dark)
        .preferredColorScheme(.dark)
}
