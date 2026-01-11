/**
 * Input: ColorScheme from SwiftUI environment
 * Output: Theme color definitions for light and dark modes with Liquid Glass style
 * Pos: Central color configuration for consistent theming
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct ThemeColors {
    // Base colors
    let background: Color
    let backgroundGradientStart: Color
    let backgroundGradientEnd: Color

    // Glass effect colors
    let glassBackground: Color
    let glassBorder: Color
    let glassHighlight: Color
    let glassShadow: Color

    // Text colors
    let text: Color
    let textSecondary: Color
    let textTertiary: Color

    // Accent colors
    let primary: Color
    let primaryGlow: Color
    let destructive: Color
    let success: Color

    // Component specific
    let cardBackground: Color
    let border: Color
    let recordingRed: Color
    let recordingGlow: Color
    let waveform: Color

    // Blur intensity
    let blurIntensity: CGFloat
    let isDark: Bool
}

extension ThemeColors {
    static let light = ThemeColors(
        // Base - subtle gradient background
        background: Color(hex: "#F5F5F7"),
        backgroundGradientStart: Color(hex: "#FFFFFF"),
        backgroundGradientEnd: Color(hex: "#E8E8ED"),

        // Glass - translucent white with subtle borders
        glassBackground: Color(white: 1.0, opacity: 0.72),
        glassBorder: Color(white: 1.0, opacity: 0.5),
        glassHighlight: Color(white: 1.0, opacity: 0.9),
        glassShadow: Color(red: 0, green: 0, blue: 0, opacity: 0.08),

        // Text
        text: Color(hex: "#1D1D1F"),
        textSecondary: Color(hex: "#86868B"),
        textTertiary: Color(hex: "#AEAEB2"),

        // Accent - iOS blue with glow
        primary: Color(hex: "#007AFF"),
        primaryGlow: Color(red: 0, green: 122/255, blue: 1, opacity: 0.3),
        destructive: Color(hex: "#FF3B30"),
        success: Color(hex: "#34C759"),

        // Components
        cardBackground: Color(white: 1.0, opacity: 0.8),
        border: Color(red: 0, green: 0, blue: 0, opacity: 0.06),
        recordingRed: Color(hex: "#FF3B30"),
        recordingGlow: Color(red: 1, green: 59/255, blue: 48/255, opacity: 0.4),
        waveform: Color(hex: "#007AFF"),

        blurIntensity: 80,
        isDark: false
    )

    static let dark = ThemeColors(
        // Base - deep dark with subtle color
        background: Color(hex: "#000000"),
        backgroundGradientStart: Color(hex: "#1C1C1E"),
        backgroundGradientEnd: Color(hex: "#000000"),

        // Glass - translucent dark with luminous borders
        glassBackground: Color(red: 44/255, green: 44/255, blue: 46/255, opacity: 0.72),
        glassBorder: Color(white: 1.0, opacity: 0.1),
        glassHighlight: Color(white: 1.0, opacity: 0.15),
        glassShadow: Color(red: 0, green: 0, blue: 0, opacity: 0.4),

        // Text
        text: Color(hex: "#FFFFFF"),
        textSecondary: Color(hex: "#98989D"),
        textTertiary: Color(hex: "#636366"),

        // Accent - brighter blue for dark mode with glow
        primary: Color(hex: "#0A84FF"),
        primaryGlow: Color(red: 10/255, green: 132/255, blue: 1, opacity: 0.4),
        destructive: Color(hex: "#FF453A"),
        success: Color(hex: "#30D158"),

        // Components
        cardBackground: Color(red: 44/255, green: 44/255, blue: 46/255, opacity: 0.8),
        border: Color(white: 1.0, opacity: 0.08),
        recordingRed: Color(hex: "#FF453A"),
        recordingGlow: Color(red: 1, green: 69/255, blue: 58/255, opacity: 0.5),
        waveform: Color(hex: "#0A84FF"),

        blurIntensity: 100,
        isDark: true
    )
}

// MARK: - Color Extensions

extension Color {
    /// Initialize Color from hex string
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)

        let r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (r, g, b) = ((int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (r, g, b) = (int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (0, 0, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1
        )
    }
}

// MARK: - Environment Key for Theme

private struct ThemeColorsKey: EnvironmentKey {
    static let defaultValue: ThemeColors = .light
}

extension EnvironmentValues {
    var themeColors: ThemeColors {
        get { self[ThemeColorsKey.self] }
        set { self[ThemeColorsKey.self] = newValue }
    }
}

// MARK: - View Extension for Easy Access

extension View {
    func themeColors(_ colors: ThemeColors) -> some View {
        environment(\.themeColors, colors)
    }
}
