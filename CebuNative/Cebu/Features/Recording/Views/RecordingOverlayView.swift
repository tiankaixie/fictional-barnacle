/**
 * Input: Recording visibility, live transcript, callbacks
 * Output: Liquid Glass styled full-screen recording overlay
 * Pos: Modal overlay shown when recording is active
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct RecordingOverlayView: View {
    @Environment(\.themeColors) var colors
    @Environment(\.dismiss) var dismiss
    @ObservedObject var viewModel: RecordingViewModel

    @State private var dotPulse: CGFloat = 1.0
    @State private var ringScale: CGFloat = 1.0
    @State private var ringOpacity: Double = 0.5
    @State private var stopButtonScale: CGFloat = 1.0
    @State private var stopRipples: [RippleEffect] = []

    var body: some View {
        ZStack {
            // Background blur
            Color.clear
                .background(.ultraThinMaterial)
                .ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()
                    .frame(height: 60)

                // Recording indicator
                recordingPill

                Spacer()

                // Waveform
                WaveformView(isActive: true, barCount: 9)
                    .liquidGlassCard()
                    .frame(height: 80)
                    .padding(.horizontal, 40)

                // Info card
                transcriptCard

                Spacer()

                // Stop button
                stopButton

                Spacer()
                    .frame(height: 40)
            }
        }
        .onAppear {
            startAnimations()
        }
    }

    // MARK: - Subviews

    private var recordingPill: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(colors.recordingRed)
                .frame(width: 10, height: 10)
                .scaleEffect(dotPulse)

            Text("Recording")
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(colors.recordingRed)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(colors.recordingRed.opacity(0.1))
        .clipShape(Capsule())
    }

    private var transcriptCard: some View {
        VStack(spacing: 16) {
            Text("正在录音...")
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(colors.text)

            Text("停止后将自动转换为文字")
                .font(.system(size: 15))
                .foregroundColor(colors.textSecondary)
        }
        .padding(.vertical, 32)
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity)
        .liquidGlassCard()
        .padding(.horizontal, 24)
    }

    private var stopButton: some View {
        ZStack {
            // Expanding ring
            Circle()
                .stroke(colors.recordingRed, lineWidth: 2)
                .frame(width: 72, height: 72)
                .scaleEffect(ringScale)
                .opacity(ringOpacity)

            // Water ripple layers
            ForEach(Array(stopRipples.enumerated()), id: \.element.id) { _, ripple in
                Circle()
                    .stroke(colors.recordingRed.opacity(0.6), lineWidth: 3)
                    .frame(width: 72, height: 72)
                    .scaleEffect(ripple.scale)
                    .opacity(ripple.opacity)
            }

            // Stop button
            Button(action: handleStop) {
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
                        .frame(width: 72, height: 72)
                        .blur(radius: 2)

                    // Glass background with blur
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 72, height: 72)

                    // Color gradient overlay
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    colors.recordingRed.opacity(0.95),
                                    colors.recordingRed.opacity(0.85)
                                ],
                                center: .center,
                                startRadius: 12,
                                endRadius: 45
                            )
                        )
                        .frame(width: 72, height: 72)

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
                                startRadius: 3,
                                endRadius: 28
                            )
                        )
                        .frame(width: 72, height: 72)
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
                        .frame(width: 72, height: 72)

                    // Bottom shadow for depth
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.clear,
                                    Color.black.opacity(0.15)
                                ],
                                center: .init(x: 0.5, y: 0.7),
                                startRadius: 18,
                                endRadius: 38
                            )
                        )
                        .frame(width: 72, height: 72)
                        .blendMode(.multiply)

                    // Stop icon (square) with glow
                    ZStack {
                        RoundedRectangle(cornerRadius: 5)
                            .fill(.white)
                            .frame(width: 22, height: 22)
                            .shadow(color: .white.opacity(0.5), radius: 4)

                        RoundedRectangle(cornerRadius: 5)
                            .fill(.white)
                            .frame(width: 22, height: 22)
                    }
                }
            }
            .scaleEffect(stopButtonScale)
            .shadow(color: .black.opacity(0.4), radius: 20, x: 0, y: 10)
            .shadow(color: colors.recordingRed.opacity(0.3), radius: 12, x: 0, y: 6)
        }
    }

    // MARK: - Actions

    private func handleStop() {
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()

        // Scale animation with water drop bounce
        withAnimation(.spring(response: 0.25, dampingFraction: 0.5)) {
            stopButtonScale = 0.88
        }
        withAnimation(.spring(response: 0.4, dampingFraction: 0.55).delay(0.1)) {
            stopButtonScale = 1.05
        }
        withAnimation(.spring(response: 0.3, dampingFraction: 0.65).delay(0.25)) {
            stopButtonScale = 1.0
        }

        // Create water ripple effect
        createStopRipple()

        Task {
            await viewModel.stopRecording()
        }
    }

    private func createStopRipple() {
        let newRipple = RippleEffect(id: UUID())
        stopRipples.append(newRipple)

        // Animate ripple expansion
        withAnimation(.easeOut(duration: 0.8)) {
            if let index = stopRipples.firstIndex(where: { $0.id == newRipple.id }) {
                stopRipples[index].scale = 1.8
                stopRipples[index].opacity = 0.0
            }
        }

        // Remove ripple after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            stopRipples.removeAll { $0.id == newRipple.id }
        }
    }

    private func startAnimations() {
        // Pulsing dot
        withAnimation(
            .easeInOut(duration: 0.6)
            .repeatForever(autoreverses: true)
        ) {
            dotPulse = 1.3
        }

        // Expanding ring
        withAnimation(
            .easeOut(duration: 1.5)
            .repeatForever(autoreverses: false)
        ) {
            ringScale = 1.8
            ringOpacity = 0.0
        }
    }
}

// MARK: - Preview

#Preview("Recording") {
    let whisperService = WhisperKitService()
    let context = PersistenceController.preview.container.viewContext
    let user = User(context: context)
    user.id = UUID()

    let repository = JournalRepository(context: context)
    let journalVM = JournalListViewModel(repository: repository, user: user)
    let recordingVM = RecordingViewModel(
        whisperService: whisperService,
        journalViewModel: journalVM
    )

    // Simulate recording state
    recordingVM.liveTranscript = "This is a sample transcription that is being displayed in real-time as the user speaks."

    return RecordingOverlayView(viewModel: recordingVM)
        .environment(\.themeColors, .dark)
        .preferredColorScheme(.dark)
}

#Preview("Empty Transcript") {
    let whisperService = WhisperKitService()
    let context = PersistenceController.preview.container.viewContext
    let user = User(context: context)
    user.id = UUID()

    let repository = JournalRepository(context: context)
    let journalVM = JournalListViewModel(repository: repository, user: user)
    let recordingVM = RecordingViewModel(
        whisperService: whisperService,
        journalViewModel: journalVM
    )

    return RecordingOverlayView(viewModel: recordingVM)
        .environment(\.themeColors, .light)
}
