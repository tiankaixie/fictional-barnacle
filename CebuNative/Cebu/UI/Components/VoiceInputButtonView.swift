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

            // Water ripple layers
            ForEach(ripples) { ripple in
                Circle()
                    .stroke(
                        (isRecording ? colors.recordingRed : colors.primary).opacity(0.6),
                        lineWidth: 3
                    )
                    .frame(width: 68, height: 68)
                    .scaleEffect(ripple.scale)
                    .opacity(ripple.opacity)
            }

            // Main button
            Button(action: handlePress) {
                ZStack {
                    // Glass depth layer (bottom)
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.05),
                                    Color.white.opacity(0.02)
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: 68, height: 68)
                        .blur(radius: 2)

                    // Glass background with blur
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 68, height: 68)

                    // Color gradient overlay
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    (isRecording ? colors.recordingRed : colors.primary).opacity(0.95),
                                    (isRecording ? colors.recordingRed : colors.primary).opacity(0.85)
                                ],
                                center: .center,
                                startRadius: 10,
                                endRadius: 40
                            )
                        )
                        .frame(width: 68, height: 68)

                    // Water droplet highlight (top-left)
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.white.opacity(0.6),
                                    Color.white.opacity(0.3),
                                    Color.clear
                                ],
                                center: .init(x: 0.35, y: 0.35),
                                startRadius: 2,
                                endRadius: 25
                            )
                        )
                        .frame(width: 68, height: 68)
                        .blendMode(.overlay)

                    // Glossy rim effect
                    Circle()
                        .strokeBorder(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.5),
                                    Color.white.opacity(0.2),
                                    Color.white.opacity(0.05),
                                    Color.clear
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2
                        )
                        .frame(width: 68, height: 68)

                    // Bottom shadow for depth
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.clear,
                                    Color.black.opacity(0.15)
                                ],
                                center: .init(x: 0.5, y: 0.7),
                                startRadius: 15,
                                endRadius: 35
                            )
                        )
                        .frame(width: 68, height: 68)
                        .blendMode(.multiply)

                    // Inner glow when recording
                    Circle()
                        .fill(colors.recordingGlow)
                        .frame(width: 68, height: 68)
                        .opacity(innerGlow * 0.5)
                        .blur(radius: 8)

                    // Microphone icon with subtle glow
                    ZStack {
                        Image(systemName: isRecording ? "mic.fill" : "mic.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                            .shadow(color: .white.opacity(0.5), radius: 4)

                        Image(systemName: isRecording ? "mic.fill" : "mic.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(WaterDropButtonStyle(scale: $scale))
            .disabled(isDisabled)
            .frame(width: 68, height: 68)
            .shadow(color: .black.opacity(0.4), radius: 20, x: 0, y: 10)
            .shadow(color: (isRecording ? colors.recordingRed : colors.primary).opacity(0.3), radius: 12, x: 0, y: 6)
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

        // Scale animation with water drop bounce
        withAnimation(.spring(response: 0.25, dampingFraction: 0.5)) {
            scale = 0.88
        }
        withAnimation(.spring(response: 0.4, dampingFraction: 0.55).delay(0.1)) {
            scale = 1.05
        }
        withAnimation(.spring(response: 0.3, dampingFraction: 0.65).delay(0.25)) {
            scale = 1.0
        }

        // Create water ripple effect
        createRipple()

        onPress()
    }

    private func createRipple() {
        let newRipple = RippleEffect(id: UUID())
        ripples.append(newRipple)

        // Animate ripple expansion
        withAnimation(.easeOut(duration: 0.8)) {
            if let index = ripples.firstIndex(where: { $0.id == newRipple.id }) {
                ripples[index].scale = 1.8
                ripples[index].opacity = 0.0
            }
        }

        // Remove ripple after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
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

// MARK: - Ripple Effect Model

struct RippleEffect: Identifiable {
    let id: UUID
    var scale: CGFloat = 1.0
    var opacity: Double = 0.8
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
