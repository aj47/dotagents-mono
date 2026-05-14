const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);
const chatRuntimeMobileStylesSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ChatRuntimeMobileStyles.ts'),
  'utf8'
);
const screenSource = `${chatScreenSource}\n${chatRuntimeMobileStylesSource}`;
const chatMessageChromeSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ChatMessageChrome.tsx'),
  'utf8'
);

test('renders the extracted handsfree status chip in the mobile chat composer', () => {
  assert.doesNotMatch(screenSource, /HandsFreeStatusChip/);
  assert.doesNotMatch(screenSource, /handsFreeControlsVisible:/);
  assert.match(screenSource, /handsFreeStatusPhase: handsFreeController\.state\.phase,\s+handsFreeStatusLabel: handsFreeController\.statusLabel,\s+handsFreeStatusEnabled: handsFree,\s+handsFreeStatusWakePhrase: handsFreeWakePhrase,\s+handsFreeStatusSleepPhrase: handsFreeSleepPhrase,\s+handsFreeStatusLastError: handsFreeController\.state\.lastError,\s+handsFreeStatusForegroundOnly: handsFreeForegroundOnly,/);
  assert.match(chatMessageChromeSource, /isVisible: controlRenderState\.visibility\.handsFreeControls\.isVisible,/);
  assert.match(chatMessageChromeSource, /import \{ HandsFreeStatusChip \} from '\.\/HandsFreeStatusChip';/);
  assert.match(chatMessageChromeSource, /const handsFreeStatusSubtitle = handsFreeStatusEnabled\s+\? getHandsFreeStatusSubtitle\(\{[\s\S]*?phase: handsFreeStatusPhase,[\s\S]*?wakePhrase: handsFreeStatusWakePhrase,[\s\S]*?sleepPhrase: handsFreeStatusSleepPhrase,[\s\S]*?lastError: handsFreeStatusLastError,[\s\S]*?foregroundOnly: handsFreeStatusForegroundOnly,[\s\S]*?\}\)\s+: undefined;/);
  assert.match(chatMessageChromeSource, /status: \{\s+phase: handsFreeStatusPhase,\s+label: handsFreeStatusLabel,\s+subtitle: handsFreeStatusSubtitle,\s+\}/);
  assert.match(chatMessageChromeSource, /const \{ status: handsFreeStatus, \.\.\.handsFreeControlProps \} = handsFreeControls;/);
  assert.match(chatMessageChromeSource, /<ChatComposerHandsFreeControls\s+\{\.\.\.handsFreeControlProps\}\s+status=\{<HandsFreeStatusChip \{\.\.\.handsFreeStatus\} \/>\}\s+styles=\{styles\.handsFreeControls\}/);
  assert.match(chatMessageChromeSource, /<View style=\{styles\.statusRow\}>[\s\S]*?\{status\}/);
  assert.match(chatMessageChromeSource, /<View style=\{styles\.controlsRow\}>/);
  assert.match(screenSource, /handsFreeController\.statusLabel/);
  assert.doesNotMatch(screenSource, /const handsFreeStatusSubtitle = useMemo/);
  assert.doesNotMatch(screenSource, /getHandsFreeComposerCopyState,/);
  assert.match(chatMessageChromeSource, /getHandsFreeComposerCopyState,/);
  assert.match(screenSource, /createChatRuntimeMobileChromeStyleState,/);
  assert.match(chatMessageChromeSource, /getHandsFreeComposerMobileSurfaceRenderState,/);
  assert.doesNotMatch(screenSource, /getHandsFreeComposerMobileSurfaceState,/);
  assert.doesNotMatch(screenSource, /getHandsFreeComposerMobileSurfaceColors,/);
  assert.doesNotMatch(screenSource, /const handsFreeCopy = getChatComposerHandsFreeCopyState\(\);/);
  assert.doesNotMatch(screenSource, /getChatComposerHandsFreeCopyState,/);
  assert.doesNotMatch(screenSource, /getChatComposerHandsFreeDebugMessage,/);
  assert.match(chatMessageChromeSource, /export function getChatComposerHandsFreeDebugMessage/);
  assert.doesNotMatch(screenSource, /const mobileHandsFreeSurface = getHandsFreeComposerMobileSurfaceState\(\);/);
  assert.doesNotMatch(screenSource, /const mobileHandsFreeSurfaceRenderState = useMemo/);
  assert.doesNotMatch(screenSource, /const mobileHandsFreeSurface = mobileHandsFreeSurfaceRenderState\.surface;/);
  assert.match(chatMessageChromeSource, /const handsFreeSurface = getHandsFreeComposerMobileSurfaceRenderState\(\{\s+colors,\s+\}\)\.surface;/);
  assert.match(screenSource, /const handsFreeStyleState = composerChromeStyleState\.handsFree;/);
  assert.match(screenSource, /const handsFreeSurface = handsFreeStyleState\.surface;/);
  assert.match(screenSource, /const handsFreeSurfaceColors = handsFreeStyleState\.colors;/);
  assert.match(screenSource, /spacing\[handsFreeSurface\.statusRow\.paddingHorizontal\]/);
  assert.doesNotMatch(screenSource, /HANDS_FREE_COMPOSER_PRESENTATION/);
});

