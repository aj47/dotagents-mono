import {
  useConfigContext,
  saveConfig,
} from '../store/config';
import { useSessionContext } from '../store/sessions';
import { useMessageQueueContext } from '../store/message-queue';
import {
  ChatMessageRuntimeChromeSurface,
  useChatConversationHomePromptEditorDeleteChromeActionsState,
  useChatConversationHomePromptEditorSaveChromeActionsState,
  useChatConversationHomePromptTaskRunChromeActionsState,
  useChatConversationHomePromptTaskRunState,
  useChatConversationHomeQuickStartCatalogState,
  useChatConversationHomeQuickStartCatalogLoadState,
  useChatConversationHomePromptEditorState,
  useChatRuntimeAgentSelectorOverlayState,
  useChatComposerRuntimeEditBeforeSendState,
  useChatRuntimeStatusState,
  useChatRuntimeRequestDebugState,
  useChatRuntimeRequestDebugActionsState,
  useChatRuntimeRequestTrackingState,
  useChatRuntimeSettingsClientState,
  useChatRuntimeSessionClientState,
  useChatRuntimeConnectionStatusSubscription,
  useChatRuntimeConnectionRetryState,
  useChatRuntimeConnectionRetryActionState,
  useChatRuntimeNavigationForegroundState,
  useChatRuntimeHandsFreeMutableState,
  useChatRuntimeHandsFreeToggleChromeActionsState,
  useChatRuntimeTextToSpeechToggleChromeActionsState,
  useChatComposerRuntimeDraftState,
  useChatComposerRuntimeImageLibraryPickerState,
  useChatComposerRuntimeSubmissionChromeState,
  useChatComposerRuntimeHandsFreeControlChromeActionsState,
  useChatComposerRuntimeHandsFreeControllerState,
  useChatComposerRuntimeHandsFreeRecognizerLifecycleState,
  useChatComposerRuntimeSpeechRecognizerChromeActionsState,
  useChatComposerRuntimeSpeechRecognizerState,
  useChatComposerRuntimeHandsFreeDebugActionsState,
  useChatComposerRuntimeVoiceDebugState,
  useChatComposerRuntimeVoiceDebugResetState,
  useChatRuntimeNavigationHeaderChromeOptions,
  useChatMessageRuntimeTurnDurations,
  useChatMessageRuntimeMessageState,
  useChatMessageRuntimeSendRef,
  useChatMessageRuntimeSessionRefState,
  useChatMessageRuntimeRouteInitialMessageActionsState,
  useChatMessageRuntimeInitialMessageState,
  useChatMessageRuntimeSessionLoadState,
  useChatMessageRuntimeSessionPersistState,
  useChatMessageRuntimeResponseHistoryState,
  useChatMessageRuntimeAssistantSpeechChromeActionsState,
  useChatMessageRuntimeResponseSpeechQueueActionsState,
  useChatMessageRuntimeSpeechChromeActionsState,
  useChatMessageRuntimeSpeechChromeCleanupState,
  useChatMessageRuntimeSpeechPlaybackState,
  useChatMessageRuntimeRemoteSpeechSettingsState,
  useChatMessageRuntimeEffectiveRemoteSpeechSettingsState,
  useChatMessageRuntimeThreadExpansionState,
  useChatConversationHomeQuickStartActionsState,
  useChatMessageRuntimeHistoryWindowState,
  useChatMessageRuntimeScrollController,
  useChatMessageRuntimeKillSwitchChromeActionsState,
  useChatRuntimeCurrentSessionSnapshotState,
  useChatRuntimeCurrentAgentProfileState,
  useChatMessageRuntimeKeyboardOffsetState,
  useChatRuntimeBackToSessionsActionsState,
  useChatRuntimeNavigateToChatActionsState,
  useChatRuntimeCurrentSessionPinActionsState,
  useChatMessageRuntimeBranchProgressState,
  useChatMessageRuntimeBranchChromeActionsState,
  useChatMessageRuntimeToolApprovalResponseState,
  useChatMessageRuntimeToolApprovalChromeActionsState,
  useChatMessageRuntimeQueuePanelState,
  scheduleChatMessageRuntimeNextQueuedMessage,
  useChatMessageCopyFeedbackState,
  useChatMessageRuntimeClipboardChromeActionsState,
  useChatRuntimeMobileConfigState,
  useChatMessageRuntimeChromeStyleState,
  useChatMessageRuntimeChromeInputState,
  useChatMessageRuntimeSurfaceInputState,
  useChatMessageRuntimeViewportInputState,
  useChatMessageRuntimeDockInputState,
  useChatMessageRuntimeThreadListInputState,
  useChatMessageRuntimeComposerInputState,
} from '../ui/ChatMessageChrome';
import { useConnectionManager } from '../store/connectionManager';
import type { ChatMessage } from '../lib/openaiClient';
import { ExtendedSettingsApiClient } from '../lib/settingsApi';
import {
  applyChatMessageRuntimeBlockedTurnStatusState,
  applyChatMessageRuntimeCompletedTurnStatusState,
  applyChatMessageRuntimePendingTurnStatusState,
  applyChatMessageRuntimeProgressTurnStatusState,
  applyChatMessageRuntimeSettledTurnStatusState,
  createChatMessageRuntimeConnectionErrorTurnState,
  createChatMessageRuntimeFinalResponseTurnState,
  createChatMessageRuntimeFinalResponseTextState,
  createChatMessageRuntimeLogMeta,
  createChatMessageRuntimeModelMessages,
  createChatMessageRuntimePendingTurnState,
  createChatMessageRuntimeProgressTurnState,
  createChatMessageRuntimeProgressResponseState,
  createChatMessageRuntimeQueuedErrorState,
  createChatMessageRuntimeStreamingTurnState,
  createChatRuntimeErrorLogDetailsState,
  createChatRuntimeRequestSupersededQueueFailureState,
  createChatRuntimeSessionChangedDuringProcessingQueueFailureState,
  hasChatMessageRuntimeRequestSessionChanged,
  isChatMessageRuntimeActiveRequest,
  isChatMessageRuntimeLatestSessionRequest,
  type AgentConversationState,
  type AgentProgressUpdate,
  type AgentUserResponseEvent,
  type Loop,
  type PredefinedPromptSummary,
} from '@dotagents/shared/session-presentation';

