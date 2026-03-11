const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('keeps agent selection in the navigation header for the mobile chat screen', () => {
  assert.match(screenSource, /headerTitle:\s*\(\) => \(/);
  assert.match(screenSource, /accessibilityLabel=\{`Current agent: \$\{currentAgentLabel\}\. Tap to change\.`\}/);
  assert.match(screenSource, /\{currentAgentLabel\} ▼/);
});

test('does not render a duplicate composer agent chip above the mobile chat input row', () => {
  assert.doesNotMatch(screenSource, /styles\.agentSelectorRow/);
  assert.doesNotMatch(screenSource, /🤖 Agent/);
  assert.doesNotMatch(screenSource, /agentSelectorChip(Label|Value)?:/);
});

test('keeps the live voice overlay compact by grouping status and transcript into one card', () => {
  assert.match(screenSource, /\{listening && \([\s\S]*?<View style=\{styles\.overlayCard\}>[\s\S]*?<Text style=\{styles\.overlayText\}>/);
  assert.match(screenSource, /overlayCard:\s*\{[\s\S]*?maxWidth:\s*'88%',[\s\S]*?paddingHorizontal:\s*12,[\s\S]*?paddingVertical:\s*8,/);
});

test('caps live transcript height so the recording overlay is less likely to cover the chat surface', () => {
  assert.match(screenSource, /<Text style=\{styles\.overlayTranscript\} numberOfLines=\{3\}>/);
  assert.match(screenSource, /overlayTranscript:\s*\{[\s\S]*?marginTop:\s*4,[\s\S]*?lineHeight:\s*16,[\s\S]*?opacity:\s*0\.92,/);
});

test('guards debug info rendering with a boolean check so empty strings do not create stray text nodes on web', () => {
  assert.match(screenSource, /const hasDebugInfo = debugInfo\.trim\(\)\.length > 0;/);
  assert.match(screenSource, /\{hasDebugInfo && \([\s\S]*?<Text style=\{styles\.debugText\}>\{debugInfo\}<\/Text>/);
  assert.doesNotMatch(screenSource, /\{debugInfo && \(/);
});

test('lets the chat header agent sheet deep-link directly to connection settings when switching is blocked', () => {
  assert.match(screenSource, /<AgentSelectorSheet[\s\S]*?visible=\{agentSelectorVisible\}[\s\S]*?onOpenConnectionSettings=\{\(\) => navigation\.navigate\('ConnectionSettings'\)\}/);
});

test('moves secondary chat header actions into an overflow sheet on narrow mobile widths', () => {
  assert.match(screenSource, /const \[headerActionsVisible, setHeaderActionsVisible\] = useState\(false\);/);
  assert.match(screenSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open chat actions'\)\}/);
  assert.match(screenSource, /<Modal[\s\S]*?visible=\{headerActionsVisible\}[\s\S]*?Chat actions[\s\S]*?Open settings[\s\S]*?Emergency stop/);
  assert.doesNotMatch(screenSource, /accessibilityLabel="Emergency stop - kill all agent sessions"/);
});
