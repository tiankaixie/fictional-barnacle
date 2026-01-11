/**
 * Input: Unique identifier
 * Output: Ripple animation state (scale, opacity)
 * Pos: Shared model for water ripple effects
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct RippleEffect: Identifiable {
    let id: UUID
    var scale: CGFloat = 1.0
    var opacity: Double = 0.8
}
