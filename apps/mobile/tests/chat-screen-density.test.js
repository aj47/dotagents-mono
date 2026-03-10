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

test('scales the mobile chat mic control down on compact viewports to protect transcript space', () => {
  assert.match(screenSource, /function createStyles\(theme: Theme, screenHeight: number, screenWidth: number\)/);
  assert.match(screenSource, /const isCompactViewport = screenWidth <= 430;/);
  assert.match(screenSource, /const micButtonHeight = Math\.min\([\s\S]*?Math\.round\(screenHeight \* \(isCompactViewport \? 0\.14 : 0\.16\)\),[\s\S]*?isCompactViewport \? 96 : 104,[\s\S]*?isCompactViewport \? 128 : 144,[\s\S]*?\);/);
  assert.match(screenSource, /inputRow:\s*\{[\s\S]*?paddingVertical:\s*composerRowVerticalPadding,/);
});

test('keeps the failed-send retry banner text-first and more compact on the mobile chat screen', () => {
  assert.match(screenSource, /<View style=\{\[styles\.connectionBanner, styles\.connectionBannerFailed, styles\.retryBanner\]\}>/);
  assert.doesNotMatch(screenSource, /<Text style=\{styles\.connectionBannerIcon\}>⚠️<\/Text>/);
  assert.match(screenSource, /Retry when you're ready/);
  assert.match(screenSource, /retryBanner:\s*\{[\s\S]*?paddingHorizontal:\s*spacing\.sm,[\s\S]*?paddingVertical:\s*spacing\.xs,/);
  assert.match(screenSource, /retryButtonCompact:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?paddingHorizontal:\s*spacing\.sm,[\s\S]*?marginLeft:\s*0,/);
});
