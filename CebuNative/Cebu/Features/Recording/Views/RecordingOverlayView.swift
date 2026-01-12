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
    @EnvironmentObject var audioStorageService: AudioStorageService

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

                // Audio save indicator (if enabled)
                if audioStorageService.saveAudioEnabled {
                    audioSaveIndicator
                }

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

    private var audioSaveIndicator: some View {
        HStack(spacing: 10) {
            Image(systemName: "waveform.circle.fill")
                .font(.system(size: 16))
                .foregroundColor(colors.primary)

            VStack(alignment: .leading, spacing: 2) {
                Text("录音将被保存")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(colors.text)

                Text("\(audioStorageService.audioQuality.displayName)音质 · \(audioStorageService.audioQuality.estimatedSize)")
                    .font(.caption)
                    .foregroundColor(colors.textTertiary)
            }

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(colors.primary.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(colors.primary.opacity(0.2), lineWidth: 1)
        )
        .padding(.horizontal, 24)
        .transition(.opacity.combined(with: .move(edge: .top)))
    }

    private var stopButton: some View {
        ZStack {
            // Expanding ring
            Circle()
                .stroke(colors.recordingRed, lineWidth: 2)
                .frame(width: 72, height: 72)
                .scaleEffect(ringScale)
                .opacity(ringOpacity)

            // Water ripple layers (enhanced visibility)
            ForEach(Array(stopRipples.enumerated()), id: \.element.id) { _, ripple in
                Circle()
                    .stroke(colors.recordingRed, lineWidth: 4)
                    .frame(width: 72, height: 72)
                    .scaleEffect(ripple.scale)
                    .opacity(ripple.opacity)
            }

            // Stop button - Liquid Glass Style
            Button(action: handleStop) {
                ZStack {
                    // Glass material base
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 72, height: 72)
                        .background(
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            colors.glassBackground,
                                            colors.cardBackground
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        )
                        .overlay(
                            Circle()
                                .strokeBorder(
                                    LinearGradient(
                                        colors: [
                                            colors.glassHighlight,
                                            colors.recordingRed.opacity(0.4)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1.5
                                )
                        )

                    // Stop icon (square)
                    RoundedRectangle(cornerRadius: 5)
                        .fill(colors.recordingRed)
                        .frame(width: 22, height: 22)
                }
            }
            .scaleEffect(stopButtonScale)
            // Glass shadow
            .shadow(color: colors.glassShadow, radius: 24, x: 0, y: 8)
        }
    }

    // MARK: - Actions

    private func handleStop() {
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()

        // Enhanced water drop bounce (more dramatic)
        withAnimation(.spring(response: 0.25, dampingFraction: 0.45)) {
            stopButtonScale = 0.85
        }
        withAnimation(.spring(response: 0.35, dampingFraction: 0.5).delay(0.08)) {
            stopButtonScale = 1.08
        }
        withAnimation(.spring(response: 0.35, dampingFraction: 0.6).delay(0.2)) {
            stopButtonScale = 1.0
        }

        // Create multiple water ripple effects
        createStopRipple()

        // Second ripple (delayed, creates layered effect)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            self.createStopRipple(duration: 1.0, maxScale: 2.2)
        }

        Task {
            await viewModel.stopRecording()
        }
    }

    private func createStopRipple(duration: Double = 0.9, maxScale: CGFloat = 2.0) {
        let newRipple = RippleEffect(id: UUID(), opacity: 0.9)
        stopRipples.append(newRipple)

        // Animate ripple expansion (larger and longer)
        withAnimation(.easeOut(duration: duration)) {
            if let index = stopRipples.firstIndex(where: { $0.id == newRipple.id }) {
                stopRipples[index].scale = maxScale
                stopRipples[index].opacity = 0.0
            }
        }

        // Remove ripple after animation
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
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

struct RecordingOverlayView_Recording: PreviewProvider {
    static var previews: some View {
        PreviewWrapper()
    }

    struct PreviewWrapper: View {
        var body: some View {
            let whisperService = WhisperKitService()
            let context = PersistenceController.preview.container.viewContext
            let user = User(context: context)
            user.id = UUID()

            let repository = JournalRepository(context: context)
            let journalVM = JournalListViewModel(repository: repository, user: user)
            let audioStorageService = AudioStorageService()
            let recordingVM = RecordingViewModel(
                whisperService: whisperService,
                journalViewModel: journalVM,
                audioStorageService: audioStorageService
            )

            // Simulate recording state
            recordingVM.liveTranscript = "This is a sample transcription that is being displayed in real-time as the user speaks."

            return RecordingOverlayView(viewModel: recordingVM)
                .environment(\.themeColors, .dark)
                .preferredColorScheme(.dark)
        }
    }
}

struct RecordingOverlayView_Empty: PreviewProvider {
    static var previews: some View {
        PreviewWrapper()
    }

    struct PreviewWrapper: View {
        var body: some View {
            let whisperService = WhisperKitService()
            let context = PersistenceController.preview.container.viewContext
            let user = User(context: context)
            user.id = UUID()

            let repository = JournalRepository(context: context)
            let journalVM = JournalListViewModel(repository: repository, user: user)
            let audioStorageService = AudioStorageService()
            let recordingVM = RecordingViewModel(
                whisperService: whisperService,
                journalViewModel: journalVM,
                audioStorageService: audioStorageService
            )

            return RecordingOverlayView(viewModel: recordingVM)
                .environment(\.themeColors, .light)
        }
    }
}
