/**
 * Input: JournalRepository, User
 * Output: Journal entries state, CRUD operations
 * Pos: ViewModel managing journal list display and interactions
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import Combine

@MainActor
class JournalListViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var entries: [JournalEntryWithBlocks] = []
    @Published var isLoading = false
    @Published var isRefreshing = false
    @Published var error: String?
    @Published var selectedEntryForEdit: UUID?

    // Search properties
    @Published var searchQuery: String = ""
    @Published var isSearching: Bool = false
    @Published var searchResults: [JournalEntryWithBlocks] = []
    @Published var activeSearchQuery: String = ""  // Track active search for highlighting

    // Search filter properties
    @Published var searchFilter = SearchFilter()
    @Published var showFilterPanel: Bool = false

    // MARK: - Private Properties
    private let repository: JournalRepository
    private let user: User
    private var currentOffset = 0
    private let pageSize = 20
    private var hasMorePages = true
    private var searchTask: Task<Void, Never>?

    // MARK: - Initialization

    init(repository: JournalRepository, user: User) {
        self.repository = repository
        self.user = user
    }

    // MARK: - Public Methods

    /// Load initial entries
    func loadEntries() async {
        guard !isLoading else { return }

        isLoading = true
        error = nil
        currentOffset = 0
        hasMorePages = true

        do {
            let fetchedEntries = try await repository.getEntriesPaginated(
                for: user,
                offset: currentOffset,
                limit: pageSize
            )

            entries = fetchedEntries
            currentOffset = fetchedEntries.count
            hasMorePages = fetchedEntries.count == pageSize

            print("[JournalListVM] Loaded \(fetchedEntries.count) entries")
        } catch {
            self.error = "Failed to load entries: \(error.localizedDescription)"
            print("[JournalListVM] Error: \(error)")
        }

        isLoading = false
    }

    /// Refresh entries (pull to refresh)
    func refreshEntries() async {
        guard !isRefreshing else { return }

        isRefreshing = true
        currentOffset = 0
        hasMorePages = true

        do {
            let fetchedEntries = try await repository.getEntriesPaginated(
                for: user,
                offset: 0,
                limit: pageSize
            )

            entries = fetchedEntries
            currentOffset = fetchedEntries.count
            hasMorePages = fetchedEntries.count == pageSize

            print("[JournalListVM] Refreshed \(fetchedEntries.count) entries")
        } catch {
            self.error = "Failed to refresh: \(error.localizedDescription)"
            print("[JournalListVM] Refresh error: \(error)")
        }

        isRefreshing = false
    }

    /// Load more entries (pagination)
    func loadMoreEntriesIfNeeded() async {
        guard !isLoading, hasMorePages else { return }

        isLoading = true

        do {
            let fetchedEntries = try await repository.getEntriesPaginated(
                for: user,
                offset: currentOffset,
                limit: pageSize
            )

            entries.append(contentsOf: fetchedEntries)
            currentOffset += fetchedEntries.count
            hasMorePages = fetchedEntries.count == pageSize

            print("[JournalListVM] Loaded \(fetchedEntries.count) more entries")
        } catch {
            self.error = "Failed to load more: \(error.localizedDescription)"
            print("[JournalListVM] Load more error: \(error)")
        }

        isLoading = false
    }

    /// Add new transcription to today's entry
    func addTranscription(_ text: String, audioDuration: Int? = nil) async -> TranscriptionBlock {
        do {
            let todayEntry = try await repository.getOrCreateTodayEntry(for: user)
            let block = try await repository.addTranscriptionBlock(
                to: todayEntry,
                content: text,
                audioDuration: audioDuration
            )

            // Refresh to show new block
            await refreshEntries()

            print("[JournalListVM] Added new transcription")
            return block
        } catch {
            self.error = "Failed to add transcription: \(error.localizedDescription)"
            print("[JournalListVM] Add transcription error: \(error)")
            fatalError("Failed to create transcription block")
        }
    }

    /// Update transcription block
    func updateBlock(_ block: TranscriptionBlock, newContent: String) async {
        do {
            try await repository.updateTranscriptionBlock(block, newContent: newContent)

            // Refresh to show updated content
            await refreshEntries()

            print("[JournalListVM] Updated block")
        } catch {
            self.error = "Failed to update: \(error.localizedDescription)"
            print("[JournalListVM] Update error: \(error)")
        }
    }

    /// Update audio metadata for transcription block
    func updateBlockAudioMetadata(_ block: TranscriptionBlock, path: String, size: Int64, format: String) async {
        do {
            try await repository.updateBlockAudioMetadata(block, path: path, size: size, format: format)

            // Refresh to show updated metadata
            await refreshEntries()

            print("[JournalListVM] Updated audio metadata")
        } catch {
            self.error = "Failed to update audio metadata: \(error.localizedDescription)"
            print("[JournalListVM] Audio metadata error: \(error)")
        }
    }

    /// Delete transcription block
    func deleteBlock(_ block: TranscriptionBlock) async {
        do {
            try await repository.deleteTranscriptionBlock(block)

            // Refresh to remove deleted block
            await refreshEntries()

            print("[JournalListVM] Deleted block")
        } catch {
            self.error = "Failed to delete: \(error.localizedDescription)"
            print("[JournalListVM] Delete error: \(error)")
        }
    }

    /// Delete entire entry
    func deleteEntry(_ entry: JournalEntry) async {
        do {
            try await repository.deleteEntry(entry)

            // Refresh to remove deleted entry
            await refreshEntries()

            print("[JournalListVM] Deleted entry")
        } catch {
            self.error = "Failed to delete entry: \(error.localizedDescription)"
            print("[JournalListVM] Delete entry error: \(error)")
        }
    }

    /// Toggle edit mode for an entry
    func toggleEditMode(for entryId: UUID) {
        if selectedEntryForEdit == entryId {
            selectedEntryForEdit = nil
        } else {
            selectedEntryForEdit = entryId
        }
    }

    /// Check if entry is in edit mode
    func isEditing(_ entryId: UUID) -> Bool {
        selectedEntryForEdit == entryId
    }

    /// Get today's entry (for quick access)
    func getTodaysEntry() -> JournalEntryWithBlocks? {
        let calendar = Calendar.current
        return entries.first { calendar.isDateInToday($0.date) }
    }

    /// Get statistics
    func getStatistics() async -> JournalStatistics? {
        do {
            let entryCount = try await repository.getEntryCount(for: user)
            let transcriptionCount = try await repository.getTranscriptionCount(for: user)

            return JournalStatistics(
                totalEntries: entryCount,
                totalTranscriptions: transcriptionCount
            )
        } catch {
            print("[JournalListVM] Stats error: \(error)")
            return nil
        }
    }

    // MARK: - Search Methods

    /// Update search query with debouncing
    func updateSearchQuery(_ query: String) {
        searchQuery = query
        searchTask?.cancel()

        guard !query.isEmpty else {
            isSearching = false
            searchResults = []
            activeSearchQuery = ""
            return
        }

        searchTask = Task {
            try? await Task.sleep(nanoseconds: 300_000_000) // 300ms debounce
            await performSearch()
        }
    }

    /// Perform search operation
    @MainActor
    private func performSearch() async {
        guard !searchQuery.isEmpty else {
            isSearching = false
            searchResults = []
            activeSearchQuery = ""
            return
        }

        isSearching = true

        do {
            searchResults = try await repository.searchEntries(
                for: user,
                query: searchQuery,
                filter: searchFilter
            )
            activeSearchQuery = searchQuery  // Update active query for highlighting
            print("[JournalListVM] Found \(searchResults.count) matching entries")
        } catch {
            self.error = "搜索失败: \(error.localizedDescription)"
            print("[JournalListVM] Search error: \(error)")
        }
    }

    /// Reset search filters to default
    func resetFilters() {
        searchFilter.reset()
        if !searchQuery.isEmpty {
            Task {
                await performSearch()
            }
        }
    }

    /// Apply current filters and refresh search
    func applyFilter() {
        if !searchQuery.isEmpty {
            Task {
                await performSearch()
            }
        }
    }
}

// MARK: - Helper Models

struct JournalStatistics {
    let totalEntries: Int
    let totalTranscriptions: Int
}
