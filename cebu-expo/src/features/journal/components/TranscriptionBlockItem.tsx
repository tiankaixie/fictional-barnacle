/**
 * Input: TranscriptionBlock model, user interactions
 * Output: Component displaying transcription block with audio controls
 * Pos: List item component for transcription blocks within journal entries
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type TranscriptionBlock from '../../../core/data/models/TranscriptionBlock';

interface TranscriptionBlockItemProps {
  block: TranscriptionBlock;
  index: number;
  onDelete?: (blockId: string) => void;
  onUpdate?: (blockId: string, content: string) => void;
}

/**
 * Component for displaying a single transcription block
 */
export const TranscriptionBlockItem: React.FC<TranscriptionBlockItemProps> = ({
  block,
  index,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <Text style={styles.timeText}>{formatTimestamp(block.createdAt)}</Text>
          {block.audioDurationMs > 0 && (
            <Text style={styles.durationText}>
              {formatDuration(block.audioDurationMs)}
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          {block.audioFilePath && (
            <Pressable style={styles.iconButton}>
              <Ionicons name="play-circle-outline" size={24} color="#007AFF" />
            </Pressable>
          )}
          <Pressable style={styles.iconButton} onPress={() => setIsEditing(!isEditing)}>
            <Ionicons
              name={isEditing ? 'close' : 'create-outline'}
              size={20}
              color="#007AFF"
            />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FF453A" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.textInput}
            value={editedContent}
            onChangeText={setEditedContent}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <Pressable style={[styles.editButton, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </Pressable>
            <Pressable style={[styles.editButton, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={styles.contentText}>{block.content}</Text>
      )}

      {/* Audio metadata */}
      {block.audioFilePath && (
        <View style={styles.audioInfo}>
          <Ionicons name="musical-notes" size={12} color="#8E8E93" />
          <Text style={styles.audioInfoText}>
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
    borderBottomColor: '#F2F2F7',
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
    backgroundColor: '#007AFF',
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
    color: '#000000',
  },
  durationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  iconButton: {
    padding: 4,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
    marginBottom: 8,
  },
  editContainer: {
    marginBottom: 8,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#007AFF',
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
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
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
    color: '#8E8E93',
  },
});
