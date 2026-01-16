/**
 * Input: Button props (onPress, title, variant, etc.)
 * Output: Interactive button with liquid glass effect
 * Pos: Reusable button component with glassmorphism styling
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    medium: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
  };

  const variantColors = {
    primary: {
      background: [colors.primary, colors.primary + 'CC'],
      text: '#FFFFFF',
    },
    secondary: {
      background: [colors.glassBackground, colors.backgroundSecondary + '99'],
      text: colors.text,
    },
    ghost: {
      background: ['transparent', 'transparent'],
      text: colors.primary,
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
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
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
            <LinearGradient
              colors={currentVariant.background}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: currentSize.paddingVertical }]}
            />
          </>
        )}

        {/* Border gradient */}
        {variant === 'secondary' && (
          <View
            style={[
              styles.border,
              { borderRadius: currentSize.paddingVertical },
            ]}
          >
            <LinearGradient
              colors={[colors.glassHighlight, colors.glassBorder]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: currentSize.paddingVertical }]}
            />
          </View>
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
    padding: 1,
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
