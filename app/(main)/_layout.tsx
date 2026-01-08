/**
 * Input: expo-router Stack, theme colors, blur effect
 * Output: Main app layout with Liquid Glass styled header
 * Pos: Layout for authenticated main screens with glass morphism navigation
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';

export default function MainLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: isDark ? 'systemMaterialDark' : 'systemMaterial',
        headerStyle: {
          backgroundColor: isDark
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(255, 255, 255, 0.5)',
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: -0.4,
        },
        headerLargeTitleStyle: {
          fontWeight: '700',
          fontSize: 34,
          letterSpacing: 0.4,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Journal',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
    </Stack>
  );
}
