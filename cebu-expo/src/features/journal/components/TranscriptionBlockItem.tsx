/**
 * Input: TranscriptionBlock model, user interactions
 * Output: Component displaying transcription block with audio controls
 * Pos: List item component for transcription blocks within journal entries
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../ui/theme';
import { usePlayback } from '../../recording/hooks/usePlayback';
import type TranscriptionBlock from '../../../core/data/models/TranscriptionBlock';

interface TranscriptionBlockItemProps {
  block: TranscriptionBlock;
  index: number;
  onDelete?: (blockId: string) => void;
  onUpdate?: (blockId: string, content: string) => void;
  searchQuery?: string;
}

/**
 * Component for displaying a single transcription block
 */
export const TranscriptionBlockItem: React.FC<TranscriptionBlockItemProps> = ({
  block,
  index,
  onDelete,
  onUpdate,
  searchQuery = '',
}) => {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);
  const { isPlaying, togglePlayPause } = usePlayback(block.audioFilePath || undefined);

  /**
   * Highlight search matches in text
   */
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) {
      return <Text style={[styles.contentText, { color: colors.text }]}>{text}</Text>;
    }

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <Text style={[styles.contentText, { color: colors.text }]}>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text
              key={i}
              style={[styles.highlight, { backgroundColor: colors.warning + '40' }]}
            >
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  const formatTimestamp = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}分${remainingSeconds}秒`
      : `${remainingSeconds}秒`;
  };

  const handleSave = () => {
    if (editedContent.trim() !== block.content) {
      onUpdate?.(block.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(block.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      '删除录音',
      '确定要删除这条录音吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => onDelete?.(block.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.glassBackground }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.indexBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {formatTimestamp(block.createdAt)}
          </Text>
          {block.audioDurationMs > 0 && (
            <Text style={[styles.durationText, { color: colors.textTertiary }]}>
              {formatDuration(block.audioDurationMs)}
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          {block.audioFilePath && (
            <Pressable style={styles.iconButton} onPress={togglePlayPause}>
              <Ionicons
                name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
                size={24}
                color={colors.primary}
              />
            </Pressable>
          )}
          <Pressable style={styles.iconButton} onPress={() => setIsEditing(!isEditing)}>
            <Ionicons
              name={isEditing ? 'close' : 'create-outline'}
              size={20}
              color={colors.primary}
            />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.primary,
                backgroundColor: colors.backgroundSecondary + '80',
              },
            ]}
            value={editedContent}
            onChangeText={setEditedContent}
            multiline
            autoFocus
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.editActions}>
            <Pressable
              style={[
                styles.editButton,
                styles.cancelButton,
                { backgroundColor: colors.glassBackground },
              ]}
              onPress={handleCancel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                取消
              </Text>
            </Pressable>
            <Pressable
              style={[styles.editButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>保存</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        renderHighlightedText(block.content, searchQuery)
      )}

      {/* Audio metadata */}
      {block.audioFilePath && (
        <View style={styles.audioInfo}>
          <Ionicons name="musical-notes" size={12} color={colors.textTertiary} />
          <Text style={[styles.audioInfoText, { color: colors.textTertiary }]}>
            {block.audioFormat?.toUpperCase() || 'M4A'}
            {block.audioFileSize && ` · ${(block.audioFileSize / 1024).toFixed(1)}KB`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 12,
  },
  iconButton: {
    padding: 4,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  highlight: {
    fontWeight: '600',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  editContainer: {
    marginBottom: 8,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {},
  saveButton: {},
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  audioInfoText: {
    fontSize: 11,
  },
});
