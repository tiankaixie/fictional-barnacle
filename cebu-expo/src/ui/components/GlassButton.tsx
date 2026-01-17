/**
 * Input: Button props (onPress, title, variant, etc.)
 * Output: Interactive button with liquid glass effect
 * Pos: Reusable button component with glassmorphism styling
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeProvider';
import * as Haptics from 'expo-haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface GlassButtonProps {
  onPress: () => void;
  title?: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

/**
 * Liquid glass button with haptic feedback
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
  onPress,
  title,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { effectiveTheme, colors } = useTheme();

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const sizeStyles = {
    small: { paddingVertical: 10, paddingHorizontal: 18, fontSize: 14 },  // More comfortable (was 8/16)
    medium: { paddingVertical: 14, paddingHorizontal: 28, fontSize: 16 }, // More comfortable (was 12/24)
    large: { paddingVertical: 18, paddingHorizontal: 36, fontSize: 18 },  // More comfortable (was 16/32)
  };

  const variantColors = {
    primary: {
      // Gradient: Crail → Alternative Claude primary for depth
      background: [colors.primary, colors.secondary], // Official Claude terracotta gradient
      text: '#FFFFFF',
    },
    secondary: {
      background: [colors.glassBackground, colors.backgroundSecondary + '99'],
      text: colors.text,
    },
    ghost: {
      background: ['transparent', 'transparent'],
      text: colors.primary, // Crail terracotta
    },
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantColors[variant];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        {
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1, // More subtle (was 0.8)
          transform: [{ scale: pressed ? 0.97 : 1 }],   // Press animation
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
    >
      <View style={[styles.button, { borderRadius: currentSize.paddingVertical }]}>
        {/* Background for primary/secondary variants */}
        {variant !== 'ghost' && (
          <>
            <BlurView
              intensity={15}
              tint={effectiveTheme}
              style={[StyleSheet.absoluteFill, { borderRadius: currentSize.paddingVertical }]}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: currentVariant.background[0], // Use first color as solid
                  borderRadius: currentSize.paddingVertical,
                },
              ]}
            />
          </>
        )}

        {/* Border */}
        {variant === 'secondary' && (
          <View
            style={[
              styles.border,
              {
                borderRadius: currentSize.paddingVertical,
                borderWidth: 1,
                borderColor: colors.glassBorder,
              },
            ]}
          />
        )}

        {/* Content */}
        <View
          style={[
            styles.content,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
          ]}
        >
          {icon && <View style={styles.icon}>{icon}</View>}
          {title && (
            <Text
              style={[
                styles.text,
                {
                  fontSize: currentSize.fontSize,
                  color: currentVariant.text,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    position: 'relative',
    overflow: 'hidden',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
