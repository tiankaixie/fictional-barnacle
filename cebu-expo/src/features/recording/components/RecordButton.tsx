/**
 * Input: useRecording hook, user touch interactions
 * Output: Recording button (simplified without Reanimated for testing)
 * Pos: Main recording button
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import { StyleSheet, Pressable, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../ui/theme';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  size?: number;
}

/**
 * Simple recording button (no animations for testing)
 */
export const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isProcessing,
  onPress,
  size = 80,
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onPress();
  };

  const backgroundColor = isRecording ? colors.error : colors.primary;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        disabled={isProcessing}
        style={({ pressed }) => [
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={size * 0.4}
            color="white"
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
