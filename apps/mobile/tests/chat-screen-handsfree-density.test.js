const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);
const chatMessageChromeSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ChatMessageChrome.tsx'),
  'utf8'
);

test('renders the extracted handsfree status chip in the mobile chat composer', () => {
  assert.doesNotMatch(screenSource, /HandsFreeStatusChip/);
  assert.match(screenSource, /handsFreeControls: \{\s+isVisible: handsFree,\s+status: \{\s+phase: handsFreeController\.state\.phase,\s+label: handsFreeController\.statusLabel,\s+subtitle: handsFreeStatusSubtitle,\s+\}/);
  assert.match(chatMessageChromeSource, /import \{ HandsFreeStatusChip \} from '\.\/HandsFreeStatusChip';/);
  assert.match(chatMessageChromeSource, /const \{ status: handsFreeStatus, \.\.\.handsFreeControlProps \} = handsFreeControls;/);
  assert.match(chatMessageChromeSource, /<ChatComposerHandsFreeControls\s+\{\.\.\.handsFreeControlProps\}\s+status=\{<HandsFreeStatusChip \{\.\.\.handsFreeStatus\} \/>\}\s+styles=\{styles\.handsFreeControls\}/);
  assert.match(chatMessageChromeSource, /<View style=\{styles\.statusRow\}>[\s\S]*?\{status\}/);
  assert.match(chatMessageChromeSource, /<View style=\{styles\.controlsRow\}>/);
  assert.match(screenSource, /handsFreeController\.statusLabel/);
  assert.match(screenSource, /handsFreeStatusSubtitle/);
  assert.match(screenSource, /getHandsFreeComposerCopyState,/);
  assert.match(screenSource, /getHandsFreeComposerMobileSurfaceRenderState,/);
  assert.doesNotMatch(screenSource, /getHandsFreeComposerMobileSurfaceState,/);
  assert.doesNotMatch(screenSource, /getHandsFreeComposerMobileSurfaceColors,/);
  assert.match(screenSource, /const handsFreeCopy = getHandsFreeComposerCopyState\(\);/);
  assert.doesNotMatch(screenSource, /const mobileHandsFreeSurface = getHandsFreeComposerMobileSurfaceState\(\);/);
  assert.match(screenSource, /const mobileHandsFreeSurfaceRenderState = useMemo\(\s+\(\) => getHandsFreeComposerMobileSurfaceRenderState\(\{\s+colors: theme\.colors,\s+\}\),\s+\[theme\.colors\],\s+\);/);
  assert.match(screenSource, /const mobileHandsFreeSurface = mobileHandsFreeSurfaceRenderState\.surface;/);
  assert.match(screenSource, /const handsFreeStyleState = getHandsFreeComposerMobileSurfaceRenderState\(\{\s+colors: theme\.colors,\s+\}\);/);
  assert.match(screenSource, /const handsFreeSurface = handsFreeStyleState\.surface;/);
  assert.match(screenSource, /const handsFreeSurfaceColors = handsFreeStyleState\.colors;/);
  assert.match(screenSource, /spacing\[handsFreeSurface\.statusRow\.paddingHorizontal\]/);
  assert.doesNotMatch(screenSource, /HANDS_FREE_COMPOSER_PRESENTATION/);
});

test('lets handsfree users queue a drafted message without sending immediately', () => {
  assert.match(screenSource, /const queueComposerInput = useCallback\(\(\) => \{[\s\S]*?messageQueue\.enqueue\(currentConversationId, composedMessage, currentConversationId\);[\s\S]*?setInput\(''\);[\s\S]*?setPendingImages\(\[\]\);/);
  assert.match(screenSource, /queueAction: \{\s+shouldRender: handsFree && messageQueueEnabled,\s+renderState: mobileComposerQueueRenderState,\s+onPress: queueComposerInput,/);
  assert.match(chatMessageChromeSource, /<ChatComposerLabeledActionButton\s+\{\.\.\.queueAction\}\s+styles=\{styles\.queueAction\}/);
  assert.match(chatMessageChromeSource, /accessibilityLabel=\{renderState\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /<Text style=\{styles\.text\}>[\s\S]*?\{renderState\.label\}/);
});

test('derives send-next availability from strict FIFO queue semantics', () => {
  assert.match(screenSource, /const nextQueuedMessage = !responding && !isMessageQueuePaused \? messageQueue\.peek\(currentConversationId\) : null;/);
  assert.match(screenSource, /canProcessNext: !!nextQueuedMessage/);
});

test('wires ChatScreen through the extracted handsfree controller and recognizer hooks', () => {
  assert.match(screenSource, /useSpeechRecognizer\(/);
  assert.match(screenSource, /useHandsFreeController\(/);
  assert.match(screenSource, /handsFreeDebounceMs:\s*handsFreeMessageDebounceMs/);
  assert.match(screenSource, /handlePushToTalkPressIn/);
  assert.match(screenSource, /handlePushToTalkPressOut/);
});

test('resets the handsfree controller before shutting down recognizer state when toggled off', () => {
  assert.match(screenSource, /const next = !handsFreeRef\.current;\s*handsFreeRef\.current = next;/);
  assert.match(screenSource, /if \(!next\) \{[\s\S]*?handsFreeController\.reset\(\);[\s\S]*?void stopRecognitionOnly\?\.\(\);[\s\S]*?Speech\.stop\(\);[\s\S]*?handsFreeCopy\.debug\.disabled/);
});

test('falls back to normal direct-send handling for stale handsfree finalizations after toggle-off', () => {
  assert.match(screenSource, /if \(mode === 'handsfree'\) \{\s*if \(handsFreeRef\.current\) \{[\s\S]*?handsFreeController\.handleFinalTranscript\(finalText\);[\s\S]*?return;\s*\}\s*\}\s*void sendRef\.current\(finalText\);/);
});

test('surfaces recent voice debug events in chat when internal diagnostics are enabled', () => {
  assert.match(screenSource, /handsFreeDebugEnabled && voiceEvents\.length > 0/);
  assert.match(screenSource, /handsFreeCopy\.debug\.voiceDebugTitle/);
  assert.match(screenSource, /formatVoiceDebugEntry\(entry\)/);
  assert.doesNotMatch(screenSource, />Voice debug<\/Text>/);
});

test('keeps wake/sleep controls inline and wires a dedicated pause/resume control button', () => {
  assert.match(screenSource, /const wakeHandsFreeByUser = useCallback\(\(\) => \{[\s\S]*?handsFreeController\.wakeByUser\(\);[\s\S]*?void startRecording\(\);/);
  assert.match(screenSource, /const handsFreeControlState = getHandsFreeComposerControlState\(handsFreeController\.state\.phase\);/);
  assert.match(screenSource, /handsFreeControls: \{\s+isVisible: handsFree,[\s\S]*?controlState: handsFreeControlState,[\s\S]*?onWake: wakeHandsFreeByUser,[\s\S]*?onSleep: sleepHandsFreeByUser,[\s\S]*?onResume: resumeHandsFreeByUser,[\s\S]*?onPause: pauseHandsFreeByUser,[\s\S]*?\.\.\.chatComposerRuntimeDockChrome\.handsFreeControls,/);
  assert.match(chatMessageChromeSource, /const primaryOnPress = controlState\.primary\.action === 'wake'\s+\? onWake\s+: onSleep;/);
  assert.match(chatMessageChromeSource, /const secondaryOnPress = controlState\.secondary\.action === 'resume'\s+\? onResume\s+: onPause;/);
  assert.match(chatMessageChromeSource, /accessibilityRole=\{controlState\.primary\.accessibilityRole\}/);
  assert.match(chatMessageChromeSource, /accessibilityLabel=\{controlState\.primary\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /accessibilityRole=\{controlState\.secondary\.accessibilityRole\}/);
  assert.match(chatMessageChromeSource, /accessibilityLabel=\{controlState\.secondary\.accessibilityLabel\}/);
  assert.match(chatMessageChromeSource, /onPress=\{primaryOnPress\}[\s\S]*?\{controlState\.primary\.label\}/);
  assert.match(chatMessageChromeSource, /onPress=\{secondaryOnPress\}[\s\S]*?\{controlState\.secondary\.label\}/);
  assert.match(screenSource, /const micButtonLabel = getHandsFreeMicButtonLabel\(\{[\s\S]*?handsFree,[\s\S]*?phase: handsFreeController\.state\.phase,[\s\S]*?listening,[\s\S]*?\}\);/);
  assert.match(screenSource, /const mobileComposerMicRenderState = useMemo\(\s+\(\) => getChatComposerMicMobileRenderState\(\{[\s\S]*?label: micButtonLabel,[\s\S]*?handsFree,[\s\S]*?listening,[\s\S]*?willCancel,[\s\S]*?colors: theme\.colors,[\s\S]*?\}\),/);
  assert.match(screenSource, /micButton: \{\s+renderState: mobileComposerMicRenderState,/);
  assert.match(chatMessageChromeSource, /\{renderState\.label\}/);
  assert.match(screenSource, /onPress: handsFree \? handleHandsFreePrimaryControl : undefined/);
  assert.match(screenSource, /flexDirection:\s*handsFreeSurface\.controlsRow\.flexDirection/);
  assert.match(screenSource, /alignItems:\s*handsFreeSurface\.controlsRow\.alignItems/);
  assert.match(screenSource, /gap:\s*spacing\[handsFreeSurface\.controlsRow\.gap\]/);
  assert.match(screenSource, /flex:\s*handsFreeSurface\.controlButton\.flex/);
  assert.match(screenSource, /borderColor:\s*handsFreeSurfaceColors\.controlButton\.borderColor/);
  assert.match(screenSource, /backgroundColor:\s*handsFreeSurfaceColors\.controlButton\.backgroundColor/);
  assert.match(screenSource, /minHeight:\s*handsFreeSurface\.controlButton\.minHeight/);
  assert.match(screenSource, /alignItems:\s*handsFreeSurface\.controlButton\.alignItems/);
  assert.match(screenSource, /justifyContent:\s*handsFreeSurface\.controlButton\.justifyContent/);
  assert.match(screenSource, /const mobileHandsFreeSurface = mobileHandsFreeSurfaceRenderState\.surface;/);
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
  assert.match(screenSource, /handsFreeCopy/);
  assert.match(screenSource, /backgroundColor:\s*handsFreeSurfaceColors\.debugPanel\.backgroundColor/);
  assert.match(screenSource, /handsFreeSurface\.debugPanel\.borderLeftWidth/);
  assert.match(screenSource, /borderLeftColor:\s*handsFreeSurfaceColors\.debugPanel\.borderLeftColor/);
  assert.match(screenSource, /color:\s*handsFreeSurfaceColors\.debugText\.color/);
  assert.match(screenSource, /resolveMobileFontFamily\(handsFreeSurface\.debugText\.fontFamilyByPlatform\)/);
  assert.match(screenSource, /formatHandsFreeSleepingDebugMessage/);
  assert.match(screenSource, /formatHandsFreeRecognizerErrorDebugMessage/);
  assert.match(screenSource, /handsFreeCopy\.debug\.transcriptAdded/);
  assert.match(screenSource, /handsFreeCopy\.debug\.permissionDenied/);
  assert.match(screenSource, /getHandsFreeComposerControlState/);
  assert.match(screenSource, /getHandsFreeStatusSubtitle/);
  assert.match(screenSource, /getHandsFreeComposerPlaceholder/);
  assert.match(screenSource, /getHandsFreeMicButtonLabel/);
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
  assert.match(screenSource, /const handsFreePhaseRef = useRef<HandsFreePhase>\('sleeping'\);/);
  assert.match(screenSource, /handsFreePhaseRef\.current = handsFreeController\.state\.phase;/);
  assert.match(screenSource, /messageQueueEnabled &&\s*!messageQueue\.isQueuePaused\(currentConversationId\) &&\s*\(!handsFree \|\| handsFreePhaseRef\.current !== 'paused'\)/);
  assert.match(screenSource, /if \(handsFreeRef\.current && handsFreePhaseRef\.current === 'paused'\) \{\s*return;\s*\}[\s\S]*?messageQueue\.markProcessing\(currentConversationId, nextMessage\.id\);/);
});
