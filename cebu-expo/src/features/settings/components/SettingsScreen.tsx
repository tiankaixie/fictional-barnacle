/**
 * Input: useTheme hook, audioStorageService, settings state
 * Output: Settings screen with theme and audio quality controls
 * Pos: Main settings view for app configuration
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassBackground, GlassCard } from '../../../ui/components';
import { useTheme, ThemeMode } from '../../../ui/theme';
import { useSettingsStore } from '../stores/settingsStore';
import * as Haptics from 'expo-haptics';

/**
 * Settings screen with theme and audio quality controls
 */
export const SettingsScreen: React.FC = () => {
  const { colors, mode, setMode } = useTheme();
  const { audioQuality, setAudioQuality } = useSettingsStore();

  const themeOptions: Array<{ mode: ThemeMode; label: string; icon: string }> = [
    { mode: 'light', label: '浅色', icon: 'sunny' },
    { mode: 'dark', label: '深色', icon: 'moon' },
    { mode: 'auto', label: '跟随系统', icon: 'contrast' },
  ];

  const qualityOptions = [
    { value: 'low', label: '低 (32 kbps)', size: '~240 KB/分钟' },
    { value: 'standard', label: '标准 (64 kbps)', size: '~480 KB/分钟' },
    { value: 'high', label: '高 (128 kbps)', size: '~960 KB/分钟' },
  ];

  const handleThemeChange = (newMode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode(newMode);
  };

  const handleQualityChange = (quality: 'low' | 'standard' | 'high') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAudioQuality(quality);
  };

  return (
    <GlassBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>设置</Text>
        </View>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>外观</Text>
          <GlassCard intensity={15}>
            {themeOptions.map((option, index) => (
              <Pressable
                key={option.mode}
                onPress={() => handleThemeChange(option.mode)}
                style={[
                  styles.settingRow,
                  index !== themeOptions.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.glassBackground,
                  },
                  mode === option.mode && {
                    backgroundColor: colors.primary + '15',
                  },
                ]}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={mode === option.mode ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.settingLabel,
                      {
                        color: mode === option.mode ? colors.primary : colors.text,
                        fontWeight: mode === option.mode ? '600' : '400',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {mode === option.mode && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </GlassCard>
        </View>

        {/* Audio Quality Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>录音质量</Text>
          <GlassCard intensity={15}>
            {qualityOptions.map((option, index) => (
              <Pressable
                key={option.value}
                onPress={() => handleQualityChange(option.value as any)}
                style={[
                  styles.settingRow,
                  index !== qualityOptions.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.glassBackground,
                  },
                  audioQuality === option.value && {
                    backgroundColor: colors.primary + '15',
                  },
                ]}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.qualityInfo}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          color: audioQuality === option.value ? colors.primary : colors.text,
                          fontWeight: audioQuality === option.value ? '600' : '400',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={[styles.qualitySize, { color: colors.textTertiary }]}>
                      {option.size}
                    </Text>
                  </View>
                </View>
                {audioQuality === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </GlassCard>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>关于</Text>
          <GlassCard intensity={15}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                应用版本
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
            </View>
            <View
              style={[
                styles.infoRow,
                { borderTopWidth: 1, borderTopColor: colors.glassBackground },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                语音识别
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                SenseVoice-Small
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </GlassBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20, // More spacious (was 16)
    marginBottom: 28,      // More separation (was 24)
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,   // More comfortable (was 14)
    paddingHorizontal: 20, // More spacious (was 16)
    borderRadius: 12,      // Subtle rounding for better visual
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  qualityInfo: {
    flex: 1,
  },
  qualitySize: {
    fontSize: 12,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
});
