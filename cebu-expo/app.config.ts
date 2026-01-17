import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'cebu-expo',
  slug: 'cebu-expo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  // Disable Expo Router for now, use root App.tsx
  // newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.cebu.expo',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.cebu.expo',
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    // Expo Dev Client and build properties for native modules
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 21,
          compileSdkVersion: 34,
          targetSdkVersion: 34,
        },
        ios: {
          deploymentTarget: '13.0',
        },
      },
    ],
    // Comment out the plugin for now since we don't have model files yet
    // './plugins/withSenseVoiceModels',
  ],
});
