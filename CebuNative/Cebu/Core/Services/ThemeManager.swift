/**
 * Input: User theme preference, system colorScheme
 * Output: Effective theme and colorScheme for app-wide theming
 * Pos: Observable service managing theme mode persistence and resolution
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

@MainActor
class ThemeManager: ObservableObject {
    // 用户主题偏好
    @Published var themeMode: ThemeMode {
        didSet { savePreference() }
    }

    // 系统 colorScheme（从环境观察）
    @Published var systemColorScheme: ColorScheme = .light

    private let userDefaultsKey = "app.theme.mode"

    // 计算有效主题
    var effectiveTheme: ThemeColors {
        switch themeMode {
        case .auto:
            return systemColorScheme == .dark ? .dark : .light
        case .light:
            return .light
        case .dark:
            return .dark
        }
    }

    // 计算有效 colorScheme（用于 preferredColorScheme 修饰符）
    var effectiveColorScheme: ColorScheme? {
        switch themeMode {
        case .auto:
            return nil  // 跟随系统
        case .light:
            return .light
        case .dark:
            return .dark
        }
    }

    init() {
        // 从 UserDefaults 加载保存的偏好，默认为 auto
        if let savedMode = UserDefaults.standard.string(forKey: userDefaultsKey),
           let mode = ThemeMode(rawValue: savedMode) {
            self.themeMode = mode
        } else {
            self.themeMode = .auto
        }
    }

    private func savePreference() {
        UserDefaults.standard.set(themeMode.rawValue, forKey: userDefaultsKey)
    }

    func updateSystemColorScheme(_ colorScheme: ColorScheme) {
        systemColorScheme = colorScheme
    }
}
