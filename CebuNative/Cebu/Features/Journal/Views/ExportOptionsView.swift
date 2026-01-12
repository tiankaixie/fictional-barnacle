/**
 * Input: 导出的日记条目
 * Output: 格式选择和导出触发 UI
 * Pos: 导出配置的 Modal Sheet
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct ExportOptionsView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.themeColors) var colors
    @StateObject private var exportService = ExportService()

    let entries: [JournalEntryWithBlocks]

    @State private var selectedFormat: ExportService.ExportFormat = .markdown
    @State private var showShareSheet = false
    @State private var exportedFileURL: URL?
    @State private var isExporting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Format picker
                Picker("格式", selection: $selectedFormat) {
                    Text("文本").tag(ExportService.ExportFormat.text)
                    Text("Markdown").tag(ExportService.ExportFormat.markdown)
                    Text("PDF").tag(ExportService.ExportFormat.pdf)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.top, 20)

                // Preview information
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "doc.text")
                            .foregroundColor(colors.primary)
                        Text("\(entries.count) 条日记")
                            .font(.body)
                    }

                    HStack {
                        Image(systemName: "text.bubble")
                            .foregroundColor(colors.primary)
                        Text("共 \(entries.flatMap(\.blocks).count) 条笔记")
                            .font(.body)
                    }
                }
                .foregroundColor(colors.text)
                .padding(.horizontal)

                // Format description
                VStack(alignment: .leading, spacing: 6) {
                    Text(formatDescription)
                        .font(.caption)
                        .foregroundColor(colors.textSecondary)
                }
                .padding(.horizontal)

                Spacer()

                // Error message
                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal)
                }

                // Export button
                Button(action: handleExport) {
                    HStack {
                        if isExporting {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Image(systemName: "square.and.arrow.up")
                            Text("导出")
                        }
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isExporting ? colors.textSecondary : colors.primary)
                    )
                }
                .disabled(isExporting)
                .padding(.horizontal)
                .padding(.bottom, 30)
            }
            .background(colors.background.ignoresSafeArea())
            .navigationTitle("导出日记")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("取消") {
                        dismiss()
                    }
                    .foregroundColor(colors.text)
                }
            }
            .sheet(isPresented: $showShareSheet) {
                if let url = exportedFileURL {
                    ShareSheet(activityItems: [url]) {
                        dismiss()
                        exportService.cleanupTemporaryFiles()
                    }
                }
            }
        }
    }

    private var formatDescription: String {
        switch selectedFormat {
        case .text:
            return "纯文本格式，适合简单阅读和编辑"
        case .markdown:
            return "Markdown 格式，保留标题和格式结构"
        case .pdf:
            return "PDF 格式，适合打印和分享"
        }
    }

    private func handleExport() {
        errorMessage = nil
        isExporting = true

        Task {
            do {
                let url = try await export()
                exportedFileURL = url
                showShareSheet = true
            } catch let error as ExportService.ExportError {
                errorMessage = error.localizedDescription
            } catch {
                errorMessage = "导出失败: \(error.localizedDescription)"
            }
            isExporting = false
        }
    }

    private func export() async throws -> URL {
        // Add small delay for better UX
        try await Task.sleep(nanoseconds: 300_000_000)

        switch selectedFormat {
        case .text:
            return try exportService.exportAsText(entries)
        case .markdown:
            return try exportService.exportAsMarkdown(entries)
        case .pdf:
            return try exportService.exportAsPDF(entries)
        }
    }
}

// MARK: - Preview

#Preview {
    let entries: [JournalEntryWithBlocks] = []
    return ExportOptionsView(entries: entries)
        .environment(\.themeColors, .light)
}
