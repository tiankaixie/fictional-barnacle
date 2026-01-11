/**
 * Input: Block content, edit state, callbacks
 * Output: Single transcription block with optional editing
 * Pos: Individual text block within a day entry
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct TranscriptionBlockView: View {
    @Environment(\.themeColors) var colors

    let block: TranscriptionBlock
    let isEditable: Bool
    let isLast: Bool
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
        onSave: @escaping (String) -> Void,
        onCancel: @escaping () -> Void,
        onDelete: @escaping () -> Void
    ) {
        self.block = block
        self.isEditable = isEditable
        self.isLast = isLast
        self.onSave = onSave
        self.onCancel = onCancel
        self.onDelete = onDelete
        _editedContent = State(initialValue: block.content)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Timestamp
            Text(formattedTime)
                .font(.caption)
                .foregroundColor(colors.textTertiary)

            // Content or editing field
            if isEditable {
                TextEditor(text: $editedContent)
                    .font(.body)
                    .foregroundColor(colors.text)
                    .frame(minHeight: 60)
                    .padding(8)
                    .background(colors.background.opacity(0.3))
                    .cornerRadius(8)
                    .focused($isFocused)
                    .onAppear {
                        isFocused = true
                    }
            } else {
                Text(block.content)
                    .font(.body)
                    .foregroundColor(colors.text)
                    .textSelection(.enabled)
            }

            // Action buttons when editing
            if isEditable {
                HStack(spacing: 12) {
                    // Save button
                    Button(action: handleSave) {
                        HStack(spacing: 4) {
                            if isSaving {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Save")
                            }
                        }
                        .font(.subheadline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(colors.success)
                        .cornerRadius(8)
                    }
                    .disabled(isSaving || !hasChanges)

                    // Cancel button
                    Button(action: handleCancel) {
                        HStack(spacing: 4) {
                            Image(systemName: "xmark.circle.fill")
                            Text("Cancel")
                        }
                        .font(.subheadline)
                        .foregroundColor(colors.text)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(colors.border.opacity(0.3))
                        .cornerRadius(8)
                    }
                    .disabled(isSaving)

                    Spacer()

                    // Delete button
                    Button(action: handleDelete) {
                        Image(systemName: "trash.fill")
                            .font(.subheadline)
                            .foregroundColor(colors.destructive)
                            .padding(8)
                            .background(colors.destructive.opacity(0.1))
                            .cornerRadius(8)
                    }
                    .disabled(isSaving)
                }
                .padding(.top, 4)
            }
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 16)
        .overlay(
            Rectangle()
                .fill(isLast ? Color.clear : colors.border)
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
