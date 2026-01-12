/**
 * Input: JournalEntry 数组，导出格式
 * Output: 可分享的文件 URL（Text/Markdown/PDF）
 * Pos: 处理格式转换和临时文件创建
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import Foundation
import UIKit
import PDFKit

@MainActor
class ExportService: ObservableObject {
    enum ExportFormat {
        case text
        case markdown
        case pdf
    }

    enum ExportError: Error {
        case noEntries
        case fileCreationFailed
        case pdfGenerationFailed

        var localizedDescription: String {
            switch self {
            case .noEntries:
                return "没有日记可导出"
            case .fileCreationFailed:
                return "文件创建失败"
            case .pdfGenerationFailed:
                return "PDF 生成失败"
            }
        }
    }

    // MARK: - Public Methods

    /// Export as plain text
    func exportAsText(_ entries: [JournalEntryWithBlocks]) throws -> URL {
        guard !entries.isEmpty else {
            throw ExportError.noEntries
        }

        let content = entries.map { entry in
            let header = "# \(entry.formattedDate)\n\n"
            let blocks = entry.blocks.map { block in
                let time = formatTime(block.createdAt ?? Date())
                return "[\(time)] \(block.content ?? "")"
            }.joined(separator: "\n\n")
            return header + blocks
        }.joined(separator: "\n\n---\n\n")

        return try writeToTempFile(content: content, ext: "txt")
    }

    /// Export as Markdown
    func exportAsMarkdown(_ entries: [JournalEntryWithBlocks]) throws -> URL {
        guard !entries.isEmpty else {
            throw ExportError.noEntries
        }

        let content = entries.map { entry in
            let header = "# \(entry.formattedDate)\n\n"
            let stats = "*\(entry.blocks.count) 条笔记*\n\n"
            let blocks = entry.blocks.enumerated().map { index, block in
                let time = formatTime(block.createdAt ?? Date())
                return "## 笔记 \(index + 1)\n**时间**: \(time)\n\n\(block.content ?? "")"
            }.joined(separator: "\n\n")
            return header + stats + blocks
        }.joined(separator: "\n\n---\n\n")

        return try writeToTempFile(content: content, ext: "md")
    }

    /// Export as PDF
    func exportAsPDF(_ entries: [JournalEntryWithBlocks]) throws -> URL {
        guard !entries.isEmpty else {
            throw ExportError.noEntries
        }

        let attributedString = createAttributedString(from: entries)
        return try generatePDF(from: attributedString)
    }

    // MARK: - Private Methods

    private func createAttributedString(from entries: [JournalEntryWithBlocks]) -> NSAttributedString {
        let result = NSMutableAttributedString()

        for (entryIndex, entry) in entries.enumerated() {
            // Add date header
            let dateAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 20),
                .foregroundColor: UIColor.label
            ]
            let dateString = NSAttributedString(string: "\(entry.formattedDate)\n\n", attributes: dateAttributes)
            result.append(dateString)

            // Add blocks
            for (blockIndex, block) in entry.blocks.enumerated() {
                // Time header
                let time = formatTime(block.createdAt ?? Date())
                let timeAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.italicSystemFont(ofSize: 12),
                    .foregroundColor: UIColor.secondaryLabel
                ]
                let timeString = NSAttributedString(string: "[\(time)]\n", attributes: timeAttributes)
                result.append(timeString)

                // Content
                let contentAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 14),
                    .foregroundColor: UIColor.label
                ]
                let contentString = NSAttributedString(
                    string: "\(block.content ?? "")\n\n",
                    attributes: contentAttributes
                )
                result.append(contentString)

                // Add spacing between blocks
                if blockIndex < entry.blocks.count - 1 {
                    result.append(NSAttributedString(string: "\n"))
                }
            }

            // Add separator between entries
            if entryIndex < entries.count - 1 {
                let separatorAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 14),
                    .foregroundColor: UIColor.separator
                ]
                result.append(NSAttributedString(string: "━━━━━━━━━━━━━━━━━━\n\n", attributes: separatorAttributes))
            }
        }

        return result
    }

    private func generatePDF(from text: NSAttributedString) throws -> URL {
        // PDF page size (US Letter: 612x792 points)
        let pageWidth: CGFloat = 612
        let pageHeight: CGFloat = 792
        let margin: CGFloat = 50

        let pdfMetaData = [
            kCGPDFContextCreator: "Cebu",
            kCGPDFContextTitle: "Journal Export"
        ]

        let url = tempDirectory
            .appendingPathComponent("Cebu_Export_\(Date().timeIntervalSince1970)")
            .appendingPathExtension("pdf")

        guard let pdfContext = CGContext(url as CFURL, mediaBox: nil, pdfMetaData as CFDictionary) else {
            throw ExportError.pdfGenerationFailed
        }

        let textRect = CGRect(
            x: margin,
            y: margin,
            width: pageWidth - 2 * margin,
            height: pageHeight - 2 * margin
        )

        let framesetter = CTFramesetterCreateWithAttributedString(text)
        var currentRange = CFRange(location: 0, length: 0)
        var currentPage = 0
        let textLength = text.length

        while currentRange.location < textLength {
            pdfContext.beginPage(mediaBox: nil)

            let framePath = CGPath(rect: textRect, transform: nil)
            let frameRange = CFRange(location: currentRange.location, length: 0)
            let frame = CTFramesetterCreateFrame(framesetter, frameRange, framePath, nil)

            pdfContext.textMatrix = .identity
            pdfContext.translateBy(x: 0, y: pageHeight)
            pdfContext.scaleBy(x: 1.0, y: -1.0)

            CTFrameDraw(frame, pdfContext)

            let visibleRange = CTFrameGetVisibleStringRange(frame)
            currentRange.location = visibleRange.location + visibleRange.length
            currentRange.length = 0

            pdfContext.endPage()
            currentPage += 1
        }

        pdfContext.closePDF()

        print("[ExportService] Generated PDF with \(currentPage) pages")
        return url
    }

    private func writeToTempFile(content: String, ext: String) throws -> URL {
        let url = tempDirectory
            .appendingPathComponent("Cebu_Export_\(Date().timeIntervalSince1970)")
            .appendingPathExtension(ext)

        do {
            try content.write(to: url, atomically: true, encoding: .utf8)
            print("[ExportService] Created \(ext.uppercased()) file at \(url)")
            return url
        } catch {
            print("[ExportService] Failed to write file: \(error)")
            throw ExportError.fileCreationFailed
        }
    }

    private var tempDirectory: URL {
        FileManager.default.temporaryDirectory
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }

    /// Clean up temporary files
    func cleanupTemporaryFiles() {
        let fileManager = FileManager.default
        let tempDir = fileManager.temporaryDirectory

        do {
            let tempFiles = try fileManager.contentsOfDirectory(
                at: tempDir,
                includingPropertiesForKeys: nil
            ).filter { $0.lastPathComponent.hasPrefix("Cebu_Export_") }

            for file in tempFiles {
                try? fileManager.removeItem(at: file)
            }

            print("[ExportService] Cleaned up \(tempFiles.count) temporary files")
        } catch {
            print("[ExportService] Cleanup error: \(error)")
        }
    }
}
