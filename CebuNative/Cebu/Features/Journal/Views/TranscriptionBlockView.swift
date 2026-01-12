/**
 * Input: Block content, edit state, callbacks
 * Output: Single transcription block with optional editing
 * Pos: Individual text block within a day entry
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI
import UIKit

struct TranscriptionBlockView: View {
    @Environment(\.themeColors) var colors

    let block: TranscriptionBlock
    let isEditable: Bool
    let isLast: Bool
    let searchQuery: String?  // Optional search query for highlighting
    let onSave: (String) -> Void
    let onCancel: () -> Void
    let onDelete: () -> Void

    @State private var editedContent: String
    @State private var isSaving = false
    @FocusState private var isFocused: Bool

    init(
        block: TranscriptionBlock,
        isEditable: Bool,
        isLast: Bool,
        searchQuery: String? = nil,
        onSave: @escaping (String) -> Void,
        onCancel: @escaping () -> Void,
        onDelete: @escaping () -> Void
    ) {
        self.block = block
        self.isEditable = isEditable
        self.isLast = isLast
        self.searchQuery = searchQuery
        self.onSave = onSave
        self.onCancel = onCancel
        self.onDelete = onDelete
        _editedContent = State(initialValue: block.content)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Timestamp
            Text(formattedTime)
                .font(.caption)
                .foregroundColor(colors.textTertiary)

            // Content or editing field
            if isEditable {
                VStack(spacing: 0) {
                    TextEditor(text: $editedContent)
                        .font(.body)
                        .foregroundColor(colors.text)
                        .frame(minHeight: 80)
                        .padding(12)
                        .background(Color.clear)
                        .focused($isFocused)
                        .scrollContentBackground(.hidden)
                }
                .background {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(.ultraThinMaterial)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            colors.primary.opacity(0.05),
                                            colors.primary.opacity(0.02)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .strokeBorder(
                                    LinearGradient(
                                        colors: [
                                            colors.primary.opacity(0.3),
                                            colors.primary.opacity(0.1)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1.5
                                )
                        )
                }
                .onAppear {
                    isFocused = true
                }
                .transition(.scale(scale: 0.98).combined(with: .opacity))
            } else {
                highlightedContent
                    .font(.body)
                    .textSelection(.enabled)
                    .transition(.opacity)
            }

            // Action buttons when editing
            if isEditable {
                HStack(spacing: 8) {
                    // Save button
                    Button(action: handleSave) {
                        HStack(spacing: 6) {
                            if isSaving {
                                ProgressView()
                                    .scaleEffect(0.7)
                                    .tint(.white)
                            } else {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 14, weight: .semibold))
                                Text("Save")
                                    .font(.system(size: 15, weight: .medium))
                            }
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            hasChanges ? colors.success : colors.success.opacity(0.5),
                                            hasChanges ? colors.success.opacity(0.8) : colors.success.opacity(0.3)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        )
                        .shadow(color: hasChanges ? colors.success.opacity(0.3) : Color.clear, radius: 8, x: 0, y: 4)
                    }
                    .disabled(isSaving || !hasChanges)
                    .opacity(hasChanges ? 1.0 : 0.6)

                    // Cancel button
                    Button(action: handleCancel) {
                        HStack(spacing: 6) {
                            Image(systemName: "xmark")
                                .font(.system(size: 14, weight: .semibold))
                            Text("Cancel")
                                .font(.system(size: 15, weight: .medium))
                        }
                        .foregroundColor(colors.text)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background {
                            RoundedRectangle(cornerRadius: 10)
                                .fill(.ultraThinMaterial)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .strokeBorder(colors.border.opacity(0.5), lineWidth: 1)
                                )
                        }
                    }
                    .disabled(isSaving)

                    Spacer()

                    // Delete button
                    Button(action: handleDelete) {
                        Image(systemName: "trash")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(colors.destructive)
                            .frame(width: 40, height: 40)
                            .background {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(.ultraThinMaterial)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .strokeBorder(colors.destructive.opacity(0.3), lineWidth: 1)
                                    )
                            }
                    }
                    .disabled(isSaving)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .padding(.vertical, 16)
        .padding(.horizontal, 16)
        .background {
            if isEditable {
                RoundedRectangle(cornerRadius: 16)
                    .fill(colors.glassBackground.opacity(0.3))
            } else {
                Color.clear
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.7), value: isEditable)
        .overlay(
            Rectangle()
                .fill(isLast ? Color.clear : colors.border.opacity(0.3))
                .frame(height: 1),
            alignment: .bottom
        )
    }

    // MARK: - Computed Properties

    private var formattedTime: String {
        guard let createdAt = block.createdAt else { return "" }

        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: createdAt)
    }

    private var hasChanges: Bool {
        editedContent.trimmingCharacters(in: .whitespacesAndNewlines) != block.content
    }

    /// Highlighted content with search query matches
    private var highlightedContent: Text {
        if let query = searchQuery, !query.isEmpty {
            block.content.highlighted(
                matching: query,
                highlightColor: colors.primary,
                baseColor: colors.text
            )
        } else {
            Text(block.content).foregroundColor(colors.text)
        }
    }

    // MARK: - Actions

    private func handleSave() {
        let trimmed = editedContent.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmed.isEmpty else {
            // Show error - content cannot be empty
            return
        }

        guard trimmed != block.content else {
            // No changes
            return
        }

        // Haptic feedback
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)

        isSaving = true
        onSave(trimmed)
        isSaving = false
    }

    private func handleCancel() {
        editedContent = block.content

        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()

        onCancel()
    }

    private func handleDelete() {
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        onDelete()
    }
}

// MARK: - Preview

#Preview("Normal Block") {
    TranscriptionBlockView(
        block: {
            let block = TranscriptionBlock(context: PersistenceController.preview.container.viewContext)
            block.id = UUID()
            block.content = "This is a sample transcription block. It contains some text that was transcribed from voice."
            block.createdAt = Date()
            return block
        }(),
        isEditable: false,
        isLast: false,
        onSave: { _ in },
        onCancel: {},
        onDelete: {}
    )
    .liquidGlassCard()
    .padding()
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}

#Preview("Editing Block") {
    TranscriptionBlockView(
        block: {
            let block = TranscriptionBlock(context: PersistenceController.preview.container.viewContext)
            block.id = UUID()
            block.content = "This is being edited"
            block.createdAt = Date()
            return block
        }(),
        isEditable: true,
        isLast: false,
        onSave: { _ in },
        onCancel: {},
        onDelete: {}
    )
    .liquidGlassCard()
    .padding()
    .liquidGlassBackground()
    .environment(\.themeColors, .dark)
    .preferredColorScheme(.dark)
}

// MARK: - String Extension for Text Highlighting

extension String {
    /// Highlight matching text with specified colors
    /// Supports case-insensitive and diacritic-insensitive matching for Chinese/English
    func highlighted(matching query: String, highlightColor: Color, baseColor: Color) -> Text {
        guard !query.isEmpty else {
            return Text(self).foregroundColor(baseColor)
        }

        var result = Text("")
        var searchRange = self.startIndex..<self.endIndex

        // Find all occurrences of the query (case and diacritic insensitive)
        while let range = self.range(
            of: query,
            options: [.caseInsensitive, .diacriticInsensitive],
            range: searchRange
        ) {
            // Add text before the match
            if searchRange.lowerBound < range.lowerBound {
                let beforeText = String(self[searchRange.lowerBound..<range.lowerBound])
                result = result + Text(beforeText).foregroundColor(baseColor)
            }

            // Add highlighted match
            let matchedText = String(self[range])
            result = result + Text(matchedText)
                .foregroundColor(highlightColor)
                .fontWeight(.semibold)

            // Update search range to continue after this match
            searchRange = range.upperBound..<searchRange.upperBound
        }

        // Add remaining text after last match
        if searchRange.lowerBound < searchRange.upperBound {
            let remainingText = String(self[searchRange])
            result = result + Text(remainingText).foregroundColor(baseColor)
        }

        return result
    }
}
