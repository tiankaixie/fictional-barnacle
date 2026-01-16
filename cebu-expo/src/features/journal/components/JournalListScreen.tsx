/**
 * Input: useJournalList hook, user interactions
 * Output: Full journal list screen with infinite scroll
 * Pos: Main journal list view
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useJournalList } from '../hooks/useJournalList';
import { EntryCard } from './EntryCard';
import type JournalEntry from '../../../core/data/models/JournalEntry';

/**
 * Journal list screen with infinite scroll and pull-to-refresh
 */
export const JournalListScreen: React.FC = () => {
  console.log('[JournalListScreen] Rendering');

  const {
    entries,
    isLoading,
    isError,
    error,
    isRefreshing,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    refresh,
    deleteEntry,
    deleteBlock,
    updateBlock,
  } = useJournalList();

  console.log('[JournalListScreen] State:', {
    entriesCount: entries.length,
    isLoading,
    isError
  });

  const renderItem = ({ item }: { item: JournalEntry }) => (
    <EntryCard
      entry={item}
      onDelete={deleteEntry}
      onBlockDelete={(blockId) => deleteBlock({ blockId })}
      onBlockUpdate={(blockId, content) => updateBlock({ blockId, content })}
    />
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>加载更多...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>加载中...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>还没有日记</Text>
        <Text style={styles.emptySubtitle}>点击下方录音按钮开始记录</Text>
      </View>
    );
  };

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>加载失败</Text>
        <Text style={styles.errorDetail}>{error?.toString()}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的日记</Text>
        <Text style={styles.subtitle}>共 {entries.length} 篇</Text>
      </View>

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
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
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
    color: '#8E8E93',
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
    color: '#FF453A',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
