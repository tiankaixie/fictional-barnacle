/**
 * Input: Search filter state, callbacks for apply and reset
 * Output: Collapsible panel with date range and sort options
 * Pos: Advanced search filter controls
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI
import UIKit

struct SearchFilterPanel: View {
    @Environment(\.themeColors) var colors
    @Binding var filter: SearchFilter
    let onApply: () -> Void
    let onReset: () -> Void

    @State private var startDate: Date = Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date()
    @State private var endDate: Date = Date()

    var body: some View {
        VStack(spacing: 16) {
            // Sort options
            VStack(alignment: .leading, spacing: 8) {
                Text("排序方式")
                    .font(.caption)
                    .foregroundColor(colors.textSecondary)

                Picker("排序", selection: $filter.sortOption) {
                    ForEach(SortOption.allCases) { option in
                        Text(option.rawValue).tag(option)
                    }
                }
                .pickerStyle(.segmented)
            }

            Divider()
                .background(colors.border.opacity(0.3))

            // Date range
            VStack(alignment: .leading, spacing: 12) {
                Text("日期范围")
                    .font(.caption)
                    .foregroundColor(colors.textSecondary)

                // Start date
                HStack {
                    DatePicker(
                        "从",
                        selection: Binding(
                            get: { filter.startDate ?? startDate },
                            set: { filter.startDate = $0 }
                        ),
                        displayedComponents: .date
                    )
                    .datePickerStyle(.compact)

                    if filter.startDate != nil {
                        Button {
                            filter.startDate = nil
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(colors.textTertiary)
                        }
                        .buttonStyle(.plain)
                    }
                }

                // End date
                HStack {
                    DatePicker(
                        "到",
                        selection: Binding(
                            get: { filter.endDate ?? endDate },
                            set: { filter.endDate = $0 }
                        ),
                        displayedComponents: .date
                    )
                    .datePickerStyle(.compact)

                    if filter.endDate != nil {
                        Button {
                            filter.endDate = nil
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(colors.textTertiary)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            Divider()
                .background(colors.border.opacity(0.3))

            // Action buttons
            HStack(spacing: 12) {
                // Reset button
                Button {
                    // Haptic feedback
                    let generator = UIImpactFeedbackGenerator(style: .light)
                    generator.impactOccurred()

                    onReset()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.system(size: 14, weight: .semibold))
                        Text("重置")
                            .font(.system(size: 15, weight: .medium))
                    }
                    .foregroundColor(colors.text)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(.ultraThinMaterial)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .strokeBorder(colors.border.opacity(0.5), lineWidth: 1)
                            )
                    }
                }

                // Apply button
                Button {
                    // Haptic feedback
                    let generator = UIImpactFeedbackGenerator(style: .medium)
                    generator.impactOccurred()

                    onApply()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 14, weight: .semibold))
                        Text("应用")
                            .font(.system(size: 15, weight: .medium))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
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
            }
        }
        .padding(16)
        .background(.ultraThinMaterial)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(colors.glassBackground.opacity(0.5))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(colors.glassBorder.opacity(0.3), lineWidth: 1)
        )
        .shadow(color: colors.glassShadow.opacity(0.2), radius: 12, x: 0, y: 4)
        .padding(.horizontal, 16)
    }
}

// MARK: - Preview

struct SearchFilterPanel_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Light mode preview
            SearchFilterPanelPreviewWrapper(filter: SearchFilter())
                .previewDisplayName("Filter Panel")
                .environment(\.themeColors, .light)

            // Dark mode preview
            SearchFilterPanelPreviewWrapper(
                filter: SearchFilter(
                    sortOption: .dateAsc,
                    startDate: Date(),
                    endDate: Date()
                )
            )
            .previewDisplayName("Dark Mode")
            .environment(\.themeColors, .dark)
            .preferredColorScheme(.dark)
        }
    }
}

private struct SearchFilterPanelPreviewWrapper: View {
    @State var filter: SearchFilter

    var body: some View {
        VStack(spacing: 20) {
            SearchFilterPanel(
                filter: $filter,
                onApply: { print("Apply tapped") },
                onReset: { filter.reset() }
            )

            Spacer()
        }
        .padding()
        .liquidGlassBackground()
    }
}
