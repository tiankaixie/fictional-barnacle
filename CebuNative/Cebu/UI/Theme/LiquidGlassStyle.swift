/**
 * Input: View content, ColorScheme
 * Output: Liquid Glass styled views with blur, gradient, and shadow effects
 * Pos: ViewModifiers for applying consistent Liquid Glass design system
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

// MARK: - Glass Intensity Levels

enum GlassIntensity {
    case light
    case medium
    case heavy

    var materialType: Material {
        switch self {
        case .light:
            return .ultraThinMaterial
        case .medium:
            return .thinMaterial
        case .heavy:
            return .regularMaterial
        }
    }
}

// MARK: - Liquid Glass Card Modifier

struct LiquidGlassCardModifier: ViewModifier {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.themeColors) var colors

    let intensity: GlassIntensity
    let cornerRadius: CGFloat
    let padding: CGFloat

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(intensity.materialType)
                    .background(
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .fill(glassGradient)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .strokeBorder(glassBorder, lineWidth: 1)
                    )
                    .shadow(color: colors.glassShadow, radius: 24, x: 0, y: 8)
            }
    }

    private var glassGradient: LinearGradient {
        LinearGradient(
            colors: [
                colors.glassBackground,
                colors.cardBackground
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var glassBorder: LinearGradient {
        LinearGradient(
            colors: [
                colors.glassHighlight,
                colors.glassBorder
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

// MARK: - Liquid Glass Background Modifier

struct LiquidGlassBackgroundModifier: ViewModifier {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.themeColors) var colors

    func body(content: Content) -> some View {
        ZStack {
            // Base gradient background
            LinearGradient(
                colors: [
                    colors.backgroundGradientStart,
                    colors.backgroundGradientEnd
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            content
        }
    }
}

// MARK: - Glass Button Style

struct GlassButtonStyle: ButtonStyle {
    @Environment(\.themeColors) var colors
    let isDestructive: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background {
                RoundedRectangle(cornerRadius: 12)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .strokeBorder(
                                isDestructive ? colors.destructive.opacity(0.3) : colors.primary.opacity(0.3),
                                lineWidth: 1
                            )
                    )
            }
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - Pulsing Glow Modifier

struct PulsingGlowModifier: ViewModifier {
    @State private var isPulsing = false
    let color: Color
    let radius: CGFloat

    func body(content: Content) -> some View {
        content
            .shadow(
                color: color.opacity(isPulsing ? 0.6 : 0.3),
                radius: isPulsing ? radius * 1.5 : radius
            )
            .onAppear {
                withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                    isPulsing = true
                }
            }
    }
}

// MARK: - View Extensions

extension View {
    /// Apply Liquid Glass card style
    func liquidGlassCard(
        intensity: GlassIntensity = .medium,
        cornerRadius: CGFloat = 20,
        padding: CGFloat = 16
    ) -> some View {
        modifier(LiquidGlassCardModifier(
            intensity: intensity,
            cornerRadius: cornerRadius,
            padding: padding
        ))
    }

    /// Apply Liquid Glass background
    func liquidGlassBackground() -> some View {
        modifier(LiquidGlassBackgroundModifier())
    }

    /// Apply pulsing glow effect
    func pulsingGlow(color: Color, radius: CGFloat = 20) -> some View {
        modifier(PulsingGlowModifier(color: color, radius: radius))
    }

    /// Apply glass button style
    func glassButton(isDestructive: Bool = false) -> some View {
        buttonStyle(GlassButtonStyle(isDestructive: isDestructive))
    }
}

// MARK: - Preview Support

#Preview("Light Mode Cards") {
    VStack(spacing: 20) {
        Text("Light Glass Card")
            .liquidGlassCard(intensity: .light)

        Text("Medium Glass Card")
            .liquidGlassCard(intensity: .medium)

        Text("Heavy Glass Card")
            .liquidGlassCard(intensity: .heavy)
    }
    .padding()
    .liquidGlassBackground()
    .environment(\.themeColors, .light)
}

#Preview("Dark Mode Cards") {
    VStack(spacing: 20) {
        Text("Light Glass Card")
            .foregroundColor(.white)
            .liquidGlassCard(intensity: .light)

        Text("Medium Glass Card")
            .foregroundColor(.white)
            .liquidGlassCard(intensity: .medium)

        Text("Heavy Glass Card")
            .foregroundColor(.white)
            .liquidGlassCard(intensity: .heavy)
    }
    .padding()
    .liquidGlassBackground()
    .environment(\.themeColors, .dark)
    .preferredColorScheme(.dark)
}

#Preview("Pulsing Glow") {
    Circle()
        .fill(.blue)
        .frame(width: 72, height: 72)
        .pulsingGlow(color: .blue, radius: 24)
        .padding()
        .liquidGlassBackground()
        .environment(\.themeColors, .dark)
        .preferredColorScheme(.dark)
}
