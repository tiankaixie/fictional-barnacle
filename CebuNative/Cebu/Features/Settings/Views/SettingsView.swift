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
    @EnvironmentObject var modelManager: ModelManager

    @State private var showModelInfo = false

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

                    // AI 模型选择区域
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("AI 模型")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(colors.textSecondary)

                            Spacer()

                            Button(action: { showModelInfo.toggle() }) {
                                Image(systemName: "info.circle")
                                    .font(.system(size: 14))
                                    .foregroundColor(colors.textTertiary)
                            }
                        }
                        .padding(.horizontal, 20)

                        VStack(spacing: 0) {
                            ForEach(WhisperModel.allCases.filter { $0.supportsMultilingual }) { model in
                                ModelRow(
                                    model: model,
                                    isSelected: modelManager.selectedModel == model,
                                    onSelect: {
                                        withAnimation(.easeInOut(duration: 0.3)) {
                                            modelManager.setModel(model)
                                        }

                                        // 触觉反馈
                                        let generator = UIImpactFeedbackGenerator(style: .light)
                                        generator.impactOccurred()
                                    }
                                )

                                if model != WhisperModel.allCases.filter({ $0.supportsMultilingual }).last {
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
            .alert("AI 模型说明", isPresented: $showModelInfo) {
                Button("知道了", role: .cancel) {}
            } message: {
                Text("模型越大，转录准确度越高，但下载和运行速度越慢。建议使用 Large V3 获得最佳中文识别效果。\n\n下次录音时会自动使用新选择的模型。")
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

struct ModelRow: View {
    @Environment(\.themeColors) var colors
    let model: WhisperModel
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 16) {
                // Model icon with quality indicator
                ZStack {
                    Circle()
                        .fill(isSelected ? colors.primary.opacity(0.1) : colors.textTertiary.opacity(0.1))
                        .frame(width: 36, height: 36)

                    Image(systemName: model.iconName)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(isSelected ? colors.primary : colors.textSecondary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text(model.displayName)
                            .font(.system(size: 17, weight: isSelected ? .semibold : .regular))
                            .foregroundColor(colors.text)

                        // Quality stars
                        HStack(spacing: 2) {
                            ForEach(0..<model.qualityLevel, id: \.self) { _ in
                                Image(systemName: "star.fill")
                                    .font(.system(size: 9))
                                    .foregroundColor(colors.primary.opacity(0.6))
                            }
                        }
                    }

                    HStack(spacing: 8) {
                        Text(model.size)
                            .font(.caption)
                            .foregroundColor(colors.textTertiary)

                        Text("•")
                            .font(.caption)
                            .foregroundColor(colors.textTertiary)

                        Text(model.description)
                            .font(.caption)
                            .foregroundColor(colors.textSecondary)
                    }
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(colors.primary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Previews

#Preview("Settings - Light") {
    SettingsView()
        .environmentObject(ThemeManager())
        .environmentObject(ModelManager())
        .environment(\.themeColors, .light)
}

#Preview("Settings - Dark") {
    SettingsView()
        .environmentObject(ThemeManager())
        .environmentObject(ModelManager())
        .environment(\.themeColors, .dark)
        .preferredColorScheme(.dark)
}
