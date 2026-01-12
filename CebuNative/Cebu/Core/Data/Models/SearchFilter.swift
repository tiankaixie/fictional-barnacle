/**
 * Input: User filter preferences for search
 * Output: SearchFilter struct with sort and date range options
 * Pos: Model for configuring advanced search filters
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation

/// Sort options for search results
enum SortOption: String, CaseIterable, Identifiable {
    case relevance = "相关性"
    case dateDesc = "日期 (新到旧)"
    case dateAsc = "日期 (旧到新)"

    var id: String { rawValue }
}

/// Search filter configuration
struct SearchFilter {
    var sortOption: SortOption = .relevance
    var startDate: Date?
    var endDate: Date?

    /// Returns true if any filter is active (non-default)
    var hasActiveFilters: Bool {
        startDate != nil || endDate != nil || sortOption != .relevance
    }

    /// Reset all filters to default
    mutating func reset() {
        sortOption = .relevance
        startDate = nil
        endDate = nil
    }
}
