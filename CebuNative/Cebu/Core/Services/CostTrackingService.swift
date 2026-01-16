/**
 * Input: Transcription duration and provider
 * Output: Cost statistics and tracking
 * Pos: Service managing transcription cost tracking and monthly statistics
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import CoreData

@MainActor
class CostTrackingService: ObservableObject {
    // MARK: - Properties

    private let context: NSManagedObjectContext
    private let costPerMinute: [String: Double] = [
        "openai-whisper": 0.006  // $0.006 per minute
    ]

    // MARK: - Initialization

    init(context: NSManagedObjectContext) {
        self.context = context
    }

    // MARK: - Public Methods

    /// Record a transcription cost
    /// - Parameters:
    ///   - duration: Duration in seconds
    ///   - provider: API provider name (default: "openai-whisper")
    ///   - entryId: Optional associated JournalEntry ID
    func recordTranscription(duration: Double, provider: String = "openai-whisper", entryId: UUID? = nil) async throws {
        let durationMinutes = duration / 60.0
        let costPerMin = costPerMinute[provider] ?? 0.0
        let totalCost = durationMinutes * costPerMin

        let cost = TranscriptionCost(context: context)
        cost.id = UUID()
        cost.date = Date()
        cost.duration = duration
        cost.cost = totalCost
        cost.provider = provider
        cost.entryId = entryId

        try context.save()

        print("[CostTracking] Recorded: \(duration)s, $\(String(format: "%.4f", totalCost))")
    }

    /// Get monthly statistics for a specific month
    /// - Parameters:
    ///   - year: Year
    ///   - month: Month (1-12)
    /// - Returns: Monthly cost statistics
    func getMonthlyStats(year: Int, month: Int) async throws -> MonthlyCostStats {
        let calendar = Calendar.current
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = 1

        guard let startDate = calendar.date(from: components),
              let endDate = calendar.date(byAdding: .month, value: 1, to: startDate) else {
            throw CostTrackingError.invalidDate
        }

        let fetchRequest: NSFetchRequest<TranscriptionCost> = TranscriptionCost.fetchRequest()
        fetchRequest.predicate = NSPredicate(
            format: "date >= %@ AND date < %@",
            startDate as NSDate,
            endDate as NSDate
        )

        let costs = try context.fetch(fetchRequest)

        let totalDuration = costs.reduce(0.0) { $0 + $1.duration }
        let totalCost = costs.reduce(0.0) { $0 + $1.cost }
        let transcriptionCount = costs.count

        // Calculate days in month
        let range = calendar.range(of: .day, in: .month, for: startDate)
        let daysInMonth = range?.count ?? 30

        // Calculate days with usage
        let daysWithUsage = Set(costs.compactMap { cost -> Int? in
            guard let date = cost.date else { return nil }
            return calendar.component(.day, from: date)
        }).count

        // Calculate average daily usage (only counting days with usage)
        let averageDailyUsage = daysWithUsage > 0 ? totalDuration / Double(daysWithUsage) : 0

        return MonthlyCostStats(
            totalDuration: totalDuration,
            totalCost: totalCost,
            transcriptionCount: transcriptionCount,
            averageDailyUsage: averageDailyUsage,
            daysInMonth: daysInMonth,
            daysWithUsage: daysWithUsage
        )
    }

    /// Get statistics for current month
    /// - Returns: Current month cost statistics
    func getCurrentMonthStats() async throws -> MonthlyCostStats {
        let calendar = Calendar.current
        let now = Date()
        let year = calendar.component(.year, from: now)
        let month = calendar.component(.month, from: now)

        return try await getMonthlyStats(year: year, month: month)
    }

    /// Delete all cost records (for testing or reset)
    func clearAllRecords() async throws {
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = TranscriptionCost.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)

        try context.execute(deleteRequest)
        try context.save()

        print("[CostTracking] All records cleared")
    }
}

// MARK: - Models

/// Monthly cost statistics
struct MonthlyCostStats {
    let totalDuration: Double      // Total duration in seconds
    let totalCost: Double          // Total cost in USD
    let transcriptionCount: Int    // Number of transcriptions
    let averageDailyUsage: Double  // Average daily usage in seconds
    let daysInMonth: Int          // Total days in month
    let daysWithUsage: Int        // Days that had at least one transcription

    /// Format duration as "X分Y秒"
    var formattedDuration: String {
        let minutes = Int(totalDuration) / 60
        let seconds = Int(totalDuration) % 60
        return "\(minutes)分\(seconds)秒"
    }

    /// Format cost as "$X.XX"
    var formattedCost: String {
        return String(format: "$%.2f", totalCost)
    }

    /// Format average daily usage as "X分Y秒"
    var formattedAverageDailyUsage: String {
        let minutes = Int(averageDailyUsage) / 60
        let seconds = Int(averageDailyUsage) % 60
        return "\(minutes)分\(seconds)秒"
    }
}

// MARK: - Errors

enum CostTrackingError: LocalizedError {
    case invalidDate
    case saveFailed

    var errorDescription: String? {
        switch self {
        case .invalidDate:
            return "日期无效"
        case .saveFailed:
            return "保存失败"
        }
    }
}
