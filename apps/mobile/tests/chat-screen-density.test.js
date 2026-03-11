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

test('gives collapsed mobile tool summaries a larger transcript tap target', () => {
  assert.match(screenSource, /const compactTranscriptTapTarget = createMinimumTouchTargetStyle\([\s\S]*?minSize:\s*32,[\s\S]*?horizontalPadding:\s*spacing\.sm,[\s\S]*?verticalPadding:\s*4,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\)/);
  assert.match(screenSource, /toolCallCompactRow:\s*\{[\s\S]*?\.\.\.compactTranscriptTapTarget,[\s\S]*?width:\s*'100%',[\s\S]*?justifyContent:\s*'flex-start',[\s\S]*?gap:\s*spacing\.xs,/);
  assert.match(screenSource, /toolCallCompactName:\s*\{[\s\S]*?fontSize:\s*11,[\s\S]*?lineHeight:\s*16,/);
});

test('keeps expanded mobile tool headers comfortably tappable and legible', () => {
  assert.match(screenSource, /toolCallHeader:\s*\{[\s\S]*?\.\.\.compactTranscriptTapTarget,[\s\S]*?justifyContent:\s*'space-between',[\s\S]*?gap:\s*spacing\.xs,/);
  assert.match(screenSource, /toolName:\s*\{[\s\S]*?fontSize:\s*11,[\s\S]*?lineHeight:\s*16,/);
  assert.match(screenSource, /toolCallExpandHint:\s*\{[\s\S]*?fontSize:\s*11,[\s\S]*?lineHeight:\s*16,/);
});
