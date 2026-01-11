/**
 * Input: Recording state, onPress callback
 * Output: Liquid Glass styled voice input button with glow effects
 * Pos: Main recording trigger button shown on journal screen
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct VoiceInputButtonView: View {
    @Environment(\.themeColors) var colors
    @Environment(\.colorScheme) var colorScheme

    let isRecording: Bool
    let onPress: () -> Void
    let isDisabled: Bool

    @State private var scale: CGFloat = 1.0
    @State private var pulseScale: CGFloat = 1.0
    @State private var pulseOpacity: Double = 0.0
    @State private var glowIntensity: Double = 0.0
    @State private var innerGlow: Double = 0.0

    init(isRecording: Bool, isDisabled: Bool = false, onPress: @escaping () -> Void) {
        self.isRecording = isRecording
        self.isDisabled = isDisabled
        self.onPress = onPress
    }

    var body: some View {
        ZStack {
            // Outer pulse
            Circle()
                .fill(isRecording ? colors.recordingGlow : colors.primaryGlow)
                .frame(width: 72, height: 72)
                .scaleEffect(pulseScale)
                .opacity(pulseOpacity)

            // Glow ring
            Circle()
                .strokeBorder(isRecording ? colors.recordingRed : colors.primary, lineWidth: 2)
                .frame(width: 80, height: 80)
                .shadow(color: isRecording ? colors.recordingRed : colors.primary, radius: 20)
                .scaleEffect(1 + glowIntensity * 0.1)
                .opacity(glowIntensity * 0.6)

            // Main button
            Button(action: handlePress) {
                ZStack {
                    // Glass background with blur
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 68, height: 68)

                    // Gradient overlay
                    Circle()
                        .fill(isRecording ? colors.recordingRed : colors.primary)
                        .frame(width: 68, height: 68)
                        .opacity(0.9)

                    // Inner highlight (gradient border effect)
                    Circle()
                        .strokeBorder(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.4),
                                    Color.white.opacity(0.1),
                                    Color.white.opacity(0.05)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1.5
                        )
                        .frame(width: 68, height: 68)

                    // Inner glow when recording
                    Circle()
                        .fill(colors.recordingGlow)
                        .frame(width: 68, height: 68)
                        .opacity(innerGlow * 0.8)

                    // Microphone icon
                    Image(systemName: isRecording ? "mic.fill" : "mic.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.white)
                }
            }
            .buttonStyle(ScaleButtonStyle(scale: $scale))
            .disabled(isDisabled)
            .frame(width: 68, height: 68)
            .shadow(color: .black.opacity(0.3), radius: 16, x: 0, y: 8)
        }
        .frame(width: 100, height: 100)
        .onChange(of: isRecording) { newValue in
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                if newValue {
                    // Start recording animations
                    pulseOpacity = 0.4
                    innerGlow = 1.0
                    startPulseAnimation()
                    startGlowAnimation()
                } else {
                    // Stop recording animations
                    pulseScale = 1.0
                    pulseOpacity = 0.0
                    glowIntensity = 0.0
                    innerGlow = 0.0
                }
            }
        }
    }

    private func handlePress() {
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        // Scale animation
        withAnimation(.spring(response: 0.2, dampingFraction: 0.6)) {
            scale = 0.92
        }
        withAnimation(.spring(response: 0.3, dampingFraction: 0.6).delay(0.1)) {
            scale = 1.0
        }

        onPress()
    }

    private func startPulseAnimation() {
        withAnimation(
            .spring(response: 0.8, dampingFraction: 0.6)
            .repeatForever(autoreverses: true)
        ) {
            pulseScale = 1.4
        }
    }

    private func startGlowAnimation() {
        withAnimation(
            .easeInOut(duration: 0.8)
            .repeatForever(autoreverses: true)
        ) {
            glowIntensity = 1.0
        }
    }
}

// MARK: - Scale Button Style

struct ScaleButtonStyle: ButtonStyle {
    @Binding var scale: CGFloat

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(scale)
    }
}

// MARK: - Previews

#Preview("Idle Button") {
    VStack {
        Spacer()
        VoiceInputButtonView(isRecording: false) {
            print("Pressed")
        }
        .padding(.bottom, 40)
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}

#Preview("Recording Button") {
    VStack {
        Spacer()
        VoiceInputButtonView(isRecording: true) {
            print("Pressed")
        }
        .padding(.bottom, 40)
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .dark)
    .preferredColorScheme(.dark)
}

#Preview("Disabled Button") {
    VStack {
        Spacer()
        VoiceInputButtonView(isRecording: false, isDisabled: true) {
            print("Pressed")
        }
        .padding(.bottom, 40)
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}
