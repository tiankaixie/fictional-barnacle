/**
 * Input: Apple/Google auth services
 * Output: Sign in screen with social auth buttons
 * Pos: Authentication entry point with Apple/Google sign in
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../../src/hooks/useTheme';

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log('Apple sign in successful:', credential.user);
    } catch (error: unknown) {
      const e = error as { code?: string };
      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('User cancelled Apple sign in');
      } else {
        console.error('Apple sign in error:', error);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google sign in
    console.log('Google sign in pressed');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to Cebu
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to sync your voice notes across devices
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              colors.isDark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}

        <Pressable
          style={[styles.googleButton, { borderColor: colors.border }]}
          onPress={handleGoogleSignIn}
        >
          <Text style={[styles.googleButtonText, { color: colors.text }]}>
            Continue with Google
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
        By signing in, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    gap: 12,
  },
  appleButton: {
    height: 50,
  },
  googleButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
});
