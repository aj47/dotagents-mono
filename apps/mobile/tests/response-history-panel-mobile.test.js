const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const responseHistorySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ResponseHistoryPanel.tsx'),
  'utf8'
);

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('gives the response history disclosure a minimum mobile touch target and explicit semantics', () => {
  assert.match(responseHistorySource, /const historyHeaderTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(responseHistorySource, /header:\s*\{[\s\S]*?\.\.\.historyHeaderTouchTarget[\s\S]*?justifyContent:\s*'space-between'/);
  assert.match(responseHistorySource, /const responseCountLabel = responses\.length === 1 \? '1 response' : `\$\{responses\.length\} responses`;/);
  assert.match(responseHistorySource, /const responseHistoryDisclosureLabel = `\$\{createExpandCollapseAccessibilityLabel\('agent responses', !isCollapsed\)\}\. \$\{responseCountLabel\}\. \$\{headerStatusText\}\.`;/);
  assert.match(responseHistorySource, /accessibilityLabel=\{responseHistoryDisclosureLabel\}/);
  assert.match(responseHistorySource, /accessibilityHint=\{responseHistoryDisclosureHint\}/);
  assert.match(responseHistorySource, /accessibilityState=\{\{ expanded: !isCollapsed \}\}/);
});

test('gives per-response speak controls a mobile touch target and clearer playback semantics', () => {
  assert.match(responseHistorySource, /const responseSpeakTouchTarget = createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\);/);
  assert.match(responseHistorySource, /speakButton:\s*\{[\s\S]*?\.\.\.responseSpeakTouchTarget[\s\S]*?borderRadius:\s*999/);
  assert.match(responseHistorySource, /speakButtonActive:\s*\{[\s\S]*?theme\.colors\.primary/);
  assert.match(responseHistorySource, /function formatResponseAccessibilityContext\(text: string, timestampLabel: string\): string \{[\s\S]*?const normalizedText = text\.replace\(/);
  assert.match(responseHistorySource, /const responseAccessibilityContext = formatResponseAccessibilityContext\(response\.text, responseTimestampLabel\);/);
  assert.match(responseHistorySource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\([\s\S]*?Stop speaking response \$\{responseAccessibilityContext\}[\s\S]*?Speak response \$\{responseAccessibilityContext\} aloud[\s\S]*?\)/);
  assert.match(responseHistorySource, /accessibilityHint=\{isSpeaking[\s\S]*?Stops text to speech for this agent response\.[\s\S]*?Reads the latest agent response aloud with text to speech\.[\s\S]*?Reads this agent response aloud with text to speech\./);
  assert.match(responseHistorySource, /accessibilityState=\{\{ selected: isSpeaking \}\}/);
});

test('surfaces response recency and active playback state directly in the history header', () => {
  assert.match(responseHistorySource, /const headerStatusText = speakingIndex !== null[\s\S]*?'Speaking now'[\s\S]*?`Latest \$\{formatTime\(newestTimestamp, false\)\}`/);
  assert.match(responseHistorySource, /headerLeft:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0/);
  assert.match(responseHistorySource, /headerTitleGroup:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0/);
  assert.match(responseHistorySource, /headerStatusText:\s*\{[\s\S]*?fontSize:\s*12,[\s\S]*?color:\s*theme\.colors\.mutedForeground,[\s\S]*?lineHeight:\s*16/);
  assert.match(responseHistorySource, /headerStatusTextActive:\s*\{[\s\S]*?color:\s*theme\.colors\.primary,[\s\S]*?fontWeight:\s*'600'/);
  assert.match(responseHistorySource, /style=\{\[styles\.headerStatusText, speakingIndex !== null && styles\.headerStatusTextActive\]\}[\s\S]*?numberOfLines=\{1\}[\s\S]*?ellipsizeMode="tail"[\s\S]*?\{headerStatusText\}/);
});

test('caps expanded response history height relative to the viewport so it does not take over shorter mobile screens', () => {
  assert.match(responseHistorySource, /useWindowDimensions/);
  assert.match(responseHistorySource, /const \{ height: windowHeight \} = useWindowDimensions\(\);/);
  assert.match(responseHistorySource, /const historyListMaxHeight = Math\.min\(300, Math\.max\(200, Math\.round\(windowHeight \* 0\.35\)\)\);/);
  assert.match(responseHistorySource, /list:\s*\{[\s\S]*?maxHeight:\s*historyListMaxHeight,/);
});

test('uses minute-precision timestamps in each response row to reduce narrow-screen noise', () => {
  assert.match(responseHistorySource, /const formatTime = \(timestamp: number, includeSeconds = true\) =>/);
  assert.match(responseHistorySource, /const responseTimestampLabel = formatTime\(response\.timestamp, false\);/);
  assert.match(responseHistorySource, /<Text style=\{\[styles\.timestamp, isLatest && styles\.timestampLatest\]\}>[\s\S]*?\{responseTimestampLabel\}[\s\S]*?<\/Text>/);
});

test('marks the newest response row with a compact latest badge for same-minute scanning', () => {
  assert.match(responseHistorySource, /const newestOriginalIndex = responses\.length - 1;/);
  assert.match(responseHistorySource, /const isLatest = originalIndex === newestOriginalIndex;/);
  assert.match(responseHistorySource, /const shouldShowLatestBadge = isLatest && !isSpeaking;/);
  assert.match(responseHistorySource, /responseMeta:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?alignItems:\s*'center',[\s\S]*?gap:\s*6/);
  assert.match(responseHistorySource, /timestampLatest:\s*\{[\s\S]*?color:\s*theme\.colors\.primary,[\s\S]*?fontWeight:\s*'600'/);
  assert.match(responseHistorySource, /latestBadge:\s*\{[\s\S]*?borderRadius:\s*999,[\s\S]*?backgroundColor:\s*`\$\{theme\.colors\.primary\}12`/);
  assert.match(responseHistorySource, /<View style=\{styles\.responseMeta\}>[\s\S]*?<Text style=\{\[styles\.timestamp, isLatest && styles\.timestampLatest\]\}>[\s\S]*?\{shouldShowLatestBadge \? \([\s\S]*?<Text style=\{styles\.latestBadgeText\}>Latest<\/Text>/);
});

test('adds an inline speaking badge so the active playback row is obvious on narrow screens', () => {
  assert.match(responseHistorySource, /const isSpeaking = speakingIndex === originalIndex;/);
  assert.match(responseHistorySource, /speakingBadge:\s*\{[\s\S]*?borderRadius:\s*999,[\s\S]*?backgroundColor:\s*`\$\{theme\.colors\.primary\}18`/);
  assert.match(responseHistorySource, /speakingBadgeText:\s*\{[\s\S]*?fontWeight:\s*'700',[\s\S]*?color:\s*theme\.colors\.primary/);
  assert.match(responseHistorySource, /\{isSpeaking \? \([\s\S]*?<Text style=\{styles\.speakingBadgeText\}>Speaking<\/Text>[\s\S]*?\) : null\}/);
});

test('keeps response-history controls usable while the chat keyboard is open', () => {
  assert.match(responseHistorySource, /<ScrollView[\s\S]*?style=\{styles\.list\}[\s\S]*?keyboardShouldPersistTaps="handled"[\s\S]*?keyboardDismissMode="on-drag"/);
});

test('resets response-history playback and collapse state when the active conversation changes', () => {
  assert.match(responseHistorySource, /interface ResponseHistoryPanelProps \{[\s\S]*?conversationId: string;[\s\S]*?responses: ResponseHistoryEntry\[];/);
  assert.match(responseHistorySource, /const previousConversationIdRef = useRef\(conversationId\);/);
  assert.match(responseHistorySource, /useEffect\(\(\) => \{[\s\S]*?if \(previousConversationIdRef\.current === conversationId\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?previousConversationIdRef\.current = conversationId;[\s\S]*?setIsCollapsed\(true\);[\s\S]*?nextSpeechRequestId\(\);[\s\S]*?Speech\.stop\(\);[\s\S]*?safeSetSpeakingIndex\(null\);[\s\S]*?\}, \[conversationId, nextSpeechRequestId, safeSetSpeakingIndex\]\);/);
  assert.match(chatScreenSource, /<ResponseHistoryPanel[\s\S]*?conversationId=\{currentConversationId\}[\s\S]*?responses=\{respondToUserHistory\}/);
});
