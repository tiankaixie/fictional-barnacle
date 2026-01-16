/**
 * Input: React children, system color scheme
 * Output: Theme context provider with auto/light/dark modes
 * Pos: Root theme provider for app-wide theme management
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from './colors';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme-mode';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme provider with three-mode support (light/dark/auto)
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Save theme to storage when changed
  useEffect(() => {
    saveTheme(mode);
  }, [mode]);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
        setModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('[ThemeProvider] Failed to load theme:', error);
    }
  };

  const saveTheme = async (themeMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch (error) {
      console.error('[ThemeProvider] Failed to save theme:', error);
    }
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    console.log('[ThemeProvider] Theme mode changed:', newMode);
  };

  // Determine effective theme based on mode and system preference
  const effectiveTheme: 'light' | 'dark' =
    mode === 'auto' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : mode;

  const colors = effectiveTheme === 'dark' ? darkColors : lightColors;

  const value: ThemeContextType = {
    mode,
    effectiveTheme,
    colors,
    setMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