export default function ChatScreen({ route, navigation }: any) {
  const { chatRuntimeChrome } = useChatMessageRuntimeChromeStyleState();
  const { keyboardVerticalOffset } = useChatMessageRuntimeKeyboardOffsetState();
  const { config, setConfig } = useConfigContext();
  const sessionStore = useSessionContext();
  const messageQueue = useMessageQueueContext();
  const connectionManager = useConnectionManager();
  const { currentAgentName } = useChatRuntimeCurrentAgentProfileState();
  const {
    currentSession,
    isCurrentSessionPinned,
    currentConversationId,
  } = useChatRuntimeCurrentSessionSnapshotState({
    currentSessionId: sessionStore.currentSessionId,
    getCurrentSession: sessionStore.getCurrentSession,
  });
  const {
    settingsClient,
    createLazyLoadSettingsClient,
    hasServerAuth,
  } = useChatRuntimeSettingsClientState<ExtendedSettingsApiClient>({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    Client: ExtendedSettingsApiClient,
  });
  const quickStartCatalog = useChatConversationHomeQuickStartCatalogState();
  const {
    predefinedPrompts,
    setPredefinedPrompts,
    availableSkills,
    availableTasks,
    isLoadingQuickStartPrompts,
  } = quickStartCatalog;
  const {
    runningPromptTaskId,
    canRunPromptTask,
    beginPromptTaskRun,
    clearPromptTaskRun,
  } = useChatConversationHomePromptTaskRunState();
  const {
    remoteTtsProvider,
    remoteTtsVoice,
    remoteTtsModel,
    remoteTtsRate,
    applyRemoteSpeechSettings,
  } = useChatMessageRuntimeRemoteSpeechSettingsState();
  const {
    pendingToolApprovalResponseId,
    beginToolApprovalResponse,
    clearToolApprovalResponse,
  } = useChatMessageRuntimeToolApprovalResponseState({
    sessionId: sessionStore.currentSessionId,
  });
  const {
    pendingBranchMessageIndex,
    beginBranchMessage,
    clearBranchMessage,
  } = useChatMessageRuntimeBranchProgressState({
    sessionId: sessionStore.currentSessionId,
  });
  const {
    copiedMessageIndex,
    clearCopiedMessageFeedback,
    showCopiedMessageFeedback,
  } = useChatMessageCopyFeedbackState();
  const {
    handleCopyMessage,
    handleCopyToolPayload,
  } = useChatMessageRuntimeClipboardChromeActionsState({
    showCopiedMessageFeedback,
  });
  const {
    provider: effectiveTtsProvider,
    voice: effectiveRemoteTtsVoice,
    model: effectiveRemoteTtsModel,
    rate: effectiveRemoteTtsRate,
  } = useChatMessageRuntimeEffectiveRemoteSpeechSettingsState({
    config,
    remoteTtsProvider,
    remoteTtsVoice,
    remoteTtsModel,
    remoteTtsRate,
  });
  const {
    promptEditorVisible: addPromptModalVisible,
    promptEditorEditingPrompt: editingPrompt,
    promptEditorIsEditing,
    promptEditorNameValue: newPromptName,
    setPromptEditorNameValue: setNewPromptName,
    promptEditorContentValue: newPromptContent,
    setPromptEditorContentValue: setNewPromptContent,
    promptEditorIsSaving: isSavingPrompt,
    openAddPromptEditor: openAddPromptModal,
    openEditPromptEditor: openEditPromptModal,
    closePromptEditor: closePromptModal,
    dismissPromptEditor,
    beginPromptEditorSave,
    clearPromptEditorSave,
  } = useChatConversationHomePromptEditorState();
  const chatRuntimeConfig = useChatRuntimeMobileConfigState(config);
  const {
    handsFree,
    handsFreeMessageDebounceMs,
    handsFreeWakePhrase,
    handsFreeSleepPhrase,
    handsFreeDebugEnabled,
    handsFreeForegroundOnly,
    messageQueueEnabled,
    ttsEnabled,
  } = chatRuntimeConfig;
  const {
    handsFreeRef,
    handsFreePhaseRef,
    ttsEnabledRef,
    setHandsFreeRefValue,
    setHandsFreePhaseRefValue,
  } = useChatRuntimeHandsFreeMutableState({
    handsFree,
    ttsEnabled,
  });
  const {
    isFocused,
    handsFreeRuntimeActive,
  } = useChatRuntimeNavigationForegroundState({
    handsFree,
  });

  const {
    responding,
    setResponding,
    conversationState,
    setConversationState,
    latestStepSummary,
    setLatestStepSummary,
    connectionState,
    setConnectionState,
  } = useChatRuntimeStatusState();
  const {
    agentSelectorVisible,
    openAgentSelector,
    closeAgentSelector,
  } = useChatRuntimeAgentSelectorOverlayState();
  const {
    editBeforeSendEnabled: willCancel,
    toggleEditBeforeSend,
  } = useChatComposerRuntimeEditBeforeSendState();
  const {
    requestDebugText: debugInfo,
    setRequestDebugText: setDebugInfo,
    clearRequestDebugText: clearDebugInfo,
  } = useChatRuntimeRequestDebugState();
  const {
    showNoSessionAvailableDebug,
    showStartingRequestDebug,
    showRequestSentDebug,
    showCompletedDebug,
    showProcessingQueuedMessageDebug,
  } = useChatRuntimeRequestDebugActionsState({
    setRequestDebugText: setDebugInfo,
  });
  const {
    lastFailedMessage,
    setLastFailedMessage,
    clearLastFailedMessage,
  } = useChatRuntimeConnectionRetryState();
  const {
    input,
    setInput,
    pendingImages,
    setPendingImages,
    inputRef,
    clearComposerInput,
    clearPendingImages,
    clearComposerDraft,
    focusComposerInput,
    mergeVoiceTextIntoComposer,
    removePendingImage,
  } = useChatComposerRuntimeDraftState();
  const { handlePickImages } = useChatComposerRuntimeImageLibraryPickerState({
    pendingImages,
    setPendingImages,
  });
  const {
    respondToUserHistory,
    playedResponseEventIdsRef,
    queuedResponseEventsRef,
    activeAutoSpeechEventIdRef,
    recentAutoSpeechByTextRef,
    replaceResponseHistory,
    createFallbackResponseEvent,
    mergeResponseEvents,
    clearQueuedResponseSpeech,
    resetResponseSpeechPlaybackState,
  } = useChatMessageRuntimeResponseHistoryState();
  const {
    speakingMessageIndex,
    intendedSpeakingIndexRef,
    setIntendedSpeakingMessage,
    startSpeakingMessage,
    clearSpeakingMessage,
    clearIntendedSpeakingMessage,
  } = useChatMessageRuntimeSpeechPlaybackState();

  const {
    activeRequestIdRef,
    currentSessionIdRef,
  } = useChatRuntimeRequestTrackingState({
    currentSessionId: sessionStore.currentSessionId,
  });
  const { getSessionClient } = useChatRuntimeSessionClientState({
    currentSessionId: sessionStore.currentSessionId,
    connectionManager,
  });

  useChatRuntimeConnectionStatusSubscription({
    currentSessionId: sessionStore.currentSessionId,
    connectionManager,
    currentSessionIdRef,
    setConnectionState,
    setResponding,
    setConversationState,
    setLatestStepSummary,
  });

  const { handleKillSwitch } = useChatMessageRuntimeKillSwitchChromeActionsState({
    ...chatRuntimeChrome.environment,
    getKillSwitchClient: getSessionClient,
  });

  const { handleRunPromptTask } = useChatConversationHomePromptTaskRunChromeActionsState<Loop, ExtendedSettingsApiClient>({
    taskClient: settingsClient,
    canRunPromptTask,
    beginPromptTaskRun,
    clearPromptTaskRun,
  });

  const { handleQuickStartPress } = useChatConversationHomeQuickStartActionsState<PredefinedPromptSummary, Loop>({
    setComposerInput: setInput,
    focusComposerInput,
    openAddPrompt: openAddPromptModal,
    runPromptTask: handleRunPromptTask,
  });

  const { handleToggleCurrentSessionPinned } = useChatRuntimeCurrentSessionPinActionsState({
    sessionStore,
  });
  const { navigateToChat } = useChatRuntimeNavigateToChatActionsState({
    navigation,
  });

  const { handleBranchFromMessagePress } = useChatMessageRuntimeBranchChromeActionsState({
    branchClient: settingsClient,
    serverConversationId: currentSession?.serverConversationId,
    sessionStore,
    beginBranchMessage,
    clearBranchMessage,
    navigateToChat,
  });

  const {
    messages,
    setMessages,
    messagesRef,
    progressMessagesRef,
  } = useChatMessageRuntimeMessageState<ChatMessage>();
  const { sendRef, syncSendRef } = useChatMessageRuntimeSendRef();
  const {
    lastLoadedSessionIdRef,
    pendingLazyLoadSessionIdRef,
    skipNextPersistRef,
    initialMessageRef,
    initialMessageSentRef,
    prevMessagesLengthRef,
    prevSessionIdRef,
    convoRef,
  } = useChatMessageRuntimeSessionRefState({
    initialMessage: route?.params?.initialMessage ?? null,
  });
  const turnDurations = useChatMessageRuntimeTurnDurations({
    messages,
    isResponding: responding,
    conversationState,
  });
  const { respondToToolApproval } = useChatMessageRuntimeToolApprovalChromeActionsState<ChatMessage>({
    approvalClient: settingsClient,
    beginToolApprovalResponse,
    clearToolApprovalResponse,
    setMessages,
  });
  const {
    visibleMessageCount,
    loadEarlierMessages,
    loadIncrement: messageHistoryLoadIncrement,
    scrollEventThrottleMs,
    dragEndDebounceMs,
    bottomResumeThresholdPx,
    topLoadThresholdPx,
  } = useChatMessageRuntimeHistoryWindowState({
    messageCount: messages.length,
    sessionId: sessionStore.currentSessionId,
  });
  const {
    scrollRef: scrollViewRef,
    shouldAutoScroll,
    onScroll: handleScroll,
    onScrollBeginDrag: handleScrollBeginDrag,
    onScrollEndDrag: handleScrollEndDrag,
    scrollToBottom: handleScrollToBottomPress,
  } = useChatMessageRuntimeScrollController({
    messages,
    sessionId: sessionStore.currentSessionId,
    visibleMessageCount,
    bottomResumeThresholdPx,
    topLoadThresholdPx,
    dragEndDebounceMs,
    onLoadEarlierMessages: loadEarlierMessages,
  });
  const {
    expandedMessages,
    expandedToolCalls,
    expandedGroups,
    expandedToolApprovals,
    expandedDelegationConversationPreviews,
    expandedDelegationToolPreviews,
    setExpandedDelegationConversationPreviews,
    setExpandedDelegationToolPreviews,
    toolActivityGroups,
    toggleMessageExpansion,
    toggleToolCallExpansion,
    toggleGroupExpansion,
    toggleToolApprovalArguments,
    resetThreadExpansionState,
  } = useChatMessageRuntimeThreadExpansionState({
    messages,
    isResponding: responding,
  });
  const { voiceEvents, voiceLog, clearVoiceDebug } = useChatComposerRuntimeVoiceDebugState(handsFreeDebugEnabled);
  useChatComposerRuntimeVoiceDebugResetState({
    isVoiceDebugEnabled: handsFreeDebugEnabled,
    clearVoiceDebug,
  });
  const {
    showHandsFreeTranscriptAddedDebug,
    showHandsFreeRecognizerErrorDebug,
    showHandsFreePermissionDeniedDebug,
  } = useChatComposerRuntimeHandsFreeDebugActionsState({
    setDebugInfo,
  });
  const { clearRouteInitialMessage } = useChatMessageRuntimeRouteInitialMessageActionsState({
    navigation,
  });
  useChatMessageRuntimeInitialMessageState({
    routeInitialMessage: route?.params?.initialMessage,
    currentSessionId: sessionStore.currentSessionId,
    initialMessageRef,
    initialMessageSentRef,
    sendRef,
    clearRouteInitialMessage,
    voiceLog,
  });

  const handsFreeController = useChatComposerRuntimeHandsFreeControllerState({
    enabled: handsFree,
    runtimeActive: handsFreeRuntimeActive,
    wakePhrase: handsFreeWakePhrase,
    sleepPhrase: handsFreeSleepPhrase,
    log: voiceLog,
  });
  const {
    handleVoiceFinalized,
    handleRecognizerError,
    handlePermissionDenied,
  } = useChatComposerRuntimeSpeechRecognizerChromeActionsState({
    handsFreeRef,
    handsFreeController,
    mergeVoiceTextIntoComposer,
    showHandsFreeTranscriptAddedDebug,
    focusComposerInput,
    sendRef,
    showHandsFreeRecognizerErrorDebug,
    showHandsFreePermissionDeniedDebug,
  });
  const { toggleTextToSpeech: toggleTts } = useChatRuntimeTextToSpeechToggleChromeActionsState({
    ttsEnabled,
    config,
    setConfig,
    saveConfig,
    handsFreeController,
    handsFreeRef,
    handsFreePhaseRef,
    clearIntendedSpeakingMessage,
    clearQueuedResponseSpeech,
    clearSpeakingMessage,
    voiceLog,
  });

  const {
    listening,
    liveTranscript,
    sttPreview,
    micButtonRef,
    startRecording,
    stopRecognitionOnly,
    handlePushToTalkPressIn,
    handlePushToTalkPressOut,
  } = useChatComposerRuntimeSpeechRecognizerState({
    handsFree,
    handsFreeDebounceMs: handsFreeMessageDebounceMs,
    willCancel,
    audioInputDeviceId: config.audioInputDeviceId,
    onVoiceFinalized: handleVoiceFinalized,
    onRecognizerError: handleRecognizerError,
    onPermissionDenied: handlePermissionDenied,
    log: voiceLog,
  });

  useChatComposerRuntimeHandsFreeRecognizerLifecycleState({
    handsFree,
    handsFreeRuntimeActive,
    listening,
    handsFreeController,
    startRecording,
    stopRecognitionOnly,
    setHandsFreePhaseRefValue,
  });

  const { toggleHandsFree } = useChatRuntimeHandsFreeToggleChromeActionsState({
    config,
    setConfig,
    saveConfig,
    handsFreeController,
    handsFreeRef,
    setHandsFreeRefValue,
    stopRecognitionOnly,
    setDebugInfo,
  });

  const { handleBackToSessions } = useChatRuntimeBackToSessionsActionsState({
    navigation,
  });

  useChatRuntimeNavigationHeaderChromeOptions({
    navigation,
    ...chatRuntimeChrome.header,
    agentName: currentAgentName,
    isPinned: isCurrentSessionPinned,
    handsFree,
    conversationState,
    isResponding: responding,
    turnDurationMs: turnDurations.totalMs,
    turnDurationIsLive: turnDurations.hasLive,
    onAgentSelectorPress: openAgentSelector,
    onBackButtonPress: handleBackToSessions,
    onPinButtonPress: handleToggleCurrentSessionPinned,
    onKillSwitchButtonPress: handleKillSwitch,
    onHandsFreeButtonPress: toggleHandsFree,
  });

  const { speakAssistantResponse } = useChatMessageRuntimeAssistantSpeechChromeActionsState({
    ttsEnabledRef,
    recentAutoSpeechByTextRef,
    config,
    effectiveTtsProvider,
    effectiveRemoteTtsVoice,
    effectiveRemoteTtsModel,
    effectiveRemoteTtsRate,
    handsFree,
    handsFreeController,
    voiceLog,
  });

  const { enqueueResponseEventsForSpeech } = useChatMessageRuntimeResponseSpeechQueueActionsState({
    isTextToSpeechEnabled: config.ttsEnabled !== false,
    ttsEnabledRef,
    playedResponseEventIdsRef,
    queuedResponseEventsRef,
    activeAutoSpeechEventIdRef,
    speakAssistantResponse,
  });

  const { speakMessage } = useChatMessageRuntimeSpeechChromeActionsState({
    speakingMessageIndex,
    config,
    effectiveTtsProvider,
    effectiveRemoteTtsVoice,
    effectiveRemoteTtsModel,
    effectiveRemoteTtsRate,
    handsFree,
    handsFreeController,
    intendedSpeakingIndexRef,
    setIntendedSpeakingMessage,
    startSpeakingMessage,
    clearSpeakingMessage,
    clearIntendedSpeakingMessage,
    voiceLog,
  });

  useChatMessageRuntimeSpeechChromeCleanupState();

  useChatConversationHomeQuickStartCatalogLoadState({
    quickStartClient: settingsClient,
    isFocused,
    catalog: quickStartCatalog,
    applyRemoteSpeechSettings,
  });

  const { handleSavePrompt } = useChatConversationHomePromptEditorSaveChromeActionsState<ExtendedSettingsApiClient>({
    promptClient: settingsClient,
    predefinedPrompts,
    editingPrompt,
    promptName: newPromptName,
    promptContent: newPromptContent,
    isSavingPrompt,
    setPredefinedPrompts,
    beginPromptEditorSave,
    clearPromptEditorSave,
    dismissPromptEditor,
  });

  const { handleDeletePrompt } = useChatConversationHomePromptEditorDeleteChromeActionsState<ExtendedSettingsApiClient>({
    promptClient: settingsClient,
    predefinedPrompts,
    setPredefinedPrompts,
    beginPromptEditorSave,
    clearPromptEditorSave,
    ...chatRuntimeChrome.environment,
  });

  useChatMessageRuntimeSessionLoadState<ChatMessage, ExtendedSettingsApiClient>({
    currentSessionId: sessionStore.currentSessionId,
    currentSessionIdRef,
    deletingSessionIdsSize: sessionStore.deletingSessionIds.size,
    hasServerAuth,
    settingsClient,
    createLazyLoadClient: createLazyLoadSettingsClient,
    getCurrentSession: sessionStore.getCurrentSession,
    createNewSession: sessionStore.createNewSession,
    loadSessionMessages: sessionStore.loadSessionMessages,
    setMessages,
    setLatestStepSummary,
    lastLoadedSessionIdRef,
    pendingLazyLoadSessionIdRef,
    skipNextPersistRef,
    resetThreadExpansionState,
    clearCopiedMessageFeedback,
    replaceResponseHistory,
    resetResponseSpeechPlaybackState,
  });

  useChatMessageRuntimeSessionPersistState<ChatMessage>({
    messages,
    currentSessionId: sessionStore.currentSessionId,
    deletingSessionIds: sessionStore.deletingSessionIds,
    prevSessionIdRef,
    prevMessagesLengthRef,
    skipNextPersistRef,
    persistMessages: sessionStore.setMessages,
  });

  const send = async (text: string, options?: { fromComposer?: boolean }) => {
    if (!text.trim()) return;

    // If message queue is enabled and we're already responding, queue the message
    if (messageQueueEnabled && responding) {
      console.log('[ChatScreen] Agent busy, queuing message:', createChatMessageRuntimeLogMeta(text));
      messageQueue.enqueue(currentConversationId, text, currentConversationId);
      clearComposerInput();
      if (options?.fromComposer) {
        clearPendingImages();
      }
      return;
    }

    console.log('[ChatScreen] Sending message:', createChatMessageRuntimeLogMeta(text));

    // Get client from connection manager (preserves connections across session switches)
    const client = getSessionClient();
    if (!client) {
      console.error('[ChatScreen] No client available for send');
      showNoSessionAvailableDebug();
      return;
    }

    showStartingRequestDebug(config.baseUrl);
    // Clear any previous failed message when starting a new send
    clearLastFailedMessage();

    // Use ref to avoid stale closures (notably auto-send after rapid-fire session switch).
    const pendingTurnState = createChatMessageRuntimePendingTurnState<ChatMessage>(
      messagesRef.current,
      text,
    );
    const {
      userMessage: userMsg,
      currentMessages,
      messageCountBeforeTurn,
    } = pendingTurnState;
    // Clear progress messages ref for this new request (#1083)
    progressMessagesRef.current = [];
    setMessages(pendingTurnState.updateMessages);
    applyChatMessageRuntimePendingTurnStatusState(pendingTurnState, {
      setLatestStepSummary,
      setResponding,
      setConversationState,
    });
	    if (handsFree) {
	      handsFreeController.onRequestStarted();
	    }

    // Generate a unique request ID for this request
    // This prevents cross-request race conditions on view-level state
    const thisRequestId = Date.now();
    // Note: We keep activeRequestIdRef for backward compatibility and view-level state,
    // but the primary "superseded" check now uses per-session tracking (PR review fix #13)
    activeRequestIdRef.current = thisRequestId;

    const currentSession = sessionStore.getCurrentSession();
    const startingServerConversationId = currentSession?.serverConversationId;

    console.log('[ChatScreen] Session info:', {
      sessionId: currentSession?.id,
      serverConversationId: startingServerConversationId || 'new',
      requestId: thisRequestId
    });

    clearComposerInput();
	    if (options?.fromComposer) {
	      clearPendingImages();
	    }

    // Capture the session ID at request start to guard against session changes
    const requestSessionId = sessionStore.currentSessionId;
    let resolvedConversationId: string | undefined;

    if (requestSessionId && !startingServerConversationId) {
      sessionStore.markPendingServerConversation(requestSessionId, true);
    }

    // Mark this request as the latest for this session in the connection manager
    // and increment active request count
    // This enables per-session request tracking to prevent cross-session superseding (PR review fix #13)
    if (requestSessionId) {
      connectionManager.setLatestRequestId(requestSessionId, thisRequestId);
      connectionManager.incrementActiveRequests(requestSessionId);
    }

    try {
      let streamingText = '';
      let latestConversationState: AgentConversationState = 'running';
      // Track userResponse from progress updates for TTS
      // This is set via the respond_to_user tool and takes priority over finalText
      let lastUserResponse: string | undefined;
	      let lastResponseEvents: AgentUserResponseEvent[] = [];
	      let midTurnLegacyResponseText: string | undefined;

      const serverConversationId = sessionStore.getServerConversationId();
	      console.log('[ChatScreen] Starting chat request with', currentMessages.length + 1, 'messages, conversationId:', serverConversationId || 'new');
      showRequestSentDebug();

      const onProgress = (update: AgentProgressUpdate) => {
        // Guard: skip update if session has changed since request started
        // Use currentSessionIdRef.current to avoid stale closure issue (useSessions returns new object each render)
        if (hasChatMessageRuntimeRequestSessionChanged({
          currentSessionId: currentSessionIdRef.current,
          requestSessionId,
        })) {
          console.log('[ChatScreen] Session changed, skipping onProgress update');
          return;
        }
        // Guard: skip update if this request is no longer the latest one for this session
        // Uses per-session tracking to prevent cross-session sends from incorrectly superseding (PR review fix #13)
        if (!isChatMessageRuntimeLatestSessionRequest({
          requestSessionId,
          requestId: thisRequestId,
          latestRequestId: requestSessionId ? connectionManager.getLatestRequestId(requestSessionId) : undefined,
        })) {
          console.log('[ChatScreen] Request superseded within same session, skipping onProgress update');
          return;
        }
        const progressTurnState = createChatMessageRuntimeProgressTurnState<ChatMessage>(update);
        latestConversationState = progressTurnState.conversationState;
        applyChatMessageRuntimeProgressTurnStatusState(progressTurnState, {
          setLatestStepSummary,
          setConversationState,
        });
        const responseState = createChatMessageRuntimeProgressResponseState({
          update,
          requestSessionId,
          lastUserResponse,
          createFallbackResponseEvent,
        });
        if (responseState.responseEvents.length) {
          lastResponseEvents = responseState.responseEvents;
          mergeResponseEvents(responseState.responseEvents);
        }
        if (responseState.speechQueueEvents.length) {
          enqueueResponseEventsForSpeech(responseState.speechQueueEvents);
        }
        if (responseState.hasResponseUpdate) {
          lastUserResponse = responseState.lastUserResponse;
        }
        if (
          responseState.legacyResponseText &&
          responseState.legacyResponseText !== midTurnLegacyResponseText &&
          ttsEnabledRef.current
        ) {
          midTurnLegacyResponseText = responseState.legacyResponseText;
          speakAssistantResponse(responseState.legacyResponseText, 'mid-turn progress');
        }
        const { progressMessages } = progressTurnState;
        if (progressMessages.length > 0) {
          // Store progress messages so we can merge with final history (#1083)
          progressMessagesRef.current = progressMessages;
          setMessages((m) => progressTurnState.updateMessages(
            m,
            messageCountBeforeTurn,
          ));
        }
      };

      const onToken = (tok: string) => {
        // Guard: skip update if session has changed since request started
        // Use currentSessionIdRef.current to avoid stale closure issue (useSessions returns new object each render)
        if (hasChatMessageRuntimeRequestSessionChanged({
          currentSessionId: currentSessionIdRef.current,
          requestSessionId,
        })) {
          console.log('[ChatScreen] Session changed, skipping onToken update');
          return;
        }
        // Guard: skip update if this request is no longer the latest one for this session
        // Uses per-session tracking to prevent cross-session sends from incorrectly superseding (PR review fix #13)
        if (!isChatMessageRuntimeLatestSessionRequest({
          requestSessionId,
          requestId: thisRequestId,
          latestRequestId: requestSessionId ? connectionManager.getLatestRequestId(requestSessionId) : undefined,
        })) {
          console.log('[ChatScreen] Request superseded within same session, skipping onToken update');
          return;
        }
        const streamingTurnState = createChatMessageRuntimeStreamingTurnState<ChatMessage>(streamingText, tok);
        streamingText = streamingTurnState.streamingText;

        setMessages(streamingTurnState.updateMessages);
      };

      const modelMessages = createChatMessageRuntimeModelMessages([...currentMessages, userMsg]);
	      const response = await client.chat(modelMessages, onToken, onProgress, serverConversationId);
		      const finalResponseEvent = lastResponseEvents[lastResponseEvents.length - 1];
      const {
        finalText,
        finalDisplayText,
        ttsText,
        userResponseText,
        alreadySpokenMidTurn,
        completedConversationState,
      } = createChatMessageRuntimeFinalResponseTextState({
        responseContent: response.content,
        streamingText,
        conversationState: latestConversationState,
        finalResponseEvent,
        lastUserResponse,
        midTurnLegacyResponseText,
        playedResponseEventIds: playedResponseEventIdsRef.current,
      });
      console.log('[ChatScreen] Chat completed, conversationId:', response.conversationId);

      // Guard: skip UI updates if session has changed, BUT still persist to the original session
      // Use currentSessionIdRef.current to avoid stale closure issue (useSessions returns new object each render)
      const sessionChanged = hasChatMessageRuntimeRequestSessionChanged({
        currentSessionId: currentSessionIdRef.current,
        requestSessionId,
      });
      if (!sessionChanged) {
        applyChatMessageRuntimeCompletedTurnStatusState(completedConversationState, {
          setConversationState,
        });
      }
      if (sessionChanged) {
        console.log('[ChatScreen] Session changed during request, persisting to original session without UI update');
      } else {
        showCompletedDebug();
      }

      // Guard: skip final updates if this request is no longer the latest one for this session
      // This prevents older, superseded requests from clobbering messages when multiple sends occur within the same session
      // Uses per-session tracking to prevent cross-session sends from incorrectly superseding (PR review fix #13)
      // Note: This guard only applies when session hasn't changed - if session changed, we still want to persist
      const isLatestForSession = isChatMessageRuntimeLatestSessionRequest({
        requestSessionId,
        requestId: thisRequestId,
        latestRequestId: requestSessionId ? connectionManager.getLatestRequestId(requestSessionId) : undefined,
      });
      if (!sessionChanged && !isLatestForSession) {
        console.log('[ChatScreen] Request superseded within same session, skipping final message updates', {
          thisRequestId,
          latestRequestId: requestSessionId ? connectionManager.getLatestRequestId(requestSessionId) : 'no-session'
        });
        return;
      }

      // Save conversation ID to the appropriate session
      if (response.conversationId) {
        if (sessionChanged && requestSessionId) {
          await sessionStore.setServerConversationIdForSession(requestSessionId, response.conversationId);
        } else {
          await sessionStore.setServerConversationId(response.conversationId);
        }
        resolvedConversationId = response.conversationId;
      }

      const finalConversationHistory = response.conversationHistory ?? [];
      const finalTurnState = createChatMessageRuntimeFinalResponseTurnState<ChatMessage>({
        conversationHistory: finalConversationHistory,
        finalDisplayText,
        userResponseText,
      });
      if (finalTurnState.kind === 'history') {
        console.log('[ChatScreen] Processing final conversationHistory:', finalConversationHistory.length, 'messages');
        console.log('[ChatScreen] ConversationHistory roles:', finalConversationHistory.map(m => m.role).join(', '));

        const { finalTurnMessages } = finalTurnState;
        console.log('[ChatScreen] finalTurnMessages count:', finalTurnMessages.length);
        console.log('[ChatScreen] finalTurnMessages roles:', finalTurnMessages.map(m => `${m.role}(toolCalls:${m.toolCalls?.length || 0},toolResults:${m.toolResults?.length || 0})`).join(', '));
        console.log('[ChatScreen] messageCountBeforeTurn:', messageCountBeforeTurn);

        if (sessionChanged && requestSessionId) {
          // Only persist to background session if this is still the latest request for that session
          // This prevents an older request from overwriting newer history (PR review fix #14)
          if (isLatestForSession) {
            console.log('[ChatScreen] Persisting completed response to background session:', requestSessionId);
            // Build the final messages array: messages before this turn + user message + new assistant messages
            const finalMessages = finalTurnState.createCompletedMessages(
              currentMessages,
              messageCountBeforeTurn,
              userMsg,
            );
            await sessionStore.setMessagesForSession(requestSessionId, finalMessages);
          } else {
            console.log('[ChatScreen] Skipping background persistence - request superseded within session:', {
              thisRequestId,
              latestRequestId: connectionManager.getLatestRequestId(requestSessionId)
            });
          }
        } else {
          // Normal case: update UI state (persistence happens via useEffect)
          // Merge progress messages with final history to prevent intermediate messages
          // from disappearing when the server's history has fewer messages (#1083)
          const progressMsgs = progressMessagesRef.current;
          setMessages((m) => {
            console.log('[ChatScreen] Current messages before update:', m.length);
            const result = finalTurnState.updateMessages(
              m,
              messageCountBeforeTurn,
              progressMsgs,
            );
            console.log('[ChatScreen] Final messages count:', result.length);
            return result;
          });
        }
      } else if (finalTurnState.kind === 'text') {
        console.log('[ChatScreen] FALLBACK: No conversationHistory, using finalText only. response.conversationHistory:', response.conversationHistory);
        if (sessionChanged && requestSessionId) {
          // Only persist to background session if this is still the latest request for that session
          // This prevents an older request from overwriting newer history (PR review fix #14)
          if (isLatestForSession) {
            console.log('[ChatScreen] Persisting fallback response to background session:', requestSessionId);
            const finalMessages = finalTurnState.createCompletedMessages(
              currentMessages,
              messageCountBeforeTurn,
              userMsg,
            );
            await sessionStore.setMessagesForSession(requestSessionId, finalMessages);
          } else {
            console.log('[ChatScreen] Skipping fallback background persistence - request superseded within session:', {
              thisRequestId,
              latestRequestId: connectionManager.getLatestRequestId(requestSessionId)
            });
          }
        } else {
          // Normal case: update UI state
          setMessages(finalTurnState.updateMessages);
        }
      } else {
        console.log('[ChatScreen] WARNING: No conversationHistory and no finalText!');
      }

      // Note: Removed duplicate setServerConversationId call that was after the message handling
      // The conversation ID is now saved once at the beginning of this block

      // TTS: prefer userResponse (from respond_to_user tool) over finalText
      // userResponse is explicitly set by the agent for user communication
      // Skip TTS if we already played the same text mid-turn
	      if (!alreadySpokenMidTurn && !sessionChanged && ttsText && ttsEnabledRef.current) {
	        if (handsFree) {
	          handsFreeController.onRequestCompleted();
	        }
	        speakAssistantResponse(ttsText, 'final response');
	      } else if (handsFree) {
	        handsFreeController.onRequestCompleted();
      }
    } catch (error: unknown) {
      const errorDetails = createChatRuntimeErrorLogDetailsState(error);
      console.error('[ChatScreen] Chat error:', error);
      console.error('[ChatScreen] Error details:', errorDetails);

      // Guard: skip error message if session has changed since request started
      // Use currentSessionIdRef.current to avoid stale closure issue (useSessions returns new object each render)
      if (hasChatMessageRuntimeRequestSessionChanged({
        currentSessionId: currentSessionIdRef.current,
        requestSessionId,
      })) {
        console.log('[ChatScreen] Session changed during request, skipping error message');
        return;
      }

      // Guard: skip error handling if this request is no longer the active one
      // This prevents a superseded request from surfacing a retry banner for an older send
      if (!isChatMessageRuntimeActiveRequest({
        requestId: thisRequestId,
        activeRequestId: activeRequestIdRef.current,
      })) {
        console.log('[ChatScreen] Request superseded, skipping error handling', {
          thisRequestId,
          activeRequestId: activeRequestIdRef.current
        });
        return;
      }
      applyChatMessageRuntimeBlockedTurnStatusState({
        setConversationState,
      });

      // Save the failed message for retry
      setLastFailedMessage(text);

      // Check if there's partial content we can show
      const partialContent = client.getPartialContent();

      const errorTurnState = createChatMessageRuntimeConnectionErrorTurnState<ChatMessage>({
        message: errorDetails.message,
        recoveryState: connectionState,
        partialContent,
      });
      setDebugInfo(errorTurnState.debugInfo);
      // Update the in-flight assistant message instead of appending a new one
      // This avoids duplicating the assistant loading placeholder and ensures
      // the retry pop logic removes the correct items
      setMessages(errorTurnState.updateMessages);
	      if (handsFree) {
	        handsFreeController.onRequestCompleted();
	      }
    } finally {
      if (requestSessionId && !startingServerConversationId && !resolvedConversationId) {
        sessionStore.markPendingServerConversation(requestSessionId, false);
      }

      console.log('[ChatScreen] Chat request finished, requestId:', thisRequestId);

      // Decrement active request count in the connection manager
      if (requestSessionId) {
        connectionManager.decrementActiveRequests(requestSessionId);
      }

      // Only reset UI states if:
      // 1. This request is still the latest one for its session (per-session tracking, PR review fix #13)
      // 2. We're still on the same session (prevents background completions from affecting other sessions)
      // This addresses PR review comments #10 and #13
      const isLatestForThisSession = isChatMessageRuntimeLatestSessionRequest({
        requestSessionId,
        requestId: thisRequestId,
        latestRequestId: requestSessionId ? connectionManager.getLatestRequestId(requestSessionId) : undefined,
      });
      const isCurrentSession = !hasChatMessageRuntimeRequestSessionChanged({
        currentSessionId: currentSessionIdRef.current,
        requestSessionId,
      });

      if (isLatestForThisSession && isCurrentSession) {
        applyChatMessageRuntimeSettledTurnStatusState({
          setResponding,
          setConnectionState,
        });
        // Guard the setTimeout callback: only clear debugInfo if this request
        // is still the latest one when the timeout fires. This prevents an
        // old request's delayed clear from wiping debug info for a newer request.
        const capturedRequestId = thisRequestId;
        const capturedSessionId = requestSessionId;
        setTimeout(() => {
          const stillLatest = isChatMessageRuntimeLatestSessionRequest({
            requestSessionId: capturedSessionId,
            requestId: capturedRequestId,
            latestRequestId: capturedSessionId ? connectionManager.getLatestRequestId(capturedSessionId) : undefined,
          });
          if (stillLatest && !hasChatMessageRuntimeRequestSessionChanged({
            currentSessionId: currentSessionIdRef.current,
            requestSessionId: capturedSessionId,
          })) {
            clearDebugInfo();
          }
        }, 5000);

        scheduleChatMessageRuntimeNextQueuedMessage({
          currentConversationId,
          queue: messageQueue,
          canProcessQueue: messageQueueEnabled,
          handsFree,
          handsFreeRef,
          handsFreePhaseRef,
          processQueuedMessage,
          logMessage: '[ChatScreen] Processing next queued message:',
        });
      } else {
        console.log('[ChatScreen] Skipping finally state resets:', {
          thisRequestId,
          latestRequestId: requestSessionId ? connectionManager.getLatestRequestId(requestSessionId) : 'no-session',
          requestSessionId,
          currentSessionId: currentSessionIdRef.current,
          reason: !isLatestForThisSession ? 'newer request is active for this session' : 'session changed'
        });
      }
    }
  };

  // Process a queued message (similar to send but handles queue state)
  const processQueuedMessage = async (queuedMsg: { id: string; text: string }) => {
    if (messageQueue.isQueuePaused(currentConversationId)) {
      console.log('[ChatScreen] Queue is paused, skipping queued message processing:', queuedMsg.id);
      return;
    }

    const text = queuedMsg.text;
    if (!text.trim()) {
      messageQueue.markProcessed(currentConversationId, queuedMsg.id);
      return;
    }

    console.log('[ChatScreen] Processing queued message:', queuedMsg.id, createChatMessageRuntimeLogMeta(text));

    // Get client from connection manager (preserves connections across session switches)
    const client = getSessionClient();
    if (!client) {
      console.error('[ChatScreen] No client available for processing queued message');
      const noSessionState = showNoSessionAvailableDebug();
      messageQueue.markFailed(
        currentConversationId,
        queuedMsg.id,
        noSessionState.message,
      );
      return;
    }

    showProcessingQueuedMessageDebug();

    // Use ref to get latest messages to avoid stale closure when called via setTimeout (PR review fix)
    const pendingTurnState = createChatMessageRuntimePendingTurnState<ChatMessage>(
      messagesRef.current,
      text,
    );
    const {
      userMessage: userMsg,
      currentMessages,
      messageCountBeforeTurn,
    } = pendingTurnState;
    setMessages(pendingTurnState.updateMessages);
    applyChatMessageRuntimePendingTurnStatusState(pendingTurnState, {
      setLatestStepSummary,
      setResponding,
      setConversationState,
    });
	    if (handsFree) {
	      handsFreeController.onRequestStarted();
	    }

    const thisRequestId = Date.now();
    activeRequestIdRef.current = thisRequestId;

    const currentSession = sessionStore.getCurrentSession();
    const startingServerConversationId = currentSession?.serverConversationId;

    const requestSessionId = sessionStore.currentSessionId;
    let resolvedConversationId: string | undefined;

    if (requestSessionId && !startingServerConversationId) {
      sessionStore.markPendingServerConversation(requestSessionId, true);
    }

    try {
      let streamingText = '';
      let latestConversationState: AgentConversationState = 'running';
      // Track userResponse from progress updates for TTS
      let lastUserResponse: string | undefined;
	      let lastResponseEvents: AgentUserResponseEvent[] = [];
      let midTurnLegacyResponseText: string | undefined;

      const onProgress = (update: AgentProgressUpdate) => {
        if (hasChatMessageRuntimeRequestSessionChanged({
          currentSessionId: sessionStore.currentSessionId,
          requestSessionId,
        })) return;
        if (!isChatMessageRuntimeActiveRequest({
          requestId: thisRequestId,
          activeRequestId: activeRequestIdRef.current,
        })) return;
        const progressTurnState = createChatMessageRuntimeProgressTurnState<ChatMessage>(update);
        latestConversationState = progressTurnState.conversationState;
        applyChatMessageRuntimeProgressTurnStatusState(progressTurnState, {
          setLatestStepSummary,
          setConversationState,
        });
        const responseState = createChatMessageRuntimeProgressResponseState({
          update,
          requestSessionId,
          lastUserResponse,
          createFallbackResponseEvent,
        });
        if (responseState.responseEvents.length) {
          lastResponseEvents = responseState.responseEvents;
          mergeResponseEvents(responseState.responseEvents);
        }
        if (responseState.speechQueueEvents.length) {
          enqueueResponseEventsForSpeech(responseState.speechQueueEvents);
        }
        if (responseState.hasResponseUpdate) {
          lastUserResponse = responseState.lastUserResponse;
        }
        if (
          responseState.legacyResponseText &&
          responseState.legacyResponseText !== midTurnLegacyResponseText &&
          ttsEnabledRef.current
        ) {
          midTurnLegacyResponseText = responseState.legacyResponseText;
          speakAssistantResponse(responseState.legacyResponseText, 'queued mid-turn progress');
        }
        const { progressMessages } = progressTurnState;
        if (progressMessages.length > 0) {
          setMessages((m) => progressTurnState.updateMessages(
            m,
            messageCountBeforeTurn,
          ));
        }
      };

      const onToken = (tok: string) => {
        if (hasChatMessageRuntimeRequestSessionChanged({
          currentSessionId: sessionStore.currentSessionId,
          requestSessionId,
        })) return;
        if (!isChatMessageRuntimeActiveRequest({
          requestId: thisRequestId,
          activeRequestId: activeRequestIdRef.current,
        })) return;
        const streamingTurnState = createChatMessageRuntimeStreamingTurnState<ChatMessage>(streamingText, tok);
        streamingText = streamingTurnState.streamingText;
        setMessages(streamingTurnState.updateMessages);
      };

      const modelMessages = createChatMessageRuntimeModelMessages([...currentMessages, userMsg]);
      const response = await client.chat(modelMessages, onToken, onProgress, startingServerConversationId);
	      const finalResponseEvent = lastResponseEvents[lastResponseEvents.length - 1];
      const {
        finalText,
        finalDisplayText,
        ttsText,
        userResponseText,
        alreadySpokenMidTurn,
        completedConversationState,
      } = createChatMessageRuntimeFinalResponseTextState({
        responseContent: response.content,
        streamingText,
        conversationState: latestConversationState,
        finalResponseEvent,
        lastUserResponse,
        midTurnLegacyResponseText,
        playedResponseEventIds: playedResponseEventIdsRef.current,
      });

      // Early exit guards - finalize queue status before returning to prevent stuck 'processing' items
      if (hasChatMessageRuntimeRequestSessionChanged({
        currentSessionId: sessionStore.currentSessionId,
        requestSessionId,
      })) {
        // Session changed - mark as failed so user can retry in correct session
        const sessionChangedQueueFailureState = createChatRuntimeSessionChangedDuringProcessingQueueFailureState();
        messageQueue.markFailed(
          currentConversationId,
          queuedMsg.id,
          sessionChangedQueueFailureState.message,
        );
        return;
      }
      if (!isChatMessageRuntimeActiveRequest({
        requestId: thisRequestId,
        activeRequestId: activeRequestIdRef.current,
      })) {
        // Request superseded - mark as failed so user can retry
        const requestSupersededQueueFailureState = createChatRuntimeRequestSupersededQueueFailureState();
        messageQueue.markFailed(
          currentConversationId,
          queuedMsg.id,
          requestSupersededQueueFailureState.message,
        );
        return;
      }
      applyChatMessageRuntimeCompletedTurnStatusState(completedConversationState, {
        setConversationState,
      });

      if (response.conversationId) {
        await sessionStore.setServerConversationId(response.conversationId);
        resolvedConversationId = response.conversationId;
      }

      const finalTurnState = createChatMessageRuntimeFinalResponseTurnState<ChatMessage>({
        conversationHistory: response.conversationHistory,
        finalDisplayText,
        historyOptions: {
          mergeToolResults: false,
        },
        userResponseText,
      });
      if (finalTurnState.kind === 'history') {
        setMessages((m) => finalTurnState.updateMessages(
          m,
          messageCountBeforeTurn,
        ));
      } else if (finalTurnState.kind === 'text') {
        setMessages(finalTurnState.updateMessages);
      }

      // TTS: prefer userResponse (from respond_to_user tool) over finalText
      // Skip TTS if we already played the same text mid-turn
      if (!alreadySpokenMidTurn && ttsText && ttsEnabledRef.current) {
	        if (handsFree) {
	          handsFreeController.onRequestCompleted();
	        }
	        speakAssistantResponse(ttsText, 'queued final response');
	      } else if (handsFree) {
	        handsFreeController.onRequestCompleted();
      }

      // Mark as processed on success
      messageQueue.markProcessed(currentConversationId, queuedMsg.id);
    } catch (error: unknown) {
      console.error('[ChatScreen] Queued message error:', error);
      const queuedErrorState = createChatMessageRuntimeQueuedErrorState<ChatMessage>(error);
      messageQueue.markFailed(currentConversationId, queuedMsg.id, queuedErrorState.message);
      applyChatMessageRuntimeBlockedTurnStatusState({
        setConversationState,
      });
      setMessages(queuedErrorState.turnState.updateMessages);
	      if (handsFree) {
	        handsFreeController.onRequestCompleted();
	      }
    } finally {
      if (requestSessionId && !startingServerConversationId && !resolvedConversationId) {
        sessionStore.markPendingServerConversation(requestSessionId, false);
      }

      if (isChatMessageRuntimeActiveRequest({
        requestId: thisRequestId,
        activeRequestId: activeRequestIdRef.current,
      })) {
        applyChatMessageRuntimeSettledTurnStatusState({
          setResponding,
          setConnectionState,
        });
        setTimeout(() => {
          if (isChatMessageRuntimeActiveRequest({
            requestId: thisRequestId,
            activeRequestId: activeRequestIdRef.current,
          })) {
            clearDebugInfo();
          }
        }, 5000);

        scheduleChatMessageRuntimeNextQueuedMessage({
          currentConversationId,
          queue: messageQueue,
          handsFree,
          handsFreeRef,
          handsFreePhaseRef,
          processQueuedMessage,
          logMessage: '[ChatScreen] Processing next queued message:',
        });
      }
    }
  };

  const {
    queuedMessages,
    isMessageQueuePaused,
    nextQueuedMessage,
    handleProcessNextQueuedMessage,
    handlePauseMessageQueue,
    handleResumeMessageQueue,
    handleRemoveQueuedMessage,
    handleUpdateQueuedMessage,
    handleRetryQueuedMessage,
    handleClearQueuedMessages,
  } = useChatMessageRuntimeQueuePanelState({
    currentConversationId,
    queue: messageQueue,
    responding,
    handsFree,
    handsFreePhase: handsFreeController.state.phase,
    handsFreeRef,
    handsFreePhaseRef,
    processQueuedMessage,
  });

  // Keep sendRef in sync with the latest send() implementation for speech callbacks.
  // IMPORTANT: This must live outside send() so voice callbacks can send even before any manual send() occurs.
  // We intentionally assign during render (not useEffect) so it is available immediately.
  syncSendRef(send);

  const {
    composerHasContent,
    sendComposerInput,
    queueComposerInput,
    textEntrySubmissionState: composerTextEntrySubmissionState,
  } = useChatComposerRuntimeSubmissionChromeState({
    input,
    pendingImages,
    currentConversationId,
    queue: messageQueue,
    send,
    clearComposerDraft,
    setDebugInfo,
    ...chatRuntimeChrome.environment,
    onTextEntryChangeText: setInput,
  });

  const {
    wakeHandsFreeByUser,
    sleepHandsFreeByUser,
    resumeHandsFreeByUser,
    pauseHandsFreeByUser,
    handleHandsFreePrimaryControl,
  } = useChatComposerRuntimeHandsFreeControlChromeActionsState({
    handsFreeController,
    listening,
    wakePhrase: handsFreeWakePhrase,
    startRecording,
    stopRecognitionOnly,
    setDebugInfo,
  });

  const { handleRetryLastFailedMessagePress } = useChatRuntimeConnectionRetryActionState<ChatMessage>({
    lastFailedMessage,
    clearLastFailedMessage,
    getSessionClient,
    sessionStore,
    setMessages,
    send,
  });

  const chatMessageRuntimeComposer = useChatMessageRuntimeComposerInputState<
    PredefinedPromptSummary,
    Loop
  >({
    speechPreviewText: sttPreview,
    pendingImages,
    onRemovePendingImage: removePendingImage,
    handsFreeStatusPhase: handsFreeController.state.phase,
    handsFreeStatusLabel: handsFreeController.statusLabel,
    handsFreeStatusEnabled: handsFree,
    handsFreeStatusWakePhrase: handsFreeWakePhrase,
    handsFreeStatusSleepPhrase: handsFreeSleepPhrase,
    handsFreeStatusLastError: handsFreeController.state.lastError,
    handsFreeStatusForegroundOnly: handsFreeForegroundOnly,
    onWakeHandsFree: wakeHandsFreeByUser,
    onSleepHandsFree: sleepHandsFreeByUser,
    onResumeHandsFree: resumeHandsFreeByUser,
    onPauseHandsFree: pauseHandsFreeByUser,
    composerControlHasContent: composerHasContent,
    composerControlConversationState: conversationState,
    composerControlIsResponding: responding,
    composerControlPendingImageCount: pendingImages.length,
    composerControlTtsEnabled: ttsEnabled,
    composerControlEditBeforeSendEnabled: willCancel,
    composerControlMicPhase: handsFreeController.state.phase,
    composerControlListening: listening,
    composerControlMessageQueueEnabled: messageQueueEnabled,
    onImageAttachmentPress: handlePickImages,
    onTextToSpeechPress: toggleTts,
    onEditBeforeSendPress: toggleEditBeforeSend,
    textEntryInputRef: inputRef,
    textEntryValue: input,
    onTextEntryChangeText: composerTextEntrySubmissionState.onChangeText,
    onTextEntryKeyPress: composerTextEntrySubmissionState.onKeyPress,
    textEntryHandsFree: handsFree,
    textEntryListening: listening,
    textEntryWillCancel: willCancel,
    textEntryLiveTranscript: liveTranscript,
    textEntryWakePhrase: handsFreeWakePhrase,
    onQueueActionPress: queueComposerInput,
    onSubmitActionPress: sendComposerInput,
    onMicPressIn: handlePushToTalkPressIn,
    onMicPressOut: handlePushToTalkPressOut,
    onMicPress: handleHandsFreePrimaryControl,
    micWrapperRef: micButtonRef,
  });

  const chatMessageRuntimeDock = useChatMessageRuntimeDockInputState<
    PredefinedPromptSummary,
    Loop
  >({
    responseHistoryResponses: respondToUserHistory,
    responseHistoryTtsProvider: effectiveTtsProvider,
    responseHistoryRemoteTtsVoice: effectiveRemoteTtsVoice,
    responseHistoryRemoteTtsModel: effectiveRemoteTtsModel,
    responseHistoryTtsRate: effectiveRemoteTtsRate,
    responseHistoryTtsPitch: config.ttsPitch ?? 1.0,
    responseHistoryTtsVoiceId: config.ttsVoiceId,
    responseHistoryRemoteBaseUrl: config.baseUrl,
    responseHistoryRemoteApiKey: config.apiKey,
    scrollToBottomVisible: !shouldAutoScroll,
    onScrollToBottom: handleScrollToBottomPress,
    voiceOverlayListening: listening,
    voiceOverlayHandsFree: handsFree,
    voiceOverlayWillCancel: willCancel,
    voiceOverlayTranscript: liveTranscript,
    queuePanelEnabled: messageQueueEnabled,
    queuePanelConversationId: currentConversationId,
    queuedMessages,
    onRemoveQueuedMessage: handleRemoveQueuedMessage,
    onUpdateQueuedMessage: handleUpdateQueuedMessage,
    onRetryQueuedMessage: handleRetryQueuedMessage,
    onProcessNextQueuedMessage: handleProcessNextQueuedMessage,
    canProcessNextQueuedMessage: !!nextQueuedMessage,
    onClearQueuedMessages: handleClearQueuedMessages,
    isMessageQueuePaused,
    onPauseMessageQueue: handlePauseMessageQueue,
    onResumeMessageQueue: handleResumeMessageQueue,
    connectionState,
    lastFailedMessage,
    isResponding: responding,
    onConnectionBannerRetry: handleRetryLastFailedMessagePress,
  });

  const chatMessageRuntimeThreadList = useChatMessageRuntimeThreadListInputState<
    PredefinedPromptSummary,
    Loop
  >({
    messages,
    visibleMessageCount,
    groupByIndex: toolActivityGroups.groupByIndex,
    groupState: expandedGroups,
    inheritedState: expandedMessages,
    onToggleGroup: toggleGroupExpansion,
    expandedMessages,
    turnDurationsByUserTimestamp: turnDurations.byUserTimestamp,
    conversationId: currentSession?.serverConversationId,
    pendingBranchMessageIndex,
    isResponding: responding,
    speakingMessageIndex,
    copiedMessageIndex,
    ttsEnabled,
    assetBaseUrl: config.baseUrl,
    assetAuthToken: config.apiKey,
    expandedDelegationConversationPreviews,
    expandedDelegationToolPreviews,
    setExpandedDelegationConversationPreviews,
    setExpandedDelegationToolPreviews,
    expandedToolApprovals,
    pendingApprovalResponseId: pendingToolApprovalResponseId,
    onToggleToolApprovalArguments: toggleToolApprovalArguments,
    onRespondToToolApproval: respondToToolApproval,
    expandedToolCalls,
    onToggleToolCall: toggleToolCallExpansion,
    onCopyToolPayload: handleCopyToolPayload,
    onSpeakMessage: speakMessage,
    onBranchMessage: handleBranchFromMessagePress,
    onCopyMessage: handleCopyMessage,
    onToggleMessageExpansion: toggleMessageExpansion,
  });

  const chatMessageRuntimeViewport = useChatMessageRuntimeViewportInputState<
    PredefinedPromptSummary,
    Loop
  >({
    scrollRef: scrollViewRef,
    onScroll: handleScroll,
    onScrollBeginDrag: handleScrollBeginDrag,
    onScrollEndDrag: handleScrollEndDrag,
    scrollEventThrottle: scrollEventThrottleMs,
    viewportContentIsLoadingMessages: sessionStore.isLoadingMessages,
    viewportContentMessageCount: messages.length,
    quickStartPrompts: predefinedPrompts,
    quickStartSkills: availableSkills,
    quickStartTasks: availableTasks,
    quickStartCanAddPrompt: Boolean(settingsClient),
    isLoadingQuickStartPrompts,
    runningPromptTaskId,
    onQuickStartPress: handleQuickStartPress,
    onEditPrompt: openEditPromptModal,
    onDeletePrompt: handleDeletePrompt,
    messageHistoryLoadIncrement,
    latestStepSummary,
    onLoadEarlierMessages: loadEarlierMessages,
    requestDebugText: debugInfo,
    voiceDebugEnabled: handsFreeDebugEnabled,
    voiceEvents,
  });

  const chatMessageRuntimeSurfaceInput = useChatMessageRuntimeSurfaceInputState<
    PredefinedPromptSummary,
    Loop
  >({
    keyboardVerticalOffset,
    agentSelectorVisible,
    onAgentSelectorClose: closeAgentSelector,
    promptEditorVisible: addPromptModalVisible,
    promptEditorIsEditing,
    promptEditorNameValue: newPromptName,
    onPromptEditorNameChange: setNewPromptName,
    promptEditorContentValue: newPromptContent,
    onPromptEditorContentChange: setNewPromptContent,
    promptEditorIsSaving: isSavingPrompt,
    onPromptEditorClose: closePromptModal,
    onPromptEditorSave: handleSavePrompt,
  });

  const chatMessageRuntimeSurface = useChatMessageRuntimeChromeInputState<
    PredefinedPromptSummary,
    Loop
  >({
    messageRuntime: chatRuntimeChrome.messageRuntime,
    composer: chatMessageRuntimeComposer,
    dock: chatMessageRuntimeDock,
    threadList: chatMessageRuntimeThreadList,
    viewport: chatMessageRuntimeViewport,
    surface: chatMessageRuntimeSurfaceInput,
  });

  return (
    <ChatMessageRuntimeChromeSurface<PredefinedPromptSummary, Loop>
      {...chatMessageRuntimeSurface}
      {...chatRuntimeChrome.surface}
    />
  );
}
