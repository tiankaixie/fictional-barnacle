/**
 * Input: Journal entry with blocks, edit state, callbacks
 * Output: Day card displaying all transcription blocks for that day
 * Pos: Grouped entry card shown in journal list
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct DayEntryView: View {
    @Environment(\.themeColors) var colors

    let entryWithBlocks: JournalEntryWithBlocks
    let isEditing: Bool
    let onToggleEdit: () -> Void
    let onUpdateBlock: (TranscriptionBlock, String) -> Void
    let onDeleteBlock: (TranscriptionBlock) -> Void

    @State private var editingBlockId: UUID?
    @State private var showExportSheet = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header with date
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(entryWithBlocks.formattedDate)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(colors.text)

                    HStack(spacing: 4) {
                        if isEditing {
                            Image(systemName: "pencil")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(colors.primary)
                        }
                        Text("\(entryWithBlocks.blocks.count) \(entryWithBlocks.blocks.count == 1 ? "note" : "notes")")
                            .font(.caption)
                            .foregroundColor(isEditing ? colors.primary : colors.textSecondary)
                    }
                }

                Spacer()

                // Done button when editing
                if isEditing {
                    Button(action: onToggleEdit) {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 14, weight: .semibold))
                            Text("Done")
                                .font(.system(size: 15, weight: .medium))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
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
                        .shadow(color: colors.primary.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    .transition(.scale(scale: 0.9).combined(with: .opacity))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(
                isEditing
                    ? AnyView(
                        LinearGradient(
                            colors: [
                                colors.primary.opacity(0.08),
                                colors.primary.opacity(0.03)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    : AnyView(colors.glassBackground.opacity(0.3))
            )
            .overlay(
                Rectangle()
                    .fill(isEditing ? colors.primary.opacity(0.2) : colors.border)
                    .frame(height: 1),
                alignment: .bottom
            )
            .animation(.spring(response: 0.35, dampingFraction: 0.7), value: isEditing)

            // Blocks or empty state
            if entryWithBlocks.blocks.isEmpty {
                emptyStateView
            } else {
                ForEach(Array(entryWithBlocks.blocks.enumerated()), id: \.element.id) { index, block in
                    TranscriptionBlockView(
                        block: block,
                        isEditable: isEditing,
                        isLast: index == entryWithBlocks.blocks.count - 1,
                        onSave: { newContent in
                            onUpdateBlock(block, newContent)
                            editingBlockId = nil
                        },
                        onCancel: {
                            editingBlockId = nil
                        },
                        onDelete: {
                            showDeleteConfirmation(for: block)
                        }
                    )
                }
            }
        }
        .liquidGlassCard(padding: 0)
        .onLongPressGesture {
            // Haptic feedback
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()

            // Toggle edit mode
            onToggleEdit()
        }
        .contextMenu {
            Button {
                showExportSheet = true
            } label: {
                Label("导出此日记", systemImage: "square.and.arrow.up")
            }
        }
        .sheet(isPresented: $showExportSheet) {
            ExportOptionsView(entries: [entryWithBlocks])
        }
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 12) {
            Image(systemName: "mic.slash")
                .font(.system(size: 40))
                .foregroundColor(colors.textTertiary)

            if Calendar.current.isDateInToday(entryWithBlocks.date) {
                Text("No notes yet today")
                    .font(.subheadline)
                    .foregroundColor(colors.textSecondary)

                Text("Tap the voice button to start")
                    .font(.caption)
                    .foregroundColor(colors.textTertiary)
            } else {
                Text("No notes this day")
                    .font(.subheadline)
                    .foregroundColor(colors.textSecondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    // MARK: - Actions

    private func showDeleteConfirmation(for block: TranscriptionBlock) {
        // Note: In production, use .confirmationDialog or .alert
        onDeleteBlock(block)

        // Haptic feedback
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.warning)
    }
}

// MARK: - Preview

#Preview("Day with Blocks") {
    let context = PersistenceController.preview.container.viewContext

    let user = User(context: context)
    user.id = UUID()
    user.displayName = "Test User"

    let entry = JournalEntry(context: context)
    entry.id = UUID()
    entry.date = Date()
    entry.user = user

    let block1 = TranscriptionBlock(context: context)
    block1.id = UUID()
    block1.content = "This is the first transcription of the day. It contains some thoughts about the morning."
    block1.position = 0
    block1.createdAt = Date().addingTimeInterval(-3600)
    block1.entry = entry

    let block2 = TranscriptionBlock(context: context)
    block2.id = UUID()
    block2.content = "This is a second note, added later in the day."
    block2.position = 1
    block2.createdAt = Date()
    block2.entry = entry

    let entryWithBlocks = JournalEntryWithBlocks(
        entry: entry,
        blocks: [block1, block2]
    )

    return ScrollView {
        DayEntryView(
            entryWithBlocks: entryWithBlocks,
            isEditing: false,
            onToggleEdit: {},
            onUpdateBlock: { _, _ in },
            onDeleteBlock: { _ in }
        )
        .padding()
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}

#Preview("Day Editing") {
    let context = PersistenceController.preview.container.viewContext

    let user = User(context: context)
    user.id = UUID()
    user.displayName = "Test User"

    let entry = JournalEntry(context: context)
    entry.id = UUID()
    entry.date = Date()
    entry.user = user

    let block1 = TranscriptionBlock(context: context)
    block1.id = UUID()
    block1.content = "Editing this block"
    block1.position = 0
    block1.createdAt = Date()
    block1.entry = entry

    let entryWithBlocks = JournalEntryWithBlocks(
        entry: entry,
        blocks: [block1]
    )

    return ScrollView {
        DayEntryView(
            entryWithBlocks: entryWithBlocks,
            isEditing: true,
            onToggleEdit: {},
            onUpdateBlock: { _, _ in },
            onDeleteBlock: { _ in }
        )
        .padding()
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .dark)
    .preferredColorScheme(.dark)
}

#Preview("Empty Day") {
    let context = PersistenceController.preview.container.viewContext

    let user = User(context: context)
    user.id = UUID()

    let entry = JournalEntry(context: context)
    entry.id = UUID()
    entry.date = Date()
    entry.user = user

    let entryWithBlocks = JournalEntryWithBlocks(
        entry: entry,
        blocks: []
    )

    return ScrollView {
        DayEntryView(
            entryWithBlocks: entryWithBlocks,
            isEditing: false,
            onToggleEdit: {},
            onUpdateBlock: { _, _ in },
            onDeleteBlock: { _ in }
        )
        .padding()
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}
