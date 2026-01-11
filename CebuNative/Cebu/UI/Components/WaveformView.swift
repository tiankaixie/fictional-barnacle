/**
 * Input: Audio amplitude levels, animation state
 * Output: Animated waveform visualization
 * Pos: Real-time audio waveform shown during recording
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct WaveformView: View {
    @Environment(\.themeColors) var colors

    let isActive: Bool
    let barCount: Int

    init(isActive: Bool, barCount: Int = 5) {
        self.isActive = isActive
        self.barCount = barCount
    }

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<barCount, id: \.self) { index in
                WaveformBar(
                    index: index,
                    isActive: isActive,
                    color: colors.waveform
                )
            }
        }
        .frame(height: 40)
    }
}

// MARK: - Waveform Bar

struct WaveformBar: View {
    let index: Int
    let isActive: Bool
    let color: Color

    private let minHeight: CGFloat = 8
    private let maxHeight: CGFloat = 40

    @State private var height: CGFloat = 8

    var body: some View {
        Capsule()
            .fill(color)
            .frame(width: 4, height: height)
            .onChange(of: isActive) { newValue in
                if newValue {
                    startAnimation()
                } else {
                    stopAnimation()
                }
            }
            .onAppear {
                if isActive {
                    startAnimation()
                }
            }
    }

    private func startAnimation() {
        let delay = Double(index) * 0.1
        let baseDuration = 0.3 + Double.random(in: 0...0.2)

        // Animate to random height
        withAnimation(
            .easeInOut(duration: baseDuration)
            .delay(delay)
            .repeatForever(autoreverses: true)
        ) {
            height = maxHeight * CGFloat(0.4 + Double.random(in: 0...0.6))
        }
    }

    private func stopAnimation() {
        withAnimation(.easeOut(duration: 0.2)) {
            height = minHeight
        }
    }
}

// MARK: - Previews

#Preview("Waveform Active") {
    VStack {
        Text("Active Waveform")
            .font(.caption)
            .foregroundColor(.secondary)

        WaveformView(isActive: true)
            .liquidGlassCard()
            .frame(height: 80)
            .padding(.horizontal, 40)
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}

#Preview("Waveform Inactive") {
    VStack {
        Text("Inactive Waveform")
            .font(.caption)
            .foregroundColor(.secondary)

        WaveformView(isActive: false)
            .liquidGlassCard()
            .frame(height: 80)
            .padding(.horizontal, 40)
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .dark)
    .preferredColorScheme(.dark)
}

#Preview("Waveform Many Bars") {
    VStack {
        Text("9 Bars Waveform")
            .font(.caption)
            .foregroundColor(.secondary)

        WaveformView(isActive: true, barCount: 9)
            .liquidGlassCard()
            .frame(height: 80)
            .padding(.horizontal, 40)
    }
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}