test('lets handsfree users queue a drafted message without sending immediately', () => {
  assert.match(screenSource, /useChatComposerRuntimeSubmissionChromeState,/);
  assert.doesNotMatch(chatScreenSource, /useChatComposerRuntimeSubmissionActionsState,/);
  assert.doesNotMatch(screenSource, /const queueComposerInput = useCallback\(\(\) => \{/);
  assert.match(chatMessageChromeSource, /const queueComposerInput = useCallback\(\(\) => \{[\s\S]*?queue\.enqueue\(currentConversationId, composedMessage, currentConversationId\);[\s\S]*?clearComposerDraft\(\);/);
  assert.doesNotMatch(screenSource, /queueActionShouldRender:/);
  assert.doesNotMatch(screenSource, /queueActionRenderState:/);
  assert.match(screenSource, /onQueueActionPress: queueComposerInput,/);
  assert.match(chatMessageChromeSource, /shouldRender: controlRenderState\.visibility\.queueAction\.shouldRender/);
  assert.match(chatMessageChromeSource, /renderState: controlRenderState\.queueAction/);
  assert.match(chatMessageChromeSource, /<ChatComposerLabeledActionButton\s+\{\.\.\.queueAction\}\s+styles=\{styles\.queueAction\}/);
  assert.match(chatMessageChromeSource, /accessibilityLabel=\{renderState\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /<Text style=\{styles\.text\}>[\s\S]*?\{renderState\.label\}/);
});

test('derives send-next availability from strict FIFO queue semantics', () => {
  assert.match(screenSource, /useChatMessageRuntimeQueuePanelState,/);
  assert.doesNotMatch(screenSource, /const nextQueuedMessage = !responding && !isMessageQueuePaused \? messageQueue\.peek\(currentConversationId\) : null;/);
  assert.match(chatMessageChromeSource, /const nextQueuedMessage = !responding && !isMessageQueuePaused \? queue\.peek\(currentConversationId\) : null;/);
  assert.match(screenSource, /canProcessNextQueuedMessage: !!nextQueuedMessage/);
  assert.match(chatMessageChromeSource, /canProcessNext: canProcessNextQueuedMessage/);
});

test('wires ChatScreen through the extracted handsfree controller and recognizer hooks', () => {
  assert.match(screenSource, /useSpeechRecognizer\(/);
  assert.match(screenSource, /useHandsFreeController\(/);
  assert.match(screenSource, /useChatRuntimeForegroundState,/);
  assert.match(screenSource, /const \{ handsFreeRuntimeActive \} = useChatRuntimeForegroundState\(\{\s+handsFree,\s+isFocused,\s+\}\);/);
  assert.match(screenSource, /useChatComposerRuntimeHandsFreeRecognizerLifecycleState,/);
  assert.match(screenSource, /useChatComposerRuntimeHandsFreeRecognizerLifecycleState\(\{\s+handsFree,\s+handsFreeRuntimeActive,\s+listening,\s+handsFreeController,\s+startRecording,\s+stopRecognitionOnly,\s+setHandsFreePhaseRefValue,\s+\}\);/);
  assert.match(chatMessageChromeSource, /export function useChatRuntimeForegroundState/);
  assert.match(chatMessageChromeSource, /export function useChatComposerRuntimeHandsFreeRecognizerLifecycleState/);
  assert.match(chatMessageChromeSource, /const \[appState, setAppState\] = useState<AppStateStatus>\(AppState\.currentState\);/);
  assert.match(chatMessageChromeSource, /AppState\.addEventListener\('change', \(nextState\) => \{[\s\S]*?setAppState\(nextState\);/);
  assert.match(chatMessageChromeSource, /handsFreeRuntimeActive: handsFree && isFocused && isAppActive,/);
  assert.match(chatMessageChromeSource, /setHandsFreePhaseRefValue\(handsFreeController\.state\.phase\);/);
  assert.match(chatMessageChromeSource, /if \(!handsFreeRuntimeActive && listening\) \{[\s\S]*?void stopRecognitionOnly\(\);/);
  assert.match(chatMessageChromeSource, /if \(handsFreeController\.state\.phase === 'error'\) \{[\s\S]*?handsFreeController\.resetError\(\);/);
  assert.match(chatMessageChromeSource, /if \(handsFreeController\.shouldKeepRecognizerActive && !listening\) \{[\s\S]*?void startRecording\(\);/);
  assert.match(chatMessageChromeSource, /if \(!handsFreeController\.shouldKeepRecognizerActive && listening\) \{[\s\S]*?void stopRecognitionOnly\(\);/);
  assert.doesNotMatch(screenSource, /const \[appState, setAppState\] = useState<AppStateStatus>\(AppState\.currentState\);/);
  assert.doesNotMatch(screenSource, /AppState\.addEventListener/);
  assert.doesNotMatch(screenSource, /setHandsFreePhaseRefValue\(handsFreeController\.state\.phase\);/);
  assert.doesNotMatch(screenSource, /handsFreeController\.shouldKeepRecognizerActive/);
  assert.doesNotMatch(screenSource, /handsFreeController\.resetError\(\);/);
  assert.doesNotMatch(screenSource, /if \(!handsFreeRuntimeActive && listening\)/);
  assert.match(screenSource, /const chatRuntimeConfig = createChatRuntimeMobileConfigState\(config\);/);
  assert.match(screenSource, /handsFreeMessageDebounceMs,[\s\S]*?handsFreeWakePhrase,[\s\S]*?handsFreeSleepPhrase,[\s\S]*?handsFreeDebugEnabled,[\s\S]*?handsFreeForegroundOnly,[\s\S]*?messageQueueEnabled,[\s\S]*?ttsEnabled: ttsEnabledSetting,/);
  assert.match(chatMessageChromeSource, /export function createChatRuntimeMobileConfigState/);
  assert.match(chatMessageChromeSource, /DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS/);
  assert.match(chatMessageChromeSource, /DEFAULT_HANDS_FREE_WAKE_PHRASE/);
  assert.match(chatMessageChromeSource, /DEFAULT_HANDS_FREE_SLEEP_PHRASE/);
  assert.match(chatMessageChromeSource, /DEFAULT_MOBILE_APP_CONFIG/);
  assert.doesNotMatch(screenSource, /from '@dotagents\/shared\/mobile-app-config'/);
  assert.doesNotMatch(screenSource, /DEFAULT_HANDS_FREE_(MESSAGE_DEBOUNCE_MS|WAKE_PHRASE|SLEEP_PHRASE)/);
  assert.doesNotMatch(screenSource, /DEFAULT_MOBILE_APP_CONFIG/);
  assert.match(screenSource, /handsFreeDebounceMs:\s*handsFreeMessageDebounceMs/);
  assert.match(screenSource, /handlePushToTalkPressIn/);
  assert.match(screenSource, /handlePushToTalkPressOut/);
});

test('resets the handsfree controller before shutting down recognizer state when toggled off', () => {
  assert.match(screenSource, /useChatRuntimeHandsFreeToggleChromeActionsState,/);
  assert.match(screenSource, /const \{ toggleHandsFree \} = useChatRuntimeHandsFreeToggleChromeActionsState\(\{\s+config,\s+setConfig,\s+saveConfig,\s+handsFreeController,\s+handsFreeRef,\s+setHandsFreeRefValue,\s+stopRecognitionOnly,\s+setDebugInfo,\s+\}\);/);
  assert.match(chatMessageChromeSource, /export function useChatRuntimeHandsFreeToggleActionsState/);
  assert.match(chatMessageChromeSource, /export function useChatRuntimeHandsFreeToggleChromeActionsState/);
  assert.match(chatMessageChromeSource, /useChatRuntimeHandsFreeToggleActionsState\(\{[\s\S]*?stopSpeech: Speech\.stop,[\s\S]*?stopRemoteSpeech: stopRemoteTts,/);
  assert.match(chatMessageChromeSource, /const next = !handsFreeRef\.current;\s+setHandsFreeRefValue\(next\);/);
  assert.match(chatMessageChromeSource, /if \(!next\) \{[\s\S]*?handsFreeController\.reset\(\);[\s\S]*?void stopRecognitionOnly\(\);[\s\S]*?stopSpeech\(\);[\s\S]*?stopRemoteSpeech\(\);[\s\S]*?getChatComposerHandsFreeDebugMessage\('disabled'\)/);
  assert.doesNotMatch(screenSource, /const next = !handsFreeRef\.current;\s*setHandsFreeRefValue\(next\);/);
  assert.doesNotMatch(screenSource, /handsFreeController\.reset\(\);[\s\S]*?void stopRecognitionOnly\?\.\(\);/);
});

test('falls back to normal direct-send handling for stale handsfree finalizations after toggle-off', () => {
  assert.match(screenSource, /if \(mode === 'handsfree'\) \{\s*if \(handsFreeRef\.current\) \{[\s\S]*?handsFreeController\.handleFinalTranscript\(finalText\);[\s\S]*?return;\s*\}\s*\}\s*void sendRef\.current\(finalText\);/);
});

test('surfaces recent voice debug events in chat when internal diagnostics are enabled', () => {
  assert.doesNotMatch(screenSource, /getChatRuntimeDebugPanelsMobileRenderState,/);
  assert.match(chatMessageChromeSource, /getChatRuntimeDebugPanelsMobileRenderState,/);
  assert.match(screenSource, /useChatComposerRuntimeVoiceDebugResetState,/);
  assert.match(screenSource, /useChatComposerRuntimeVoiceDebugResetState\(\{\s+isVoiceDebugEnabled: handsFreeDebugEnabled,\s+clearVoiceDebug,\s+\}\);/);
  assert.match(chatMessageChromeSource, /export function useChatComposerRuntimeVoiceDebugResetState/);
  assert.match(chatMessageChromeSource, /if \(!isVoiceDebugEnabled\) \{[\s\S]*?clearVoiceDebug\(\);/);
  assert.match(screenSource, /voiceDebugEnabled: handsFreeDebugEnabled/);
  assert.match(screenSource, /voiceEvents,/);
  assert.doesNotMatch(screenSource, /handsFreeCopy\.debug\.voiceDebugTitle/);
  assert.match(chatMessageChromeSource, /handsFreeCopy\.debug\.voiceDebugTitle/);
  assert.doesNotMatch(screenSource, /formatVoiceDebugEntry\(entry\)/);
  assert.doesNotMatch(screenSource, /clearVoiceDebug\(\);/);
  assert.match(chatMessageChromeSource, /formatVoiceDebugEntry\(entry\)/);
  assert.doesNotMatch(screenSource, /debugPanelsRenderState: mobileRuntimeDebugPanelsRenderState,/);
  assert.match(chatMessageChromeSource, /const debugPanelsRenderState = createChatMessageRuntimeDebugPanelsRenderState\(\{/);
  assert.doesNotMatch(screenSource, />Voice debug<\/Text>/);
});

test('keeps wake/sleep controls inline and wires a dedicated pause/resume control button', () => {
  assert.match(screenSource, /useChatComposerRuntimeHandsFreeControlChromeActionsState,/);
  assert.match(screenSource, /const \{\s+wakeHandsFreeByUser,\s+sleepHandsFreeByUser,\s+resumeHandsFreeByUser,\s+pauseHandsFreeByUser,\s+handleHandsFreePrimaryControl,\s+\} = useChatComposerRuntimeHandsFreeControlChromeActionsState\(\{\s+handsFreeController,\s+listening,\s+wakePhrase: handsFreeWakePhrase,\s+startRecording,\s+stopRecognitionOnly,\s+setDebugInfo,\s+\}\);/);
  assert.doesNotMatch(screenSource, /const wakeHandsFreeByUser = useCallback\(\(\) => \{/);
  assert.match(chatMessageChromeSource, /export function useChatComposerRuntimeHandsFreeControlActionsState/);
  assert.match(chatMessageChromeSource, /export function useChatComposerRuntimeHandsFreeControlChromeActionsState/);
  assert.match(chatMessageChromeSource, /useChatComposerRuntimeHandsFreeControlActionsState\(\{[\s\S]*?stopSpeech: Speech\.stop,/);
  assert.match(chatMessageChromeSource, /const wakeHandsFreeByUser = useCallback\(\(\) => \{[\s\S]*?wakeByUser\(\);[\s\S]*?void startRecording\(\);/);
  assert.match(chatMessageChromeSource, /const pauseHandsFreeByUser = useCallback\(\(\) => \{[\s\S]*?pauseByUser\(\);[\s\S]*?stopSpeech\(\);[\s\S]*?void stopRecognitionOnly\(\);/);
  assert.doesNotMatch(screenSource, /const handsFreeControlState = getHandsFreeComposerControlState\(handsFreeController\.state\.phase\);/);
  assert.match(chatMessageChromeSource, /const handsFreeControlState = getHandsFreeComposerControlState\(handsFreeStatusPhase\);/);
  assert.match(screenSource, /handsFreeStatusPhase: handsFreeController\.state\.phase,[\s\S]*?handsFreeStatusForegroundOnly: handsFreeForegroundOnly,[\s\S]*?onWakeHandsFree: wakeHandsFreeByUser,[\s\S]*?onSleepHandsFree: sleepHandsFreeByUser,[\s\S]*?onResumeHandsFree: resumeHandsFreeByUser,[\s\S]*?onPauseHandsFree: pauseHandsFreeByUser,/);
  assert.match(chatMessageChromeSource, /handsFreeControls: \{[\s\S]*?isVisible: controlRenderState\.visibility\.handsFreeControls\.isVisible,[\s\S]*?status: \{[\s\S]*?phase: handsFreeStatusPhase,[\s\S]*?label: handsFreeStatusLabel,[\s\S]*?subtitle: handsFreeStatusSubtitle,[\s\S]*?\},[\s\S]*?controlState: handsFreeControlState,[\s\S]*?onWake: onWakeHandsFree,[\s\S]*?onSleep: onSleepHandsFree,[\s\S]*?onResume: onResumeHandsFree,[\s\S]*?onPause: onPauseHandsFree,[\s\S]*?\.\.\.chrome\.handsFreeControls,/);
  assert.match(chatMessageChromeSource, /const primaryOnPress = controlState\.primary\.action === 'wake'\s+\? onWake\s+: onSleep;/);
  assert.match(chatMessageChromeSource, /const secondaryOnPress = controlState\.secondary\.action === 'resume'\s+\? onResume\s+: onPause;/);
  assert.match(chatMessageChromeSource, /accessibilityRole=\{controlState\.primary\.accessibilityRole\}/);
  assert.match(chatMessageChromeSource, /accessibilityLabel=\{controlState\.primary\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /accessibilityRole=\{controlState\.secondary\.accessibilityRole\}/);
  assert.match(chatMessageChromeSource, /accessibilityLabel=\{controlState\.secondary\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /onPress=\{primaryOnPress\}[\s\S]*?\{controlState\.primary\.label\}/);
  assert.match(chatMessageChromeSource, /onPress=\{secondaryOnPress\}[\s\S]*?\{controlState\.secondary\.label\}/);
  assert.doesNotMatch(screenSource, /const micButtonLabel = getHandsFreeMicButtonLabel/);
  assert.doesNotMatch(screenSource, /createChatComposerRuntimeControlRenderState/);
  assert.match(screenSource, /composerControlMicPhase: handsFreeController\.state\.phase,\s+composerControlListening: listening,\s+composerControlMessageQueueEnabled: messageQueueEnabled,\s+onImageAttachmentPress: handlePickImages,/);
  assert.doesNotMatch(screenSource, /composerControlColors: theme\.colors,/);
  assert.match(chatMessageChromeSource, /pendingImagesColors: colors,\s+composerControlColors: colors,/);
  assert.match(chatMessageChromeSource, /createChatComposerRuntimeControlRenderState\(\{[\s\S]*?micPhase: composerControlMicPhase,[\s\S]*?listening: composerControlListening,[\s\S]*?colors: composerControlColors,[\s\S]*?\}\)/);
  assert.match(chatMessageChromeSource, /const micLabel = getHandsFreeMicButtonLabel\(\{[\s\S]*?handsFree,[\s\S]*?phase: micPhase,[\s\S]*?listening,[\s\S]*?\}\);/);
  assert.match(chatMessageChromeSource, /micButton: getChatComposerMicMobileRenderState\(\{[\s\S]*?label: micLabel,[\s\S]*?handsFree,[\s\S]*?listening,[\s\S]*?willCancel: editBeforeSendEnabled,[\s\S]*?colors,[\s\S]*?\}\),/);
  assert.doesNotMatch(screenSource, /micButtonRenderState:/);
  assert.match(chatMessageChromeSource, /renderState: controlRenderState\.micButton/);
  assert.match(chatMessageChromeSource, /\{renderState\.label\}/);
  assert.match(screenSource, /onMicPressIn: handlePushToTalkPressIn,\s+onMicPressOut: handlePushToTalkPressOut,\s+onMicPress: handleHandsFreePrimaryControl,/);
  assert.match(chatMessageChromeSource, /onPressIn: controlRenderState\.visibility\.micButton\.shouldUsePushToTalk \? onMicPressIn : undefined/);
  assert.match(chatMessageChromeSource, /onPress: controlRenderState\.visibility\.micButton\.shouldUseHandsFreePrimaryControl \? onMicPress : undefined/);
  assert.match(screenSource, /flexDirection:\s*handsFreeSurface\.controlsRow\.flexDirection/);
  assert.match(screenSource, /alignItems:\s*handsFreeSurface\.controlsRow\.alignItems/);
  assert.match(screenSource, /gap:\s*spacing\[handsFreeSurface\.controlsRow\.gap\]/);
  assert.match(screenSource, /flex:\s*handsFreeSurface\.controlButton\.flex/);
  assert.match(screenSource, /borderColor:\s*handsFreeSurfaceColors\.controlButton\.borderColor/);
  assert.match(screenSource, /backgroundColor:\s*handsFreeSurfaceColors\.controlButton\.backgroundColor/);
  assert.match(screenSource, /minHeight:\s*handsFreeSurface\.controlButton\.minHeight/);
  assert.match(screenSource, /alignItems:\s*handsFreeSurface\.controlButton\.alignItems/);
  assert.match(screenSource, /justifyContent:\s*handsFreeSurface\.controlButton\.justifyContent/);
  assert.doesNotMatch(screenSource, /const mobileHandsFreeSurface = mobileHandsFreeSurfaceRenderState\.surface;/);
  assert.match(chatMessageChromeSource, /const handsFreeSurface = getHandsFreeComposerMobileSurfaceRenderState\(\{\s+colors,\s+\}\)\.surface;/);
  assert.match(chatMessageChromeSource, /controlPressedOpacity: handsFreeSurface\.controlButton\.pressedOpacity/);
  assert.match(chatMessageChromeSource, /activeOpacity=\{controlPressedOpacity\}/);
  assert.match(screenSource, /color:\s*handsFreeSurfaceColors\.controlButtonText\.color/);
  assert.match(screenSource, /fontWeight:\s*handsFreeSurface\.controlButtonText\.fontWeight/);
  assert.doesNotMatch(screenSource, /handsFreeControlState\.primary\.action === 'wake'/);
  assert.doesNotMatch(screenSource, /onPress=\{handsFreeControlState\.secondary\.action === 'resume' \? resumeHandsFreeByUser : pauseHandsFreeByUser\}/);
  assert.doesNotMatch(screenSource, /handsFreeControlButton:\s*\{[^}]*?borderColor:\s*theme\.colors\.border/);
  assert.doesNotMatch(screenSource, /handsFreeControlButtonText:\s*\{[^}]*?color:\s*theme\.colors\.foreground/);
});

test('uses shared handsfree composer presentation helpers instead of local phase copy', () => {
  assert.doesNotMatch(screenSource, /handsFreeCopy/);
  assert.match(screenSource, /backgroundColor:\s*handsFreeSurfaceColors\.debugPanel\.backgroundColor/);
  assert.match(screenSource, /handsFreeSurface\.debugPanel\.borderLeftWidth/);
  assert.match(screenSource, /borderLeftColor:\s*handsFreeSurfaceColors\.debugPanel\.borderLeftColor/);
  assert.match(screenSource, /color:\s*handsFreeSurfaceColors\.debugText\.color/);
  assert.match(screenSource, /resolveChatRuntimeMobileFontFamily\(handsFreeSurface\.debugText\.fontFamilyByPlatform\)/);
  assert.doesNotMatch(screenSource, /formatHandsFreeSleepingDebugMessage/);
  assert.doesNotMatch(screenSource, /formatHandsFreeRecognizerErrorDebugMessage/);
  assert.match(chatMessageChromeSource, /formatHandsFreeSleepingDebugMessage/);
  assert.match(chatMessageChromeSource, /formatHandsFreeRecognizerErrorDebugMessage/);
  assert.doesNotMatch(screenSource, /formatChatComposerHandsFreeSleepingDebugMessage/);
  assert.match(chatMessageChromeSource, /formatChatComposerHandsFreeSleepingDebugMessage/);
  assert.doesNotMatch(screenSource, /formatChatComposerHandsFreeRecognizerErrorDebugMessage/);
  assert.match(screenSource, /createChatComposerHandsFreeRecognizerErrorDebugState,/);
  assert.match(screenSource, /setDebugInfo\(createChatComposerHandsFreeRecognizerErrorDebugState\(message\)\.debugInfo\)/);
  assert.match(screenSource, /mergeVoiceTextIntoComposer\(finalText\)/);
  assert.doesNotMatch(screenSource, /mergeChatComposerRuntimeVoiceText/);
  assert.doesNotMatch(screenSource, /mergeVoiceText\(/);
  assert.match(chatMessageChromeSource, /mergeVoiceText/);
  assert.match(chatMessageChromeSource, /export function mergeChatComposerRuntimeVoiceText/);
  assert.doesNotMatch(screenSource, /getChatComposerHandsFreeDebugMessage\('transcriptAdded'\)/);
  assert.doesNotMatch(screenSource, /getChatComposerHandsFreeDebugMessage\('permissionDenied'\)/);
  assert.match(screenSource, /createChatComposerHandsFreeTranscriptAddedDebugState,/);
  assert.match(screenSource, /setDebugInfo\(createChatComposerHandsFreeTranscriptAddedDebugState\(\)\.debugInfo\)/);
  assert.match(screenSource, /createChatComposerHandsFreePermissionDeniedDebugState,/);
  assert.match(screenSource, /setDebugInfo\(createChatComposerHandsFreePermissionDeniedDebugState\(\)\.debugInfo\)/);
  assert.match(chatMessageChromeSource, /export function createChatComposerHandsFreeTranscriptAddedDebugState\(\)/);
  assert.match(chatMessageChromeSource, /return createChatComposerHandsFreeDebugInfoState\('transcriptAdded'\)/);
  assert.match(chatMessageChromeSource, /export function createChatComposerHandsFreePermissionDeniedDebugState\(\)/);
  assert.match(chatMessageChromeSource, /return createChatComposerHandsFreeDebugInfoState\('permissionDenied'\)/);
  assert.match(chatMessageChromeSource, /export function createChatComposerHandsFreeRecognizerErrorDebugState\(message: string\)/);
  assert.match(chatMessageChromeSource, /debugInfo: formatChatComposerHandsFreeRecognizerErrorDebugMessage\(message\)/);
  assert.doesNotMatch(screenSource, /getChatComposerHandsFreeDebugMessage\('enabled'\)/);
  assert.match(chatMessageChromeSource, /getChatComposerHandsFreeDebugMessage\('enabled'\)/);
  assert.match(chatMessageChromeSource, /getChatComposerHandsFreeDebugMessage\('disabled'\)/);
  assert.doesNotMatch(screenSource, /getChatComposerHandsFreeDebugMessage\('awake'\)/);
  assert.doesNotMatch(screenSource, /getChatComposerHandsFreeDebugMessage\('resumed'\)/);
  assert.doesNotMatch(screenSource, /getChatComposerHandsFreeDebugMessage\('paused'\)/);
  assert.match(chatMessageChromeSource, /getChatComposerHandsFreeDebugMessage\('awake'\)/);
  assert.match(chatMessageChromeSource, /getChatComposerHandsFreeDebugMessage\('resumed'\)/);
  assert.match(chatMessageChromeSource, /getChatComposerHandsFreeDebugMessage\('paused'\)/);
  assert.doesNotMatch(screenSource, /handsFreeCopy\.debug\.(transcriptAdded|permissionDenied|enabled|disabled|awake|resumed|paused)/);
  assert.doesNotMatch(screenSource, /getHandsFreeComposerControlState/);
  assert.match(chatMessageChromeSource, /getHandsFreeComposerControlState/);
  assert.doesNotMatch(screenSource, /getHandsFreeStatusSubtitle/);
  assert.match(chatMessageChromeSource, /getHandsFreeStatusSubtitle/);
  assert.doesNotMatch(screenSource, /getHandsFreeComposerPlaceholder/);
  assert.match(chatMessageChromeSource, /getHandsFreeComposerPlaceholder/);
  assert.doesNotMatch(screenSource, /getHandsFreeMicButtonLabel/);
  assert.match(chatMessageChromeSource, /getHandsFreeMicButtonLabel/);
  assert.doesNotMatch(screenSource, /getHandsFreePauseResumeLabel/);
  assert.doesNotMatch(screenSource, /handsFreeCopy\.controls\.wakeLabel/);
  assert.doesNotMatch(screenSource, /handsFreeCopy\.controls\.sleepLabel/);
  assert.doesNotMatch(screenSource, /theme\.colors\[handsFreeSurface\.(controlButton|controlButtonText|debugPanel|debugText)\./);
  assert.doesNotMatch(screenSource, /switch \(handsFreeController\.state\.phase\)/);
  assert.doesNotMatch(screenSource, /Handsfree mode turned off\./);
  assert.doesNotMatch(screenSource, /Voice transcript added to the composer\./);
  assert.doesNotMatch(screenSource, /Speech recognition permission denied\./);
  assert.doesNotMatch(screenSource, /Voice error: \$\{message\}/);
  assert.doesNotMatch(screenSource, /Handsfree paused — tap mic to resume or type a message/);
  assert.doesNotMatch(screenSource, /debugInfo:\s*\{[^}]*?backgroundColor:\s*theme\.colors\.muted/);
  assert.doesNotMatch(screenSource, /debugText:\s*\{[^}]*?color:\s*theme\.colors\.mutedForeground/);
});

test('pauses queued-message auto-processing while handsfree is paused', () => {
  assert.match(screenSource, /useChatRuntimeHandsFreeMutableState,/);
  assert.match(screenSource, /const \{\s+handsFreeRef,\s+handsFreePhaseRef,\s+ttsEnabledRef,\s+setHandsFreeRefValue,\s+setHandsFreePhaseRefValue,\s+\} = useChatRuntimeHandsFreeMutableState\(\{\s+handsFree,\s+ttsEnabled: ttsEnabledSetting,\s+\}\);/);
  assert.match(chatMessageChromeSource, /export function useChatRuntimeHandsFreeMutableState/);
  assert.match(chatMessageChromeSource, /const handsFreeRef = useRef<boolean>\(handsFree\);/);
  assert.match(chatMessageChromeSource, /const handsFreePhaseRef = useRef<HandsFreePhase>\('sleeping'\);/);
  assert.match(chatMessageChromeSource, /const ttsEnabledRef = useRef<boolean>\(ttsEnabled\);/);
  assert.match(chatMessageChromeSource, /setHandsFreePhaseRefValue\(handsFreeController\.state\.phase\);/);
  assert.doesNotMatch(screenSource, /setHandsFreePhaseRefValue\(handsFreeController\.state\.phase\);/);
  assert.doesNotMatch(screenSource, /const handsFreePhaseRef = useRef<HandsFreePhase>\('sleeping'\);/);
  assert.doesNotMatch(screenSource, /handsFreePhaseRef\.current = handsFreeController\.state\.phase;/);
  assert.match(screenSource, /scheduleChatMessageRuntimeNextQueuedMessage,/);
  assert.match(screenSource, /scheduleChatMessageRuntimeNextQueuedMessage\(\{\s+currentConversationId,\s+queue: messageQueue,\s+canProcessQueue: messageQueueEnabled,/);
  assert.match(chatMessageChromeSource, /export function scheduleChatMessageRuntimeNextQueuedMessage/);
  assert.match(chatMessageChromeSource, /if \(handsFree && \(handsFreePhase \?\? handsFreePhaseRef\.current\) === 'paused'\) return;/);
  assert.match(chatMessageChromeSource, /if \(handsFreeRef\.current && handsFreePhaseRef\.current === 'paused'\) \{\s+return;\s+\}[\s\S]*?queue\.markProcessing\(currentConversationId, nextMessage\.id\);/);
});
