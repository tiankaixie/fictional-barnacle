/**
 * Input: User model preference, WhisperKit availability
 * Output: Selected model configuration with persistence
 * Pos: Observable service managing WhisperKit model selection and UserDefaults persistence
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

@MainActor
class ModelManager: ObservableObject {
    // 当前选择的模型
    @Published var selectedModel: WhisperModel {
        didSet { savePreference() }
    }

    private let userDefaultsKey = "app.whisper.model"

    init() {
        // 从 UserDefaults 加载保存的偏好，默认为 small (平衡速度与准确度)
        if let savedModel = UserDefaults.standard.string(forKey: userDefaultsKey),
           let model = WhisperModel(rawValue: savedModel) {
            self.selectedModel = model
        } else {
            self.selectedModel = .small
        }
    }

    private func savePreference() {
        UserDefaults.standard.set(selectedModel.rawValue, forKey: userDefaultsKey)
        print("[ModelManager] Saved model preference: \(selectedModel.rawValue)")
    }

    func setModel(_ model: WhisperModel) {
        selectedModel = model
    }
}
