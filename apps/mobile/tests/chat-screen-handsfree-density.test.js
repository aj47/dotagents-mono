const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('renders handsfree status as an icon in the mobile chat header', () => {
  assert.match(screenSource, /const headerHandsFreeIcon = \(\{/);
  assert.match(screenSource, /listening: 'ear-outline'/);
  assert.match(screenSource, /styles\.headerVoiceStatusButtonActive/);
  assert.doesNotMatch(screenSource, /<HandsFreeStatusChip/);
});

test('lets handsfree users queue a drafted message without sending immediately', () => {
  assert.match(screenSource, /const queueComposerInput = useCallback\(\(\) => \{[\s\S]*?messageQueue\.enqueue\(currentConversationId, composedMessage(?:, currentConversationId)?\);[\s\S]*?setInput\(''\);[\s\S]*?setPendingImages\(\[\]\);/);
  assert.match(screenSource, /messageQueueEnabled && \([\s\S]*?accessibilityLabel=\{createButtonAccessibilityLabel\('Queue message'\)\}[\s\S]*?<Ionicons name="time-outline" size=\{16\} color=\{theme\.colors\.primary\} \/>/);
  assert.doesNotMatch(screenSource, /<Text style=\{styles\.queueButtonText\}>Queue<\/Text>/);
});

test('derives send-next availability from strict FIFO queue semantics', () => {
  assert.match(screenSource, /const nextQueuedMessage = !responding \? messageQueue\.peek\(currentConversationId\) : null;/);
  assert.match(screenSource, /canProcessNext=\{!!nextQueuedMessage\}/);
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
  assert.match(screenSource, /if \(!next\) \{[\s\S]*?handsFreeController\.reset\(\);[\s\S]*?void stopRecognitionOnly\?\.\(\);[\s\S]*?stopGlobalTtsPlayback\(\);[\s\S]*?Handsfree mode turned off\./);
});

test('falls back to normal direct-send handling for stale handsfree finalizations after toggle-off', () => {
  assert.match(screenSource, /if \(mode === 'handsfree'\) \{\s*if \(handsFreeRef\.current\) \{[\s\S]*?handsFreeController\.handleFinalTranscript\(finalText\);[\s\S]*?return;\s*\}\s*\}\s*void sendRef\.current\(finalText\);/);
});

test('surfaces recent voice debug events in chat when internal diagnostics are enabled', () => {
  assert.match(screenSource, /handsFreeDebugEnabled && voiceEvents\.length > 0/);
  assert.match(screenSource, /formatVoiceDebugEntry\(entry\)/);
  assert.match(screenSource, /const HANDS_FREE_DEBUG_STORAGE_KEY = 'dotagents:handsfree-debug';/);
  assert.match(screenSource, /params\.get\('handsfreeDebug'\) === '1'/);
  assert.match(screenSource, /const foregroundHandsFreeRuntimeActive =[\s\S]*?isAppActive && \(!handsFreeForegroundOnly \|\| isFocused\);/);
});

test('keeps wake and pause/resume controls wired through the primary mic button', () => {
  assert.match(screenSource, /const wakeHandsFreeByUser = useCallback\(\(\) => \{[\s\S]*?handsFreeController\.wakeByUser\(\);[\s\S]*?void startRecording\(\);/);
  assert.match(screenSource, /const handleHandsFreePrimaryControl = useCallback\(\(\) => \{[\s\S]*?handsFreeController\.state\.phase === 'sleeping'[\s\S]*?wakeHandsFreeByUser\(\);[\s\S]*?handsFreeController\.state\.phase === 'paused'[\s\S]*?resumeHandsFreeByUser\(\);[\s\S]*?pauseHandsFreeByUser\(\);/);
  assert.match(screenSource, /const micButtonLabel = handsFree[\s\S]*?'Wake'[\s\S]*?'Resume'[\s\S]*?'Stop Listening'/);
  assert.match(screenSource, /onPress=\{handsFree && !isWebPlatform \? handleHandsFreePrimaryControl : undefined\}/);
  assert.match(screenSource, /accessibilityLabel="Open hands-free guide"/);
});

test('pauses queued-message auto-processing while handsfree is paused', () => {
  assert.match(screenSource, /const handsFreePhaseRef = useRef<HandsFreePhase>\('sleeping'\);/);
  assert.match(screenSource, /handsFreePhaseRef\.current = handsFreeController\.state\.phase;/);
  assert.match(screenSource, /if \(messageQueueEnabled && \(!handsFree \|\| handsFreePhaseRef\.current !== 'paused'\)\) \{/);
  assert.match(screenSource, /if \(handsFreeRef\.current && handsFreePhaseRef\.current === 'paused'\) \{\s*return;\s*\}[\s\S]*?messageQueue\.markProcessing\(currentConversationId, nextMessage\.id\);/);
});

test('persists same-count final message updates and keeps queued turns on fresh message state', () => {
  assert.match(screenSource, /const \[messages, setMessagesState\] = useState<ChatMessage\[\]>\(\[\]\);/);
  assert.match(screenSource, /messagesRef\.current = resolvedMessages;[\s\S]*?setMessagesState\(resolvedMessages\);/);
  assert.match(screenSource, /const prevPersistedMessagesKeyRef = useRef<string \| null>\(null\);/);
  assert.match(screenSource, /const currentMessagesKey = getLocalMessagesVersionKey\(currentSessionId, messages\);/);
  assert.match(screenSource, /messages\.length > 0 && currentMessagesKey !== prevPersistedMessagesKeyRef\.current/);
  assert.doesNotMatch(screenSource, /prevMessagesLengthRef/);
});

test('merges queued progress messages with final queued response history', () => {
  assert.match(screenSource, /let queuedProgressMessages: ChatMessage\[\] = \[\];[\s\S]*?queuedProgressMessages = progressMessages;/);
  assert.match(screenSource, /if \(queuedProgressMessages\.length > 0 && finalTurnMessages\.length === 0\)/);
  assert.match(screenSource, /preserveDisplayContentFromProgress\(finalTurnMessages, queuedProgressMessages\)/);
});

test('keeps spoken final responses visible after progress and session persistence merges', () => {
  const visibleMergeOccurrences = screenSource.match(/const visibleMergedMessages = applyUserResponseToMessages\(mergedMessages, finalDisplayText\);/g) || [];
  assert.equal(visibleMergeOccurrences.length, 2);
  assert.match(screenSource, /const result = \[\.\.\.beforePlaceholder, \.\.\.visibleMergedMessages\];/);
  assert.match(screenSource, /await sessionStore\.setMessagesForSession\(requestSessionId, finalMessagesForSession\);/);
  assert.match(screenSource, /await sessionStore\.setServerConversationIdForSession\(requestSessionId, responseConversationId\);/);
});

test('relinks existing unlinked sessions before sending follow-ups', () => {
  assert.match(screenSource, /const ensureServerConversationForExistingFollowUp = useCallback/);
  assert.match(screenSource, /Existing session missing serverConversationId before follow-up; syncing before send/);
  assert.match(screenSource, /await sessionStore\.syncWithServer\(settingsClient\)/);
  assert.match(screenSource, /startingServerConversationId = await ensureServerConversationForExistingFollowUp\('send'\)/);
  assert.match(screenSource, /startingServerConversationId = await ensureServerConversationForExistingFollowUp\('queued'\)/);
});

test('plays distinct handsfree cues for ready, prompt, tool, and response milestones', () => {
  assert.match(screenSource, /playHandsFreeCue\('session-ready'\)/);
  assert.match(screenSource, /playHandsFreeCue\('prompt-submitted'\)/);
  assert.match(screenSource, /playHandsFreeCue\('tool-called'\)/);
  assert.match(screenSource, /playHandsFreeCue\('agent-response'\)/);
  assert.match(screenSource, /playProgressToolCallCues\(update, announcedToolCallCueKeys\)/);
  assert.match(screenSource, /playHandsFreeSessionReadyCue\('service-started-event'\)/);
});
