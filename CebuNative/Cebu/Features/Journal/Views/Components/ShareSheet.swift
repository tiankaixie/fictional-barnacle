/**
 * Input: 分享内容 URL
 * Output: 原生分享界面
 * Pos: UIActivityViewController 的 SwiftUI 包装
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI
import UIKit

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    let onComplete: () -> Void

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )

        controller.completionWithItemsHandler = { _, _, _, _ in
            onComplete()
        }

        return controller
    }

    func updateUIViewController(
        _ uiViewController: UIActivityViewController,
        context: Context
    ) {
        // No updates needed
    }
}
