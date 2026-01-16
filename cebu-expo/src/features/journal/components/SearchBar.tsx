/**
 * Input: Search query, onChange callback, filter controls
 * Output: Search bar with filters UI
 * Pos: Search and filter controls for journal list
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../ui/components';
import { useTheme } from '../../../ui/theme';
import * as Haptics from 'expo-haptics';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  hasActiveFilters?: boolean;
  placeholder?: string;
}

/**
 * Search bar with filter button
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onFilterPress,
  hasActiveFilters = false,
  placeholder = '搜索日记...',
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
  };

  const handleFilterPress = () => {
    if (onFilterPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onFilterPress();
    }
  };

  return (
    <GlassCard style={styles.container} intensity={15} borderRadius={16}>
      <View style={styles.searchContainer}>
        {/* Search icon */}
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? colors.primary : colors.textTertiary}
          style={styles.searchIcon}
        />

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            {
              color: colors.text,
            },
          ]}
          clearButtonMode="never"
          returnKeyType="search"
        />

        {/* Clear button */}
        {value.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}

        {/* Filter button */}
        {onFilterPress && (
          <Pressable
            onPress={handleFilterPress}
            style={[
              styles.filterButton,
              {
                backgroundColor: hasActiveFilters
                  ? colors.primary + '20'
                  : 'transparent',
              },
            ]}
          >
            <Ionicons
              name={hasActiveFilters ? 'filter' : 'filter-outline'}
              size={20}
              color={hasActiveFilters ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    minHeight: 24,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  filterButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 8,
  },
});
