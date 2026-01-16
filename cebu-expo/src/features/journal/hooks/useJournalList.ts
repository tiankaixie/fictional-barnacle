/**
 * Input: JournalStore filters, TanStack Query
 * Output: Journal list data, CRUD operations, infinite scroll support
 * Pos: React hook for journal list management with pagination
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useJournalStore } from '../stores/journalStore';
import JournalRepository from '../../../core/data/repositories/JournalRepository';
import UserRepository from '../../../core/data/repositories/UserRepository';
import type JournalEntry from '../../../core/data/models/JournalEntry';
import type TranscriptionBlock from '../../../core/data/models/TranscriptionBlock';

const QUERY_KEY = 'journal-entries';

/**
 * Hook for journal list with infinite scroll and filters
 */
export const useJournalList = () => {
  const queryClient = useQueryClient();
  const { filters, pagination, setPage, setHasMore, isRefreshing, setRefreshing } = useJournalStore();

  // Infinite query for paginated journal entries
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        console.log('[useJournalList] Loading page:', pageParam);
        const user = await UserRepository.getOrCreateLocalUser();
        const offset = pageParam * pagination.pageSize;

        // Apply filters
        if (filters.searchQuery) {
          const result = await JournalRepository.searchEntries(
            user.id,
            filters.searchQuery,
            {
              startDate: filters.dateFrom || undefined,
              endDate: filters.dateTo || undefined,
            },
            offset,
            pagination.pageSize
          );
          console.log('[useJournalList] Search result:', result.length, 'entries');
          return result.map(item => item.entry);
        }

        // Default: get all entries
        const result = await JournalRepository.getEntriesPaginated(
          user.id,
          offset,
          pagination.pageSize
        );
        console.log('[useJournalList] Loaded', result.length, 'entries');
        return result.map(item => item.entry);
      } catch (err) {
        console.error('[useJournalList] Query error:', err);
        throw err;
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage.length === pagination.pageSize;
      setHasMore(hasMore);
      return hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  });

  // Load more entries
  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
      setPage(pagination.currentPage + 1);
    }
  };

  // Refresh entries
  const refresh = async () => {
    setRefreshing(true);
    setPage(0);
    await refetch();
    setRefreshing(false);
  };

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const entry = await JournalRepository['db'].get<JournalEntry>('journal_entries').find(entryId);
      await JournalRepository.deleteEntry(entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  // Delete transcription block mutation
  const deleteBlockMutation = useMutation({
    mutationFn: async ({ blockId }: { blockId: string }) => {
      const block = await JournalRepository['db'].get<TranscriptionBlock>('transcription_blocks').find(blockId);
      await JournalRepository.deleteTranscriptionBlock(block);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  // Update block content mutation
  const updateBlockMutation = useMutation({
    mutationFn: async ({ blockId, content }: { blockId: string; content: string }) => {
      const block = await JournalRepository['db'].get<TranscriptionBlock>('transcription_blocks').find(blockId);
      await JournalRepository.updateTranscriptionBlock(block, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  // Flatten paginated data
  const entries: JournalEntry[] = data?.pages.flat() ?? [];

  return {
    // Data
    entries,
    isLoading,
    isError,
    error,
    isRefreshing,

    // Pagination
    hasNextPage,
    isFetchingNextPage,
    loadMore,

    // Actions
    refresh,
    deleteEntry: deleteEntryMutation.mutate,
    deleteBlock: deleteBlockMutation.mutate,
    updateBlock: updateBlockMutation.mutate,

    // Mutation states
    isDeleting: deleteEntryMutation.isPending || deleteBlockMutation.isPending,
    isUpdating: updateBlockMutation.isPending,
  };
};
