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

            // Stop button
            Button(action: handleStop) {
                ZStack {
                    Circle()
                        .fill(colors.recordingRed)
                        .frame(width: 72, height: 72)

                    RoundedRectangle(cornerRadius: 5)
                        .fill(.white)
                        .frame(width: 22, height: 22)
                }
            }
            .shadow(color: .black.opacity(0.3), radius: 16, x: 0, y: 8)
        }
    }

    // MARK: - Actions

    private func handleStop() {
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()

        Task {
            await viewModel.stopRecording()
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
