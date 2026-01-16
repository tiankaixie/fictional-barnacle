/**
 * Input: User API key input
 * Output: Validated and stored OpenAI API key with cost tracking
 * Pos: Settings screen for OpenAI API key management and cost monitoring
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct APIKeySettingsView: View {
    @Environment(\.themeColors) var colors
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var whisperService: OpenAIWhisperService
    @EnvironmentObject var costTrackingService: CostTrackingService

    @State private var apiKey: String = ""
    @State private var isValidating = false
    @State private var validationError: String?
    @State private var showSuccess = false
    @State private var showDeleteConfirmation = false
    @State private var monthlyStats: MonthlyCostStats?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Cost statistics section (if API key is configured)
                if whisperService.hasValidAPIKey {
                    costStatisticsSection
                }

                // Info section
                VStack(alignment: .leading, spacing: 12) {
                    Label("关于 OpenAI API", systemImage: "info.circle")
                        .font(.headline)
                        .foregroundColor(colors.text)

                    Text("Cebu 使用 OpenAI Whisper API 进行语音转文字。\n\n费用: $0.006/分钟\n示例: 100分钟录音 ≈ $0.60")
                        .font(.callout)
                        .foregroundColor(colors.textSecondary)
                }
                .padding()
                .liquidGlassCard()

                // API Key input section
                VStack(alignment: .leading, spacing: 16) {
                    Text("API 密钥")
                        .font(.headline)
                        .foregroundColor(colors.text)

                    VStack(alignment: .leading, spacing: 8) {
                        if whisperService.hasValidAPIKey {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                                Text("已配置有效的 API 密钥")
                                    .foregroundColor(colors.text)
                            }
                            .font(.callout)
                        } else {
                            SecureField("sk-...", text: $apiKey)
                                .textFieldStyle(.roundedBorder)
                                .autocapitalization(.none)
                                .autocorrectionDisabled()
                        }

                        if let error = validationError {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(colors.destructive)
                        }
                    }

                    // Action buttons
                    VStack(spacing: 12) {
                        if whisperService.hasValidAPIKey {
                            Button(role: .destructive, action: { showDeleteConfirmation = true }) {
                                HStack {
                                    Image(systemName: "trash")
                                    Text("删除 API 密钥")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(colors.destructive)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                        } else {
                            Button(action: saveAPIKey) {
                                HStack {
                                    if isValidating {
                                        ProgressView()
                                            .tint(.white)
                                    }
                                    Text(isValidating ? "验证中..." : "保存并验证")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(apiKey.isEmpty ? Color.gray : colors.primary)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                            .disabled(apiKey.isEmpty || isValidating)
                        }
                    }
                }
                .padding()
                .liquidGlassCard()

                // How to get API key
                VStack(alignment: .leading, spacing: 12) {
                    Text("如何获取 API 密钥?")
                        .font(.headline)
                        .foregroundColor(colors.text)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("1. 访问 platform.openai.com")
                        Text("2. 登录或注册账号")
                        Text("3. 进入 API Keys 页面")
                        Text("4. 点击 'Create new secret key'")
                        Text("5. 复制密钥并粘贴到上方")
                    }
                    .font(.callout)
                    .foregroundColor(colors.textSecondary)

                    Link(destination: URL(string: "https://platform.openai.com/api-keys")!) {
                        HStack {
                            Text("打开 OpenAI 平台")
                            Image(systemName: "arrow.up.right")
                        }
                        .font(.callout)
                        .foregroundColor(colors.primary)
                    }
                }
                .padding()
                .liquidGlassCard()
            }
            .padding()
        }
        .navigationTitle("OpenAI API 配置")
        .navigationBarTitleDisplayMode(.inline)
        .liquidGlassBackground()
        .task {
            if whisperService.hasValidAPIKey {
                await loadMonthlyStats()
            }
        }
        .alert("删除 API 密钥", isPresented: $showDeleteConfirmation) {
            Button("取消", role: .cancel) {}
            Button("删除", role: .destructive) {
                deleteAPIKey()
            }
        } message: {
            Text("删除后将无法使用语音转文字功能，直到重新配置 API 密钥。")
        }
        .alert("保存成功", isPresented: $showSuccess) {
            Button("完成") {
                dismiss()
            }
        } message: {
            Text("API 密钥已验证并保存")
        }
    }

    // MARK: - Cost Statistics Section

    @ViewBuilder
    private var costStatisticsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Label("本月使用统计", systemImage: "chart.bar.fill")
                .font(.headline)
                .foregroundColor(colors.text)

            if let stats = monthlyStats {
                VStack(spacing: 12) {
                    // Total duration and cost
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("总时长")
                                .font(.caption)
                                .foregroundColor(colors.textSecondary)
                            Text(stats.formattedDuration)
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(colors.text)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 4) {
                            Text("总费用")
                                .font(.caption)
                                .foregroundColor(colors.textSecondary)
                            Text(stats.formattedCost)
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(colors.primary)
                        }
                    }

                    Divider()

                    // Additional stats
                    HStack {
                        statItem(label: "转录次数", value: "\(stats.transcriptionCount)")
                        Spacer()
                        statItem(label: "日均使用", value: stats.formattedAverageDailyUsage)
                    }

                    // Usage days
                    Text("\(stats.daysWithUsage)/\(stats.daysInMonth) 天有使用")
                        .font(.caption)
                        .foregroundColor(colors.textSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                ProgressView()
                    .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .liquidGlassCard()
    }

    @ViewBuilder
    private func statItem(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundColor(colors.textSecondary)
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(colors.text)
        }
    }

    // MARK: - Actions

    private func saveAPIKey() {
        validationError = nil
        isValidating = true

        Task {
            do {
                try await whisperService.setAPIKey(apiKey)
                isValidating = false
                showSuccess = true
                await loadMonthlyStats()
            } catch {
                isValidating = false
                validationError = error.localizedDescription
            }
        }
    }

    private func deleteAPIKey() {
        do {
            try whisperService.removeAPIKey()
            monthlyStats = nil
        } catch {
            validationError = error.localizedDescription
        }
    }

    private func loadMonthlyStats() async {
        do {
            monthlyStats = try await costTrackingService.getCurrentMonthStats()
        } catch {
            print("[APIKeySettings] Failed to load stats: \(error)")
        }
    }
}

// MARK: - Preview

struct APIKeySettingsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            APIKeySettingsView()
                .environmentObject(OpenAIWhisperService())
                .environmentObject(CostTrackingService(context: PersistenceController.preview.container.viewContext))
                .environment(\.themeColors, .light)
        }
    }
}
