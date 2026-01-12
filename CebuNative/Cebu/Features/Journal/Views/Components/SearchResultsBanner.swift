/**
 * Input: Search result count, search state
 * Output: Banner showing search statistics and empty state
 * Pos: Non-intrusive banner displayed during search operations
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct SearchResultsBanner: View {
    @Environment(\.themeColors) var colors

    let resultCount: Int
    let isSearching: Bool
    let hasQuery: Bool

    var body: some View {
        if hasQuery {
            HStack(spacing: 8) {
                // Icon
                Image(systemName: iconName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(iconColor)

                // Status text
                Text(statusText)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(textColor)

                Spacer()
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .background(.ultraThinMaterial)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(backgroundColor)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(borderColor, lineWidth: 1)
            )
            .padding(.horizontal, 16)
            .transition(.move(edge: .top).combined(with: .opacity))
            .animation(.spring(response: 0.35, dampingFraction: 0.7), value: resultCount)
        }
    }

    // MARK: - Computed Properties

    private var statusText: String {
        if resultCount > 0 {
            return "找到 \(resultCount) 条匹配"
        } else {
            return "未找到结果"
        }
    }

    private var iconName: String {
        resultCount > 0 ? "checkmark.circle.fill" : "exclamationmark.circle"
    }

    private var iconColor: Color {
        resultCount > 0 ? colors.success : colors.textSecondary
    }

    private var textColor: Color {
        resultCount > 0 ? colors.text : colors.textSecondary
    }

    private var backgroundColor: Color {
        resultCount > 0 ? colors.success.opacity(0.05) : colors.background.opacity(0.5)
    }

    private var borderColor: Color {
        resultCount > 0 ? colors.success.opacity(0.2) : colors.border.opacity(0.3)
    }
}

// MARK: - Preview

#Preview("Results Found") {
    VStack(spacing: 16) {
        SearchResultsBanner(
            resultCount: 5,
            isSearching: true,
            hasQuery: true
        )

        SearchResultsBanner(
            resultCount: 12,
            isSearching: true,
            hasQuery: true
        )
    }
    .padding()
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}

#Preview("No Results") {
    SearchResultsBanner(
        resultCount: 0,
        isSearching: true,
        hasQuery: true
    )
    .padding()
    .liquidGlassBackground()
    .environment(\.themeColors, .dark)
    .preferredColorScheme(.dark)
}
