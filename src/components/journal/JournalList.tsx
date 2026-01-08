/**
 * Input: Database entries, refresh trigger from store, safe area insets
 * Output: Infinite scroll list of journal entries with Liquid Glass styling
 * Pos: Main scrollable content area showing all journal entries with header offset
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useDatabase } from '../../hooks/useDatabase';
import { useTheme } from '../../hooks/useTheme';
import { useJournalStore } from '../../stores/journalStore';
import { DayEntry } from './DayEntry';

interface EntryData {
  entryId: string;
  date: string;
  blocks: Array<{
    id: string;
    content: string;
    createdAt: number;
    position: number;
  }>;
}

// Large title header height on iOS
const HEADER_HEIGHT = Platform.OS === 'ios' ? 96 : 56;
const LARGE_TITLE_HEIGHT = Platform.OS === 'ios' ? 52 : 0;

export function JournalList() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isReady, getEntries } = useDatabase();
  const refreshTrigger = useJournalStore((state) => state.refreshTrigger);

  // Calculate top padding for transparent header with large title
  const headerPadding = insets.top + HEADER_HEIGHT + LARGE_TITLE_HEIGHT;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['journal-entries'],
    queryFn: async ({ pageParam = 0 }) => {
      return getEntries(pageParam, 20);
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 20) return undefined;
      return pages.length * 20;
    },
    initialPageParam: 0,
    enabled: isReady,
  });

  useEffect(() => {
    if (refreshTrigger > 0 && isReady) {
      refetch();
    }
  }, [refreshTrigger, isReady, refetch]);

  const entries = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  const formatDateHeader = useCallback((dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: EntryData }) => (
      <DayEntry
        entryId={item.entryId}
        date={item.date}
        dateLabel={formatDateHeader(item.date)}
        blocks={item.blocks}
      />
    ),
    [formatDateHeader]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListFooter = useCallback(() => {
    if (!isFetchingNextPage) return <View style={styles.bottomSpacer} />;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }, [isFetchingNextPage, colors]);

  const ListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No entries yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Tap the microphone to start recording your first voice note
        </Text>
      </View>
    );
  }, [isLoading, colors]);

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        renderItem={renderItem}
        keyExtractor={(item) => item.entryId}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerPadding },
        ]}
        scrollIndicatorInsets={{ top: headerPadding - insets.top }}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
