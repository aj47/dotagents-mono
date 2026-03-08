const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const responseHistorySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ResponseHistoryPanel.tsx'),
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
  assert.match(responseHistorySource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\([\s\S]*?Stop speaking this response[\s\S]*?Speak this response aloud[\s\S]*?\)/);
  assert.match(responseHistorySource, /accessibilityHint=\{isSpeaking[\s\S]*?Stops text to speech for this agent response\.[\s\S]*?Reads this agent response aloud with text to speech\./);
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