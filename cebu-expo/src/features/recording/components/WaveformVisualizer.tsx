/**
 * Input: Recording state (active/inactive)
 * Output: Simple waveform visualization (simplified for testing)
 * Pos: Visual feedback during audio recording
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

interface WaveformVisualizerProps {
  isActive: boolean;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  minHeight?: number;
  maxHeight?: number;
  color?: string;
}

/**
 * Simple waveform visualizer (static for testing)
 */
export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isActive,
  barCount = 7,
  barWidth = 4,
  barSpacing = 6,
  minHeight = 8,
  maxHeight = 40,
  color = '#007AFF',
}) => {
  return (
    <View style={styles.container}>
      {Array(barCount)
        .fill(0)
        .map((_, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: isActive ? maxHeight * (0.3 + Math.random() * 0.7) : minHeight,
                marginHorizontal: barSpacing / 2,
                backgroundColor: color,
                borderRadius: barWidth / 2,
              },
            ]}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  bar: {
    alignSelf: 'center',
  },
});
