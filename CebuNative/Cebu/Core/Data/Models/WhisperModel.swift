/**
 * Input: User model selection preference
 * Output: WhisperKit model configuration enum with display properties
 * Pos: Core model for WhisperKit model selection and metadata
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

enum WhisperModel: String, CaseIterable, Identifiable {
    case tiny = "tiny"
    case tinyEn = "tiny.en"
    case base = "base"
    case baseEn = "base.en"
    case small = "small"
    case smallEn = "small.en"
    case medium = "medium"
    case mediumEn = "medium.en"
    case largeV3 = "large-v3"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .tiny: return "Tiny (多语言)"
        case .tinyEn: return "Tiny (英语)"
        case .base: return "Base (多语言)"
        case .baseEn: return "Base (英语)"
        case .small: return "Small (多语言)"
        case .smallEn: return "Small (英语)"
        case .medium: return "Medium (多语言)"
        case .mediumEn: return "Medium (英语)"
        case .largeV3: return "Large V3 (最强)"
        }
    }

    var size: String {
        switch self {
        case .tiny, .tinyEn: return "~75 MB"
        case .base, .baseEn: return "~150 MB"
        case .small, .smallEn: return "~500 MB"
        case .medium, .mediumEn: return "~1.5 GB"
        case .largeV3: return "~3 GB"
        }
    }

    var description: String {
        switch self {
        case .tiny, .tinyEn:
            return "最快，准确度较低"
        case .base, .baseEn:
            return "快速，基础准确度"
        case .small, .smallEn:
            return "平衡速度与准确度"
        case .medium, .mediumEn:
            return "较慢，高准确度"
        case .largeV3:
            return "最慢，最高准确度"
        }
    }

    var supportsMultilingual: Bool {
        switch self {
        case .tinyEn, .baseEn, .smallEn, .mediumEn:
            return false
        default:
            return true
        }
    }

    var iconName: String {
        switch self {
        case .tiny, .tinyEn: return "gauge.low"
        case .base, .baseEn: return "gauge.medium"
        case .small, .smallEn: return "gauge.medium.high"
        case .medium, .mediumEn: return "gauge.high"
        case .largeV3: return "gauge.high"
        }
    }

    var qualityLevel: Int {
        switch self {
        case .tiny, .tinyEn: return 1
        case .base, .baseEn: return 2
        case .small, .smallEn: return 3
        case .medium, .mediumEn: return 4
        case .largeV3: return 5
        }
    }
}
