/**
 * Input: JournalEntry model, user interactions
 * Output: Card component displaying journal entry
 * Pos: List item component for journal entries
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../ui/components';
import { useTheme } from '../../../ui/theme';
import type JournalEntry from '../../../core/data/models/JournalEntry';
import type TranscriptionBlock from '../../../core/data/models/TranscriptionBlock';
import { TranscriptionBlockItem } from './TranscriptionBlockItem';

interface EntryCardProps {
  entry: JournalEntry;
  onDelete?: (entryId: string) => void;
  onBlockDelete?: (blockId: string) => void;
  onBlockUpdate?: (blockId: string, content: string) => void;
  searchQuery?: string;
}

/**
 * Card component for displaying a journal entry with its transcription blocks
 */
export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onDelete,
  onBlockDelete,
  onBlockUpdate,
  searchQuery = '',
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [blocks, setBlocks] = useState<TranscriptionBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBlocks = async () => {
    try {
      setIsLoading(true);
      const entryBlocks = await entry.blocks.fetch();
      setBlocks(entryBlocks.filter((b: TranscriptionBlock) => !b.deletedFlag));
    } catch (error) {
      console.error('[EntryCard] Failed to load blocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
  };

  const handleDelete = () => {
    Alert.alert(
      '删除日记',
      '确定要删除这篇日记吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => onDelete?.(entry.id),
        },
      ]
    );
  };

  const audioBlocksCount = blocks.filter((b) => b.audioFilePath).length;

  return (
    <GlassCard style={styles.card} intensity={15}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerLeft}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(entry.date)}
          </Text>
        </Pressable>

        <View style={styles.headerRight}>
          {audioBlocksCount > 0 && (
            <View style={[styles.audioBadge, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="mic" size={14} color={colors.primary} />
              <Text style={[styles.audioBadgeText, { color: colors.primary }]}>
                {audioBlocksCount}
              </Text>
            </View>
          )}
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {isExpanded && (
        <View style={styles.content}>
          {isLoading ? (
            <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
              加载中...
            </Text>
          ) : blocks.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              暂无内容
            </Text>
          ) : (
            blocks.map((block, index) => (
              <TranscriptionBlockItem
                key={block.id}
                block={block}
                index={index}
                onDelete={onBlockDelete}
                onUpdate={onBlockUpdate}
                searchQuery={searchQuery}
              />
            ))
          )}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  audioBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
