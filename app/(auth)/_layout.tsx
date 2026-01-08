/**
 * Input: expo-router Stack
 * Output: Auth flow navigation layout
 * Pos: Layout for authentication screens
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: 'Sign In',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
