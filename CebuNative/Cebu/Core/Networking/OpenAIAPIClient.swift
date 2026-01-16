/**
 * Input: Audio file URL, OpenAI API credentials
 * Output: Transcription text via URLSession
 * Pos: HTTP client for OpenAI Whisper API with multipart form-data encoding
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation

/// HTTP client for OpenAI Whisper API
class OpenAIAPIClient {
    // MARK: - Properties

    private let baseURL = "https://api.openai.com/v1"
    private let apiKey: String
    private let session: URLSession

    // MARK: - Initialization

    init(apiKey: String) {
        self.apiKey = apiKey

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
    }

    // MARK: - Public Methods

    /// Transcribe audio file using OpenAI Whisper API
    /// - Parameters:
    ///   - fileURL: Local audio file URL
    ///   - language: Language code (default: "zh" for Chinese)
    /// - Returns: Transcribed text
    func transcribe(fileURL: URL, language: String = "zh") async throws -> String {
        let endpoint = "\(baseURL)/audio/transcriptions"

        guard let url = URL(string: endpoint) else {
            throw OpenAIError.invalidResponse
        }

        // Create multipart form-data request
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        // Build multipart body
        var body = Data()

        // Add file
        let fileData = try Data(contentsOf: fileURL)

        // Check file size (25MB limit)
        if fileData.count > 25 * 1024 * 1024 {
            throw OpenAIError.fileTooBig
        }

        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"audio.m4a\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: audio/m4a\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)

        // Add model
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"model\"\r\n\r\n".data(using: .utf8)!)
        body.append("whisper-1\r\n".data(using: .utf8)!)

        // Add language
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"language\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(language)\r\n".data(using: .utf8)!)

        // Add response format
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"response_format\"\r\n\r\n".data(using: .utf8)!)
        body.append("json\r\n".data(using: .utf8)!)

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        // Make request
        let (data, response) = try await session.data(for: request)

        // Check HTTP status
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OpenAIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200:
            // Parse response
            let json = try JSONDecoder().decode(TranscriptionResponse.self, from: data)
            return json.text

        case 401:
            throw OpenAIError.authenticationFailed

        case 429:
            // Rate limited
            let retryAfter = httpResponse.value(forHTTPHeaderField: "Retry-After")
            throw OpenAIError.rateLimited(retryAfter: Int(retryAfter ?? ""))

        case 402:
            throw OpenAIError.quotaExceeded

        default:
            throw OpenAIError.httpError(statusCode: httpResponse.statusCode)
        }
    }

    /// Validate API key by making a test request
    /// - Returns: True if API key is valid
    func validateAPIKey() async -> Bool {
        // Make a minimal request to /models endpoint
        let endpoint = "\(baseURL)/models"
        guard let url = URL(string: endpoint) else { return false }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")

        do {
            let (_, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else { return false }
            return httpResponse.statusCode == 200
        } catch {
            return false
        }
    }
}

// MARK: - Response Models

/// Response from OpenAI transcription API
struct TranscriptionResponse: Codable {
    let text: String
}

// MARK: - Errors

/// Errors that can occur when using OpenAI API
enum OpenAIError: LocalizedError {
    case missingAPIKey
    case invalidAPIKey
    case authenticationFailed
    case quotaExceeded
    case rateLimited(retryAfter: Int?)
    case httpError(statusCode: Int)
    case invalidResponse
    case fileTooBig
    case audioConversionFailed

    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "未配置 OpenAI API 密钥，请在设置中添加"
        case .invalidAPIKey:
            return "API 密钥格式无效"
        case .authenticationFailed:
            return "API 密钥认证失败，请检查密钥是否正确"
        case .quotaExceeded:
            return "API 配额已用尽，请检查 OpenAI 账户"
        case .rateLimited(let retryAfter):
            if let seconds = retryAfter {
                return "请求过于频繁，请 \(seconds) 秒后重试"
            }
            return "请求过于频繁，请稍后重试"
        case .httpError(let code):
            return "服务器错误 (\(code))，请稍后重试"
        case .invalidResponse:
            return "服务器响应格式错误"
        case .fileTooBig:
            return "音频文件过大 (超过 25MB)，请录制较短的音频"
        case .audioConversionFailed:
            return "音频格式转换失败"
        }
    }
}
