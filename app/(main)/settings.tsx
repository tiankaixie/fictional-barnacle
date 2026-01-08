/**
 * Input: User settings, auth state
 * Output: Settings screen with theme toggle and account options
 * Pos: Settings screen for app configuration
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Appearance
        </Text>

        <View
          style={[styles.settingRow, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>

        <View style={styles.themeOptions}>
          {(['system', 'light', 'dark'] as const).map((mode) => (
            <Pressable
              key={mode}
              style={[
                styles.themeOption,
                {
                  backgroundColor:
                    themeMode === mode ? colors.primary : colors.cardBackground,
                },
              ]}
              onPress={() => setThemeMode(mode)}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  { color: themeMode === mode ? '#fff' : colors.text },
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Account
        </Text>

        <Pressable
          style={[styles.settingRow, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Sign In
          </Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            Not signed in
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          About
        </Text>

        <View
          style={[styles.settingRow, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Version
          </Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            1.0.0
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  settingLabel: {
    fontSize: 17,
  },
  settingValue: {
    fontSize: 17,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
