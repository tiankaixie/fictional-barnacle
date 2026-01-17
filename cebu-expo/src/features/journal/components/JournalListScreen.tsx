/**
 * Input: useJournalList hook, user interactions
 * Output: Full journal list screen with search, filters, and infinite scroll
 * Pos: Main journal list view with Liquid Glass UI
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { GlassBackground } from '../../../ui/components';
import { useTheme } from '../../../ui/theme';
import { useJournalList } from '../hooks/useJournalList';
import { useJournalStore } from '../stores/journalStore';
import { EntryCard } from './EntryCard';
import { SearchBar } from './SearchBar';
import { FilterSheet } from './FilterSheet';
import type JournalEntry from '../../../core/data/models/JournalEntry';

/**
 * Journal list screen with search, filters, and infinite scroll
 */
export const JournalListScreen: React.FC = () => {
  const { colors } = useTheme();
  const [showFilters, setShowFilters] = useState(false);

  const {
    entries,
    isLoading,
    isError,
    error,
    isRefreshing,
    isFetchingNextPage,
    loadMore,
    refresh,
    deleteEntry,
    deleteBlock,
    updateBlock,
  } = useJournalList();

  const { filters, setSearchQuery, setHasAudio, setDateFrom, setDateTo, resetFilters } =
    useJournalStore();

  const hasActiveFilters =
    filters.dateFrom !== null || filters.dateTo !== null || filters.hasAudio !== null;

  const renderItem = ({ item }: { item: JournalEntry }) => (
    <View style={styles.cardWrapper}>
      <EntryCard
        entry={item}
        onDelete={deleteEntry}
        onBlockDelete={(blockId) => deleteBlock({ blockId })}
        onBlockUpdate={(blockId, content) => updateBlock({ blockId, content })}
        searchQuery={filters.searchQuery}
      />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          加载更多...
        </Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            加载中...
          </Text>
        </View>
      );
    }

    const hasFiltersOrSearch = filters.searchQuery || hasActiveFilters;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>
          {hasFiltersOrSearch ? '🔍' : '📝'}
        </Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {hasFiltersOrSearch ? '没有找到日记' : '还没有日记'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
          {hasFiltersOrSearch
            ? '尝试调整搜索条件或筛选器'
            : '点击下方录音按钮开始记录'}
        </Text>
      </View>
    );
  };

  if (isError) {
    return (
      <GlassBackground>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>
            加载失败
          </Text>
          <Text style={[styles.errorDetail, { color: colors.textTertiary }]}>
            {error?.toString()}
          </Text>
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>我的日记</Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            共 {entries.length} 篇
          </Text>
        </View>

        {/* Search bar */}
        <SearchBar
          value={filters.searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setShowFilters(true)}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Journal list */}
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={
            entries.length === 0 ? styles.emptyList : styles.list
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Filter sheet */}
        <FilterSheet
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          hasAudio={filters.hasAudio}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onHasAudioChange={setHasAudio}
          onReset={resetFilters}
        />
      </View>
    </GlassBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardWrapper: {
    marginHorizontal: 20, // Card spacing from screen edges
    marginVertical: 12,   // Card spacing between items (was 8)
  },
  header: {
    paddingHorizontal: 24, // More spacious (was 20)
    paddingTop: 24,        // More spacious (was 20)
    paddingBottom: 16,     // More spacious (was 12)
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,   // Tighter tracking
    marginBottom: 6,       // More space (was 4)
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    paddingVertical: 12, // More comfortable (was 8)
    paddingBottom: 32,   // More comfortable (was 24)
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48, // More spacious (was 32)
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
  },
});
