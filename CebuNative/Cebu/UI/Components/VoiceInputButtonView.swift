/**
 * Input: Recording state, onPress callback
 * Output: Liquid Glass styled voice input button with water droplet ripple effects
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

    // Water ripple effects
    @State private var ripples: [RippleEffect] = []

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

            // Water ripple layers (enhanced visibility)
            ForEach(Array(ripples.enumerated()), id: \.element.id) { _, ripple in
                Circle()
                    .stroke(
                        (isRecording ? colors.recordingRed : colors.primary),
                        lineWidth: 4
                    )
                    .frame(width: 68, height: 68)
                    .scaleEffect(ripple.scale)
                    .opacity(ripple.opacity)
            }

            // Main button - Neomorphism Style
            Button(action: handlePress) {
                ZStack {
                    // Base background matching the app background
                    Circle()
                        .fill(
                            colorScheme == .dark
                            ? Color(white: 0.12)
                            : Color(white: 0.95)
                        )
                        .frame(width: 68, height: 68)

                    // Subtle color tint when recording
                    if isRecording {
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        colors.recordingRed.opacity(0.08),
                                        Color.clear
                                    ],
                                    center: .center,
                                    startRadius: 10,
                                    endRadius: 34
                                )
                            )
                            .frame(width: 68, height: 68)
                            .opacity(innerGlow)
                    }

                    // Icon - dark color for light background
                    Image(systemName: "mic.fill")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(
                            colorScheme == .dark
                            ? Color.white.opacity(0.8)
                            : Color.black.opacity(isRecording ? 0.7 : 0.65)
                        )
                }
            }
            .buttonStyle(WaterDropButtonStyle(scale: $scale))
            .disabled(isDisabled)
            .frame(width: 68, height: 68)
            // Neomorphism dual shadows (dark + light)
            .shadow(
                color: colorScheme == .dark
                    ? Color.black.opacity(0.5)
                    : Color.black.opacity(0.2),
                radius: 10,
                x: 6,
                y: 6
            )
            .shadow(
                color: colorScheme == .dark
                    ? Color.white.opacity(0.05)
                    : Color.white.opacity(0.8),
                radius: 10,
                x: -6,
                y: -6
            )
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

        // Enhanced water drop bounce (more dramatic)
        withAnimation(.spring(response: 0.25, dampingFraction: 0.45)) {
            scale = 0.85
        }
        withAnimation(.spring(response: 0.35, dampingFraction: 0.5).delay(0.08)) {
            scale = 1.08
        }
        withAnimation(.spring(response: 0.35, dampingFraction: 0.6).delay(0.2)) {
            scale = 1.0
        }

        // Create multiple water ripple effects
        createRipple()

        // Second ripple (delayed, creates layered effect)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            self.createRipple(duration: 1.0, maxScale: 2.2)
        }

        onPress()
    }

    private func createRipple(duration: Double = 0.9, maxScale: CGFloat = 2.0) {
        let newRipple = RippleEffect(id: UUID(), opacity: 0.9)
        ripples.append(newRipple)

        // Animate ripple expansion (larger and longer)
        withAnimation(.easeOut(duration: duration)) {
            if let index = ripples.firstIndex(where: { $0.id == newRipple.id }) {
                ripples[index].scale = maxScale
                ripples[index].opacity = 0.0
            }
        }

        // Remove ripple after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            ripples.removeAll { $0.id == newRipple.id }
        }
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

// MARK: - Water Drop Button Style

struct WaterDropButtonStyle: ButtonStyle {
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
