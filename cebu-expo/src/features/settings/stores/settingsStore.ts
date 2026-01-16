/**
 * Input: User interactions with settings
 * Output: Settings state management
 * Pos: Zustand store for app settings (audio quality, etc.)
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioStorageService, AudioQuality } from '../../../core/services';

interface SettingsState {
  audioQuality: 'low' | 'standard' | 'high';
  audioSaveEnabled: boolean;
  biometricEnabled: boolean;

  // Actions
  setAudioQuality: (quality: 'low' | 'standard' | 'high') => void;
  setAudioSaveEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
}

/**
 * Settings store with persistence
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioQuality: 'standard',
      audioSaveEnabled: true,
      biometricEnabled: false,

      setAudioQuality: (quality) => {
        set({ audioQuality: quality });

        // Update audio storage service
        const qualityMap = {
          low: AudioQuality.LOW,
          standard: AudioQuality.STANDARD,
          high: AudioQuality.HIGH,
        };
        audioStorageService.setQuality(qualityMap[quality]);

        console.log('[SettingsStore] Audio quality set to:', quality);
      },

      setAudioSaveEnabled: (enabled) => {
        set({ audioSaveEnabled: enabled });
        audioStorageService.setSaveEnabled(enabled);
        console.log('[SettingsStore] Audio save enabled:', enabled);
      },

      setBiometricEnabled: (enabled) => {
        set({ biometricEnabled: enabled });
        console.log('[SettingsStore] Biometric enabled:', enabled);
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
