/**
 * Input: JournalListViewModel, RecordingViewModel
 * Output: Main journal interface with list and voice button
 * Pos: Primary app screen showing all journal entries
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI

struct JournalListView: View {
    @Environment(\.themeColors) var colors
    @StateObject var viewModel: JournalListViewModel
    @StateObject var recordingViewModel: RecordingViewModel

    @State private var showSettings = false

    var body: some View {
        NavigationView {
            ZStack {
            // Background
            colors.background
                .ignoresSafeArea()

            // Main content
            ScrollView {
                LazyVStack(spacing: 20) {
                    ForEach(viewModel.entries) { entryWithBlocks in
                        DayEntryView(
                            entryWithBlocks: entryWithBlocks,
                            isEditing: viewModel.isEditing(entryWithBlocks.id),
                            onToggleEdit: {
                                viewModel.toggleEditMode(for: entryWithBlocks.id)
                            },
                            onUpdateBlock: { block, newContent in
                                Task {
                                    await viewModel.updateBlock(block, newContent: newContent)
                                }
                            },
                            onDeleteBlock: { block in
                                Task {
                                    await viewModel.deleteBlock(block)
                                }
                            }
                        )
                    }

                    // Load more trigger
                    if viewModel.isLoading {
                        ProgressView()
                            .padding()
                    } else {
                        Color.clear
                            .frame(height: 1)
                            .onAppear {
                                Task {
                                    await viewModel.loadMoreEntriesIfNeeded()
                                }
                            }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 100) // Space for voice button
            }
            .refreshable {
                await viewModel.refreshEntries()
            }

            // Floating voice button
            VStack {
                Spacer()
                VoiceInputButtonView(
                    isRecording: recordingViewModel.isRecording,
                    onPress: {
                        Task {
                            if recordingViewModel.isRecording {
                                await recordingViewModel.stopRecording()
                            } else {
                                await recordingViewModel.startRecording()
                            }
                        }
                    }
                )
                .padding(.bottom, 40)
            }

            // Model initialization overlay
            if !recordingViewModel.isInitialized {
                ZStack {
                    Color.black.opacity(0.5)
                        .ignoresSafeArea()

                    VStack(spacing: 24) {
                        // Indeterminate progress indicator
                        ProgressView()
                            .scaleEffect(1.5)
                            .tint(.white)

                        Text("下载中文 AI 模型...")
                            .font(.headline)
                            .foregroundColor(.white)

                        if recordingViewModel.initializationAttempt > 1 {
                            Text("重试中... (尝试 \(recordingViewModel.initializationAttempt)/3)\n正在清理缓存并重新下载")
                                .font(.caption)
                                .foregroundColor(.yellow.opacity(0.9))
                                .multilineTextAlignment(.center)
                        } else {
                            Text("正在下载 'small' 模型 (~500MB)\n识别更准确，首次下载需要几分钟")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.8))
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding(32)
                    .background(.ultraThinMaterial)
                    .cornerRadius(20)
                    .padding(24)
                }
                .transition(.opacity)
            }

            // Processing overlay (after recording stops, during transcription)
            if recordingViewModel.isProcessing && !recordingViewModel.isRecording {
                ZStack {
                    Color.black.opacity(0.5)
                        .ignoresSafeArea()

                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.5)
                            .tint(.white)

                        Text("正在转换为文字...")
                            .font(.headline)
                            .foregroundColor(.white)

                        Text("请稍候")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(32)
                    .background(.ultraThinMaterial)
                    .cornerRadius(20)
                    .padding(24)
                }
                .transition(.opacity)
            }

            // Error overlay
            if let error = viewModel.error ?? recordingViewModel.error {
                VStack {
                    Spacer()
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.white)
                        .padding()
                        .background(colors.destructive)
                        .cornerRadius(8)
                        .padding(.bottom, 120)
                }
                .transition(.move(edge: .bottom))
            }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                            .foregroundColor(colors.textSecondary)
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
        .fullScreenCover(isPresented: $recordingViewModel.isRecording) {
            RecordingOverlayView(viewModel: recordingViewModel)
        }
        .task {
            await viewModel.loadEntries()
        }
    }
}

// MARK: - Preview

#Preview("With Entries") {
    let context = PersistenceController.preview.container.viewContext

    let user = User(context: context)
    user.id = UUID()
    user.displayName = "Test User"

    let repository = JournalRepository(context: context)
    let journalVM = JournalListViewModel(repository: repository, user: user)

    let whisperService = WhisperKitService()
    let recordingVM = RecordingViewModel(
        whisperService: whisperService,
        journalViewModel: journalVM
    )

    return JournalListView(
        viewModel: journalVM,
        recordingViewModel: recordingVM
    )
    .environment(\.themeColors, .light)
}

#Preview("Dark Mode") {
    let context = PersistenceController.preview.container.viewContext

    let user = User(context: context)
    user.id = UUID()
    user.displayName = "Test User"

    let repository = JournalRepository(context: context)
    let journalVM = JournalListViewModel(repository: repository, user: user)

    let whisperService = WhisperKitService()
    let recordingVM = RecordingViewModel(
        whisperService: whisperService,
        journalViewModel: journalVM
    )

    return JournalListView(
        viewModel: journalVM,
        recordingViewModel: recordingVM
    )
    .environment(\.themeColors, .dark)
    .preferredColorScheme(.dark)
}
