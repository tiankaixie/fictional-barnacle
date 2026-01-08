/**
 * Input: Block content, edit state, callbacks
 * Output: Single transcription block with optional editing
 * Pos: Individual text block within a day entry
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { useDatabase } from '../../hooks/useDatabase';

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
  const { updateBlock } = useDatabase();
  const [editedContent, setEditedContent] = useState(content);
  const [originalContent] = useState(content);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditable]);

  const handleBlur = useCallback(async () => {
    if (editedContent !== originalContent && editedContent.trim()) {
      try {
        await updateBlock(blockId, editedContent.trim(), originalContent);
      } catch (error) {
        console.error('Failed to update block:', error);
        setEditedContent(originalContent);
      }
    }
  }, [editedContent, originalContent, blockId, updateBlock]);

  const timeLabel = format(new Date(createdAt), 'h:mm a');

  return (
    <View style={[styles.container, !isLast && styles.withBorder]}>
      <Text style={[styles.time, { color: colors.textSecondary }]}>
        {timeLabel}
      </Text>
      {isEditable ? (
        <TextInput
          ref={inputRef}
          style={[styles.content, styles.input, { color: colors.text }]}
          value={editedContent}
          onChangeText={setEditedContent}
          onBlur={handleBlur}
          multiline
          textAlignVertical="top"
          placeholder="Enter text..."
          placeholderTextColor={colors.textSecondary}
        />
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
    paddingVertical: 8,
  },
  withBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  content: {
    fontSize: 17,
    lineHeight: 24,
  },
  input: {
    padding: 0,
    margin: 0,
    minHeight: 24,
  },
});
