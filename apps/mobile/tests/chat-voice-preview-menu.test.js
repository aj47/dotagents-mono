const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('keeps transient hands-free speech in a separate voice preview', () => {
  assert.match(screenSource, /const handsFreeVoicePreview = handsFree/);
  assert.match(screenSource, /style=\{styles\.voicePreviewCard\}/);
  assert.match(screenSource, />Voice preview<\/Text>/);
  assert.doesNotMatch(screenSource, /voicePreviewComposerTextRef/);
});

test('preserves typed composer drafts when hands-free sends', () => {
  const sendSection = screenSource.slice(
    screenSource.indexOf('const send = async'),
    screenSource.indexOf('const processQueuedMessage = async')
  );
  assert.match(sendSection, /if \(options\?\.source !== 'handsfree'\) \{\s*setInput\(''\);\s*\}/);
});

test('gives the countdown button one pause action and matching enabled state', () => {
  assert.match(screenSource, /const handleComposerPrimaryAction = useCallback\(\(\) => \{[\s\S]*?hasPendingHandsFreeSend[\s\S]*?pauseHandsFreeByUser\(\)/);
  assert.match(screenSource, /const pauseHandsFreeByUser = useCallback\(\(\) => \{[\s\S]*?setSttPreviewWithExpiry\(''\)[\s\S]*?handsFreeController\.pauseByUser\(\)/);
  assert.match(screenSource, /onPress=\{handleComposerPrimaryAction\}/);
  assert.match(screenSource, /disabled=\{!composerHasContent && !hasPendingHandsFreeSend\}/);
});

test('makes the agent menu vertically scrollable and collapses model controls', () => {
  assert.match(screenSource, /style=\{styles\.chatMenuScroll\}[\s\S]*?showsVerticalScrollIndicator[\s\S]*?nestedScrollEnabled/);
  assert.match(screenSource, /<Text style=\{styles\.chatMenuRowLabel\}>Model settings<\/Text>/);
  assert.match(screenSource, /agentConfigExpanded && \([\s\S]*?styles\.chatMenuAgentConfigPanel/);
});

test('edits wake and sleep phrases in place instead of copying them to the composer', () => {
  assert.match(screenSource, /editable: 'wake' as const/);
  assert.match(screenSource, /editable: 'sleep' as const/);
  assert.match(screenSource, /onEndEditing=\{\(\) => commitEditableVoicePhrase\(entry\.editable\)\}/);
  assert.doesNotMatch(screenSource, /Voice command moved to composer/);
});
