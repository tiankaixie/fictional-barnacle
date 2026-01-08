/**
 * Input: expo-router, theme context, auth state
 * Output: Root navigation layout with theme and auth providers
 * Pos: Root layout wrapper for entire app navigation
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../src/hooks/useTheme';
import { DatabaseProvider } from '../src/hooks/useDatabase';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <DatabaseProvider>
            <RootLayoutNav />
          </DatabaseProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
