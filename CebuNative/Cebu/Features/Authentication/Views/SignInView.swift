/**
 * Input: AuthenticationService state
 * Output: Sign in with Apple UI
 * Pos: Authentication screen shown when user is not signed in
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @Environment(\.themeColors) var colors
    @ObservedObject var authService: AuthenticationService

    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [
                    colors.backgroundGradientStart,
                    colors.backgroundGradientEnd
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                // App Icon and Title
                VStack(spacing: 16) {
                    Image(systemName: "waveform.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [colors.primary, colors.primary.opacity(0.7)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .shadow(color: colors.primaryGlow, radius: 20)

                    Text("Cebu")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundColor(colors.text)

                    Text("Voice Journal")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(colors.textSecondary)
                }
                .padding(.bottom, 40)

                // Features List
                VStack(alignment: .leading, spacing: 20) {
                    FeatureRow(
                        icon: "mic.fill",
                        title: "Voice First",
                        description: "Record your thoughts with just a tap",
                        color: colors.primary
                    )

                    FeatureRow(
                        icon: "waveform",
                        title: "AI Transcription",
                        description: "On-device speech recognition for privacy",
                        color: colors.success
                    )

                    FeatureRow(
                        icon: "icloud.fill",
                        title: "iCloud Sync",
                        description: "Your journal syncs across all your devices",
                        color: colors.primary
                    )
                }
                .padding(.horizontal, 40)

                Spacer()

                // Sign In Button
                VStack(spacing: 16) {
                    if authService.isLoading {
                        ProgressView()
                            .tint(colors.text)
                    } else {
                        SignInWithAppleButton(
                            onRequest: { request in
                                request.requestedScopes = [.email, .fullName]
                            },
                            onCompletion: { _ in }
                        )
                        .signInWithAppleButtonStyle(.white)
                        .frame(height: 50)
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.1), radius: 10, x: 0, y: 4)
                        .onTapGesture {
                            authService.signInWithApple()
                        }
                    }

                    if let error = authService.error {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(colors.destructive)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }

                    Text("Your data stays on your device and iCloud")
                        .font(.caption)
                        .foregroundColor(colors.textTertiary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 40)
            }
        }
    }
}

// MARK: - Feature Row

struct FeatureRow: View {
    @Environment(\.themeColors) var colors

    let icon: String
    let title: String
    let description: String
    let color: Color

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
                .frame(width: 44, height: 44)
                .background(
                    Circle()
                        .fill(color.opacity(0.1))
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(colors.text)

                Text(description)
                    .font(.system(size: 14))
                    .foregroundColor(colors.textSecondary)
                    .lineLimit(2)
            }

            Spacer()
        }
    }
}

// MARK: - Preview

#Preview("Light Mode") {
    SignInView(
        authService: AuthenticationService(
            userRepository: UserRepository(
                context: PersistenceController.preview.container.viewContext
            )
        )
    )
    .environment(\.themeColors, .light)
}

#Preview("Dark Mode") {
    SignInView(
        authService: AuthenticationService(
            userRepository: UserRepository(
                context: PersistenceController.preview.container.viewContext
            )
        )
    )
    .environment(\.themeColors, .dark)
    .preferredColorScheme(.dark)
}

#Preview("Loading State") {
    SignInView(
        authService: {
            let service = AuthenticationService(
                userRepository: UserRepository(
                    context: PersistenceController.preview.container.viewContext
                )
            )
            return service
        }()
    )
    .environment(\.themeColors, .light)
    .onAppear {
        // Simulate loading
    }
}
