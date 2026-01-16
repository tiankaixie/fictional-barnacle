/**
 * Simple journal list for testing
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import JournalRepository from '../../../core/data/repositories/JournalRepository';
import UserRepository from '../../../core/data/repositories/UserRepository';
import type JournalEntry from '../../../core/data/models/JournalEntry';

export const SimpleJournalList: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      console.log('[SimpleJournalList] Loading entries...');
      setLoading(true);

      const user = await UserRepository.getOrCreateLocalUser();
      console.log('[SimpleJournalList] Got user:', user.id);

      const result = await JournalRepository.getEntriesPaginated(user.id, 0, 20);
      console.log('[SimpleJournalList] Loaded', result.length, 'entries');

      setEntries(result.map(item => item.entry));
      setError(null);
    } catch (err) {
      console.error('[SimpleJournalList] Error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  console.log('[SimpleJournalList] Rendering, entries:', entries.length, 'loading:', loading);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>错误: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的日记</Text>
        <Text style={styles.subtitle}>共 {entries.length} 篇</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>还没有日记</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.dateText}>
                {new Date(item.date).toLocaleDateString('zh-CN')}
              </Text>
            </View>
          )}
        />
      )}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  text: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FF453A',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
