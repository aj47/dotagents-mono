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
  assert.match(responseHistorySource, /createExpandCollapseAccessibilityLabel\('agent responses', !isCollapsed\)/);
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