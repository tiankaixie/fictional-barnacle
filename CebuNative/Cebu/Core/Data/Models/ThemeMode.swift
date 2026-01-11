/**
 * Input: User theme preference selection
 * Output: Theme mode enum (auto/light/dark) with display properties
 * Pos: Core model for theme system configuration
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

enum ThemeMode: String, CaseIterable, Identifiable {
    case auto = "auto"
    case light = "light"
    case dark = "dark"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .auto: return "跟随系统"
        case .light: return "浅色"
        case .dark: return "深色"
        }
    }

    var iconName: String {
        switch self {
        case .auto: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }
}
