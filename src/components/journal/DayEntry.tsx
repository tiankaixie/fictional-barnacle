/**
 * Input: Entry data with blocks, date info
 * Output: Liquid Glass styled day entry with edit capability
 * Pos: Displays one day's transcription blocks with date header
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { TranscriptionBlock } from './TranscriptionBlock';

interface Block {
  id: string;
  content: string;
  createdAt: number;
  position: number;
}

interface DayEntryProps {
  entryId: string;
  date: string;
  dateLabel: string;
  blocks: Block[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DayEntry({ entryId, date, dateLabel, blocks }: DayEntryProps) {
  const { colors, isDark } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const scale = useSharedValue(1);

  const handleLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.98, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    setIsEditMode(true);
  }, [scale]);

  const handleExitEditMode = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditMode(false);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (blocks.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Date header */}
      <View style={styles.header}>
        <Text style={[styles.dateHeader, { color: colors.text }]}>
          {dateLabel}
        </Text>
        {isEditMode && (
          <Pressable
            onPress={handleExitEditMode}
            style={[
              styles.doneButtonContainer,
              { backgroundColor: colors.primaryGlow },
            ]}
          >
            <Text style={[styles.doneButton, { color: colors.primary }]}>
              Done
            </Text>
          </Pressable>
        )}
      </View>

      {/* Glass card container */}
      <AnimatedPressable
        onLongPress={handleLongPress}
        delayLongPress={400}
        disabled={isEditMode}
        style={cardStyle}
      >
        <View
          style={[
            styles.cardWrapper,
            {
              shadowColor: colors.glassShadow,
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 40 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.blurContainer,
              {
                backgroundColor: colors.glassBackground,
              },
            ]}
          >
            {/* Glass border highlight */}
            <View
              style={[
                styles.glassBorder,
                {
                  borderColor: colors.glassBorder,
                },
                isEditMode && {
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
            />

            {/* Top highlight for 3D effect */}
            <View
              style={[
                styles.topHighlight,
                { backgroundColor: colors.glassHighlight },
              ]}
            />

            {/* Content */}
            <View style={styles.contentContainer}>
              {blocks.map((block, index) => (
                <TranscriptionBlock
                  key={block.id}
                  blockId={block.id}
                  content={block.content}
                  createdAt={block.createdAt}
                  isEditable={isEditMode}
                  isLast={index === blocks.length - 1}
                />
              ))}
            </View>
          </BlurView>
        </View>
      </AnimatedPressable>

      {/* Edit hint */}
      {!isEditMode && (
        <Text style={[styles.editHint, { color: colors.textTertiary }]}>
          Long press to edit
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateHeader: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  doneButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  doneButton: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardWrapper: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    pointerEvents: 'none',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
  contentContainer: {
    padding: 18,
  },
  editHint: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
});
