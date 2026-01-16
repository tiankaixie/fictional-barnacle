/**
 * Input: Filter state, onChange callbacks
 * Output: Modal sheet with filter controls
 * Pos: Filter UI for journal list (date range, audio filter)
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton } from '../../../ui/components';
import { useTheme } from '../../../ui/theme';
import * as Haptics from 'expo-haptics';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  dateFrom: Date | null;
  dateTo: Date | null;
  hasAudio: boolean | null;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  onHasAudioChange: (hasAudio: boolean | null) => void;
  onReset: () => void;
}

/**
 * Filter sheet modal for journal list
 */
export const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  dateFrom,
  dateTo,
  hasAudio,
  onDateFromChange,
  onDateToChange,
  onHasAudioChange,
  onReset,
}) => {
  const { colors } = useTheme();

  const handleAudioFilterPress = (value: boolean | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onHasAudioChange(value);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReset();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const hasActiveFilters = dateFrom !== null || dateTo !== null || hasAudio !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>筛选</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Audio Filter Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                录音状态
              </Text>
              <GlassCard style={styles.filterCard}>
                <Pressable
                  onPress={() => handleAudioFilterPress(null)}
                  style={[
                    styles.filterOption,
                    hasAudio === null && {
                      backgroundColor: colors.primary + '20',
                    },
                  ]}
                >
                  <Ionicons
                    name={hasAudio === null ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={hasAudio === null ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: hasAudio === null ? colors.primary : colors.text,
                      },
                    ]}
                  >
                    全部
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleAudioFilterPress(true)}
                  style={[
                    styles.filterOption,
                    hasAudio === true && {
                      backgroundColor: colors.primary + '20',
                    },
                  ]}
                >
                  <Ionicons
                    name={hasAudio === true ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={hasAudio === true ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: hasAudio === true ? colors.primary : colors.text,
                      },
                    ]}
                  >
                    有录音
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleAudioFilterPress(false)}
                  style={[
                    styles.filterOption,
                    hasAudio === false && {
                      backgroundColor: colors.primary + '20',
                    },
                  ]}
                >
                  <Ionicons
                    name={hasAudio === false ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={hasAudio === false ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: hasAudio === false ? colors.primary : colors.text,
                      },
                    ]}
                  >
                    无录音
                  </Text>
                </Pressable>
              </GlassCard>
            </View>

            {/* Date Filter Section - Placeholder */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                日期范围
              </Text>
              <GlassCard style={styles.filterCard}>
                <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
                  日期选择器即将推出...
                </Text>
              </GlassCard>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {hasActiveFilters && (
              <GlassButton
                title="重置"
                variant="ghost"
                onPress={handleReset}
                style={styles.resetButton}
              />
            )}
            <GlassButton
              title="应用"
              variant="primary"
              onPress={handleClose}
              fullWidth={!hasActiveFilters}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterCard: {
    padding: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  resetButton: {
    flex: 1,
  },
});
