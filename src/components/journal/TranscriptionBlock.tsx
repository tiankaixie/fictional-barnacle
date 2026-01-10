/**
 * Input: Block content, edit state, callbacks
 * Output: Single transcription block with optional editing
 * Pos: Individual text block within a day entry
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useDatabase } from '../../hooks/useDatabase';
import { useJournalStore } from '../../stores/journalStore';

interface TranscriptionBlockProps {
  blockId: string;
  content: string;
  createdAt: number;
  isEditable: boolean;
  isLast: boolean;
}

export function TranscriptionBlock({
  blockId,
  content,
  createdAt,
  isEditable,
  isLast,
}: TranscriptionBlockProps) {
  const { colors } = useTheme();
  const { updateBlock, deleteBlock } = useDatabase();
  const { triggerRefresh } = useJournalStore();
  const [editedContent, setEditedContent] = useState(content);
  const [originalContent, setOriginalContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Sync content when props change (after save/refresh)
  useEffect(() => {
    setEditedContent(content);
    setOriginalContent(content);
  }, [content]);

  useEffect(() => {
    if (isEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditable]);

  const handleSave = useCallback(async () => {
    if (editedContent.trim() === '') {
      Alert.alert('Error', 'Content cannot be empty');
      return;
    }

    if (editedContent === originalContent) {
      return;
    }

    setIsSaving(true);
    try {
      const trimmedContent = editedContent.trim();
      await updateBlock(blockId, trimmedContent, originalContent);

      // Update originalContent to the saved content so Save button disappears
      setOriginalContent(trimmedContent);
      setEditedContent(trimmedContent);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Refresh list to show updated data
      triggerRefresh();

      console.log('[TranscriptionBlock] Save successful');
    } catch (error) {
      console.error('Failed to update block:', error);
      Alert.alert('Error', 'Failed to save changes');
      setEditedContent(originalContent);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [editedContent, originalContent, blockId, updateBlock, triggerRefresh]);

  const handleCancel = useCallback(() => {
    setEditedContent(originalContent);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [originalContent]);

  const handleDelete = useCallback(async () => {
    Alert.alert(
      'Delete Block',
      'Are you sure you want to delete this transcription?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBlock(blockId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              triggerRefresh();
            } catch (error) {
              console.error('Failed to delete block:', error);
              Alert.alert('Error', 'Failed to delete transcription');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  }, [blockId, deleteBlock, triggerRefresh]);

  const timeLabel = format(new Date(createdAt), 'h:mm a');
  const hasChanges = editedContent !== originalContent;

  return (
    <View style={[styles.container, !isLast && styles.withBorder]}>
      {/* Time and action buttons */}
      <View style={styles.header}>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {timeLabel}
        </Text>

        {isEditable && (
          <View style={styles.actionButtons}>
            {/* Delete button */}
            <Pressable
              onPress={handleDelete}
              style={[styles.actionButton, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}
            >
              <Text style={[styles.actionButtonText, { color: colors.recordingRed }]}>
                Delete
              </Text>
            </Pressable>

            {/* Cancel button */}
            {hasChanges && (
              <Pressable
                onPress={handleCancel}
                style={[styles.actionButton, { backgroundColor: colors.glassBackground }]}
              >
                <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
            )}

            {/* Save button */}
            {hasChanges && (
              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primaryGlow },
                  isSaving && styles.actionButtonDisabled,
                ]}
              >
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {isEditable ? (
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.glassBackground,
              borderColor: hasChanges ? colors.primary : colors.glassBorder,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.content, styles.input, { color: colors.text }]}
            value={editedContent}
            onChangeText={setEditedContent}
            multiline
            textAlignVertical="top"
            placeholder="Enter text..."
            placeholderTextColor={colors.textSecondary}
            editable={!isSaving}
          />
        </View>
      ) : (
        <Text style={[styles.content, { color: colors.text }]}>
          {content}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  withBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    fontSize: 17,
    lineHeight: 26,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
  },
  input: {
    padding: 0,
    margin: 0,
    minHeight: 52,
  },
});
